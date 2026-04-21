/// <reference lib="webworker" />
import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

type WorkerMsg =
  | { type: "transcribe"; audio: Float32Array; model: string; language: string }
  | { type: "warmup"; model: string };

type WorkerOut =
  | { type: "progress"; stage: string; progress: number; message?: string }
  | { type: "ready"; model: string }
  | { type: "result"; chunks: Array<{ text: string; start: number; end: number }>; text: string }
  | { type: "error"; message: string };

let transcriber: Awaited<ReturnType<typeof pipeline>> | null = null;
let currentModel = "";

const post = (msg: WorkerOut) => (self as unknown as Worker).postMessage(msg);

async function ensureModel(model: string) {
  if (transcriber && currentModel === model) return;
  currentModel = model;

  // Track per-file progress so the bar moves even when some files lack
  // a `progress` event (small files may jump straight from initiate → done).
  const fileProgress: Record<string, number> = {};
  const reportAggregate = (file?: string) => {
    const files = Object.keys(fileProgress);
    if (files.length === 0) return;
    const avg = files.reduce((a, k) => a + fileProgress[k], 0) / files.length;
    post({
      type: "progress",
      stage: "download",
      progress: avg / 100,
      message: file ?? files[files.length - 1],
    });
  };

  post({ type: "progress", stage: "download", progress: 0, message: "connecting…" });

  transcriber = await pipeline("automatic-speech-recognition", model, {
    progress_callback: (p: {
      status?: string;
      file?: string;
      progress?: number;
      loaded?: number;
      total?: number;
      name?: string;
    }) => {
      const file = p.file ?? p.name ?? "model";
      switch (p.status) {
        case "initiate":
          fileProgress[file] = 0;
          reportAggregate(file);
          break;
        case "download":
          fileProgress[file] = Math.max(fileProgress[file] ?? 0, 1);
          reportAggregate(file);
          break;
        case "progress": {
          const pct =
            typeof p.progress === "number"
              ? p.progress
              : p.loaded && p.total
              ? (p.loaded / p.total) * 100
              : fileProgress[file] ?? 0;
          fileProgress[file] = pct;
          reportAggregate(file);
          break;
        }
        case "done":
          fileProgress[file] = 100;
          reportAggregate(file);
          break;
        case "ready":
          post({ type: "ready", model });
          break;
      }
    },
  });
  post({ type: "ready", model });
}

self.onmessage = async (e: MessageEvent<WorkerMsg>) => {
  const msg = e.data;
  try {
    if (msg.type === "warmup") {
      await ensureModel(msg.model);
      return;
    }
    if (msg.type === "transcribe") {
      await ensureModel(msg.model);
      if (!transcriber) throw new Error("Model not loaded");

      post({ type: "progress", stage: "transcribe", progress: 0 });

      // transformers.js pipeline types have strict overloads; cast to a
      // permissive callable shape so we can pass a raw Float32Array.
      const call = transcriber as unknown as (
        input: Float32Array,
        opts: Record<string, unknown>
      ) => Promise<{ text: string; chunks?: Array<{ text: string; timestamp: [number, number | null] }> }>;
      const output = await call(msg.audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        language: msg.language,
        task: "transcribe",
      });

      const rawChunks = output.chunks ?? [];
      const chunks = rawChunks
        .map((c, i) => {
          const start = c.timestamp[0] ?? 0;
          const end = c.timestamp[1] ?? rawChunks[i + 1]?.timestamp[0] ?? start + 2;
          return { text: c.text.trim(), start, end };
        })
        .filter((c) => c.text.length > 0);

      post({ type: "result", chunks, text: output.text });
    }
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};

export {};
