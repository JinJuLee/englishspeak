import type { TranscribeProgress } from "../lib/transcribe";

type Props = {
  fileName: string;
  phase: "decoding" | "transcribing";
  progress: TranscribeProgress | null;
};

export function ProgressCard({ fileName, phase, progress }: Props) {
  const pct =
    progress && "progress" in progress && typeof progress.progress === "number"
      ? Math.round(progress.progress * 100)
      : null;
  const label =
    phase === "decoding"
      ? "Decoding audio…"
      : progress?.stage === "download"
      ? `Downloading Whisper model${progress.message ? ` · ${progress.message}` : ""}`
      : progress?.stage === "ready"
      ? "Model loaded, transcribing…"
      : progress?.stage === "transcribe"
      ? "Transcribing audio…"
      : "Preparing model…";

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-gray-900 truncate">{fileName}</div>
        {pct !== null && <div className="text-sm text-gray-500 tabular-nums">{pct}%</div>}
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: pct !== null ? `${pct}%` : "30%" }}
        />
      </div>
      <div className="text-sm text-gray-600 mt-3">{label}</div>
      {phase === "transcribing" && progress?.stage === "download" && (
        <div className="text-xs text-gray-400 mt-2">
          First run downloads ~150MB model. It's cached in the browser for next time.
        </div>
      )}
    </div>
  );
}
