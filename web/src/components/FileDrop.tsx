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
      className={`flex flex-col items-center justify-center w-full cursor-pointer transition-colors px-8 py-24 text-center border-t border-b
        ${drag ? "border-ink/40 bg-ink/[0.02]" : "border-line hover:bg-ink/[0.015]"}`}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="font-reader text-2xl text-ink mb-2">Drop an audio file</div>
      <div className="text-sm text-ink-muted max-w-sm">
        mp3, m4a, wav · transcribed locally with Whisper · your audio never leaves the browser
      </div>
    </label>
  );
}
