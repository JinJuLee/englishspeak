import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "requesting" | "recording" | "denied" | "error";

export type RecorderResult = {
  blob: Blob;
  duration: number;
};

export function useRecorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const resolveRef = useRef<((r: RecorderResult) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
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
    if (status === "recording") return;
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
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
        const duration = (performance.now() - startTimeRef.current) / 1000;
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

      startTimeRef.current = performance.now();
      recorder.start();
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
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      rec.stop();
    });
  }, []);

  return { status, elapsed, error, start, stop };
}
