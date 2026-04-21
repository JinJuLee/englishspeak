import { useCallback, useState } from "react";

type Props = {
  onFile: (file: File) => void;
};

export function FileDrop({ onFile }: Props) {
  const [drag, setDrag] = useState(false);

  const handle = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (!f.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|flac|webm)$/i.test(f.name)) {
        alert("Please drop an audio file (mp3, m4a, wav, ogg, flac).");
        return;
      }
      onFile(f);
    },
    [onFile]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center w-full cursor-pointer transition-colors rounded-2xl border-2 border-dashed px-8 py-20 text-center
        ${drag ? "border-ink/50 bg-ink/[0.03]" : "border-line hover:border-ink/30 hover:bg-ink/[0.015]"}`}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="text-5xl mb-5" aria-hidden>🎧</div>
      <div className="font-reader text-2xl text-ink mb-2">Drop an audio file</div>
      <div className="text-sm text-ink-muted max-w-sm">
        mp3, m4a, wav · transcribed locally with Whisper · your audio never leaves the browser
      </div>
    </label>
  );
}
