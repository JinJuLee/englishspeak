import { useCallback, useEffect, useRef, useState } from "react";
import { useRecorder } from "../lib/useRecorder";
import { deleteRecording, getRecording, saveRecording } from "../lib/recordingStore";

type Props = {
  fileKey: string;
  sentenceId: number;
  onPlayOriginal: () => void;
  onBeforeRecord?: () => void;
  onRecorded?: () => void;
  onDeleted?: () => void;
};

export function RecordControls({
  fileKey,
  sentenceId,
  onPlayOriginal,
  onBeforeRecord,
  onRecorded,
  onDeleted,
}: Props) {
  const { status, elapsed, error, start, stop } = useRecorder();
  const [hasRecording, setHasRecording] = useState(false);
  const [playingMine, setPlayingMine] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const row = await getRecording(fileKey, sentenceId);
      if (!cancelled) setHasRecording(!!row);
    })();
    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [fileKey, sentenceId]);

  const stopMine = useCallback(() => {
    audioRef.current?.pause();
    setPlayingMine(false);
  }, []);

  const handleRecord = useCallback(async () => {
    if (status === "recording") {
      const result = await stop();
      if (result) {
        await saveRecording(fileKey, sentenceId, result.blob, result.duration);
        setHasRecording(true);
        onRecorded?.();
      }
      return;
    }
    // Silence everything before mic opens — mic would otherwise pick up
    // the speakers.
    stopMine();
    onBeforeRecord?.();
    await start();
  }, [fileKey, onBeforeRecord, onRecorded, sentenceId, start, status, stop, stopMine]);

  const playOriginalAndStopMine = useCallback(() => {
    stopMine();
    onPlayOriginal();
  }, [onPlayOriginal, stopMine]);

  const playMine = useCallback(async () => {
    const row = await getRecording(fileKey, sentenceId);
    if (!row) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(row.blob);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    onBeforeRecord?.();
    setPlayingMine(true);
    audio.onended = () => setPlayingMine(false);
    audio.onerror = () => setPlayingMine(false);
    audio.play().catch(() => setPlayingMine(false));
  }, [fileKey, onBeforeRecord, sentenceId]);

  const removeMine = useCallback(async () => {
    await deleteRecording(fileKey, sentenceId);
    setHasRecording(false);
    onDeleted?.();
  }, [fileKey, onDeleted, sentenceId]);

  return (
    <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
      <ActionButton
        onClick={playOriginalAndStopMine}
        label="Original"
        disabled={status === "recording"}
      >
        <PlayIcon />
        Original
      </ActionButton>

      {status === "recording" ? (
        <ActionButton primary onClick={handleRecord} label="Stop recording" tone="red">
          <StopIcon />
          <span className="tabular-nums">{elapsed.toFixed(1)}s</span>
        </ActionButton>
      ) : (
        <ActionButton
          primary
          onClick={handleRecord}
          label={hasRecording ? "Re-record" : "Record"}
          tone="amber"
          disabled={status === "requesting"}
        >
          <MicIcon />
          {status === "requesting" ? "Allow mic…" : hasRecording ? "Re-record" : "Record"}
        </ActionButton>
      )}

      {hasRecording && status !== "recording" && (
        <>
          {playingMine ? (
            <ActionButton onClick={stopMine} label="Stop mine">
              <StopIcon />
              Mine
            </ActionButton>
          ) : (
            <ActionButton onClick={playMine} label="Play mine">
              <PlayIcon />
              Mine
            </ActionButton>
          )}
          <button
            onClick={removeMine}
            className="text-xs text-ink-faint hover:text-ink-soft px-2"
            title="Delete recording"
          >
            Delete
          </button>
        </>
      )}

      {status === "denied" && (
        <span className="text-xs text-red-600 ml-2">Microphone denied — check browser settings.</span>
      )}
      {status === "error" && error && (
        <span className="text-xs text-red-600 ml-2">{error}</span>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  label,
  primary,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
  tone?: "amber" | "red";
  disabled?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full border transition-colors disabled:opacity-40";
  const palette = primary
    ? tone === "red"
      ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
      : tone === "amber"
      ? "bg-amber-400 text-ink border-amber-400 hover:bg-amber-500"
      : "bg-ink text-page border-ink hover:bg-ink-soft"
    : "bg-page text-ink-soft border-line hover:border-ink/30 hover:text-ink";
  return (
    <button onClick={onClick} title={label} disabled={disabled} className={`${base} ${palette}`}>
      {children}
    </button>
  );
}

function PlayIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
}
function StopIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>;
}
function MicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
    </svg>
  );
}
