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
      className={`group flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all px-8 py-16 text-center
        ${drag ? "border-accent bg-accentSoft" : "border-gray-300 bg-white hover:border-accent hover:bg-accentSoft/40"}`}
    >
      <input
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="text-5xl mb-4">🎧</div>
      <div className="text-lg font-semibold text-gray-800">Drop an mp3 here, or click to upload</div>
      <div className="text-sm text-gray-500 mt-1">
        Whisper will transcribe it and split it into sentences automatically
      </div>
    </label>
  );
}
