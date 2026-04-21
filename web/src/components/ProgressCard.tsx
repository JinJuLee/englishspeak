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
      ? "Decoding audio"
      : progress?.stage === "download"
      ? `Downloading model${progress.message ? ` · ${progress.message}` : ""}`
      : progress?.stage === "ready"
      ? "Model loaded"
      : progress?.stage === "transcribe"
      ? "Transcribing"
      : "Preparing";

  return (
    <div className="w-full py-10">
      <div className="text-xs uppercase tracking-widest text-ink-muted mb-3">{label}</div>
      <div className="font-reader text-xl text-ink truncate mb-6">{fileName}</div>
      <div className="h-[3px] w-full bg-line relative overflow-hidden rounded-full">
        <div
          className="h-full bg-amber-400 transition-all duration-500 rounded-full"
          style={{ width: pct !== null ? `${pct}%` : "30%" }}
        />
      </div>
      <div className="flex justify-between mt-3 text-xs text-ink-muted tabular-nums">
        <span>{phase === "decoding" ? "" : progress?.stage === "transcribe" ? "running in browser" : ""}</span>
        {pct !== null && <span>{pct}%</span>}
      </div>
      {phase === "transcribing" && progress?.stage === "download" && (
        <div className="text-xs text-ink-faint mt-6 leading-relaxed">
          First run downloads ~150&nbsp;MB of Whisper weights. It stays cached for next time.
        </div>
      )}
    </div>
  );
}
