export type Sentence = {
  id: number;
  text: string;
  start: number;
  end: number;
};

export type TranscribeProgress =
  | { stage: "load"; progress: number; message?: string }
  | { stage: "download"; progress: number; message?: string }
  | { stage: "decode"; progress: number }
  | { stage: "transcribe"; progress: number }
  | { stage: "ready" };

const DEFAULT_MODEL = "onnx-community/whisper-base";

let worker: Worker | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./transcribe.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

export async function decodeAudioFile(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC({ sampleRate: 16000 });
  const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  // downmix to mono
  const channels = decoded.numberOfChannels;
  const length = decoded.length;
  const out = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < length; i++) out[i] += data[i] / channels;
  }
  ctx.close().catch(() => {});
  return out;
}

/**
 * Merge short Whisper chunks into sentence-like units by end-of-sentence
 * punctuation. Whisper often emits half-sentences; merging gives cleaner
 * shadowing units.
 */
export function groupIntoSentences(
  chunks: Array<{ text: string; start: number; end: number }>
): Sentence[] {
  const sentences: Sentence[] = [];
  let buf: { text: string; start: number; end: number } | null = null;

  const isTerminal = (t: string) => /[.!?](["')\]]*)\s*$/.test(t);

  for (const c of chunks) {
    if (!buf) {
      buf = { ...c };
    } else {
      buf.text = (buf.text + " " + c.text).replace(/\s+/g, " ").trim();
      buf.end = c.end;
    }
    if (isTerminal(buf.text)) {
      sentences.push({ id: sentences.length, ...buf });
      buf = null;
    }
  }
  if (buf) sentences.push({ id: sentences.length, ...buf });
  return sentences;
}

export function transcribe(
  audio: Float32Array,
  opts: { language?: string; model?: string; onProgress?: (p: TranscribeProgress) => void } = {}
): Promise<Sentence[]> {
  const w = getWorker();
  const model = opts.model ?? DEFAULT_MODEL;
  const language = opts.language ?? "en";

  return new Promise((resolve, reject) => {
    const onMessage = (ev: MessageEvent) => {
      const m = ev.data;
      if (m.type === "progress") {
        opts.onProgress?.({
          stage: m.stage,
          progress: m.progress,
          message: m.message,
        } as TranscribeProgress);
      } else if (m.type === "ready") {
        opts.onProgress?.({ stage: "ready" });
      } else if (m.type === "result") {
        cleanup();
        resolve(groupIntoSentences(m.chunks));
      } else if (m.type === "error") {
        cleanup();
        reject(new Error(m.message));
      }
    };
    const cleanup = () => w.removeEventListener("message", onMessage);
    w.addEventListener("message", onMessage);
    w.postMessage({ type: "transcribe", audio, model, language });
  });
}
