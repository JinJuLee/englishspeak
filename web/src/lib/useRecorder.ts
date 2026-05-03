import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "requesting" | "warming" | "recording" | "denied" | "error";

export type RecorderResult = {
  blob: Blob;
  duration: number;
};

// MediaRecorder is started immediately on stream acquisition and runs
// silently for this long before we tell the user to start speaking. This
// covers both the input device's auto-gain settle time and the encoder's
// internal warmup, which together swallow the first ~0.5–1.5s of speech
// when recorder.start() is the click→speak hot path.
const WARMUP_MS = 800;

export function useRecorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const warmupTimerRef = useRef<number | null>(null);
  const warmupResolveRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);
  const resolveRef = useRef<((r: RecorderResult) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (warmupTimerRef.current !== null) {
      window.clearTimeout(warmupTimerRef.current);
      warmupTimerRef.current = null;
    }
    if (warmupResolveRef.current) {
      warmupResolveRef.current();
      warmupResolveRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async (): Promise<void> => {
    setError(null);
    if (status === "recording" || status === "warming" || status === "requesting") return;
    cancelledRef.current = false;
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // Display duration excludes the silent pre-roll captured during
        // warming so the saved length matches what the user saw on the
        // timer.
        const duration = Math.max((performance.now() - startTimeRef.current) / 1000, 0);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanup();
        setStatus("idle");
        setElapsed(0);
        resolveRef.current?.({ blob, duration });
        resolveRef.current = null;
      };
      recorder.onerror = (e) => {
        setError((e as ErrorEvent).message || "Recorder error");
        cleanup();
        setStatus("error");
      };

      // Start the encoder NOW and let it run silently through warmup —
      // by the time we flip to "recording", chunks are already flowing
      // and the first frames of the user's speech survive.
      recorder.start();
      setStatus("warming");
      await new Promise<void>((resolve) => {
        warmupResolveRef.current = resolve;
        warmupTimerRef.current = window.setTimeout(resolve, WARMUP_MS);
      });
      warmupResolveRef.current = null;
      warmupTimerRef.current = null;

      if (cancelledRef.current || !recorderRef.current) return;

      startTimeRef.current = performance.now();
      setStatus("recording");
      timerRef.current = window.setInterval(() => {
        setElapsed((performance.now() - startTimeRef.current) / 1000);
      }, 100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus(msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("not allowed") ? "denied" : "error");
      cleanup();
    }
  }, [cleanup, status]);

  const stop = useCallback((): Promise<RecorderResult | null> => {
    if (status === "warming" || status === "requesting") {
      cancelledRef.current = true;
      cleanup();
      setStatus("idle");
      setElapsed(0);
      return Promise.resolve(null);
    }
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      rec.stop();
    });
  }, [cleanup, status]);

  return { status, elapsed, error, start, stop };
}
