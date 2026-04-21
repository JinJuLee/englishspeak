import { useCallback, useEffect, useState } from "react";
import { FileDrop } from "./components/FileDrop";
import { ProgressCard } from "./components/ProgressCard";
import { SentenceList } from "./components/SentenceList";
import { ControlBar } from "./components/ControlBar";
import { NowReading } from "./components/NowReading";
import { decodeAudioFile, transcribe, type Sentence, type TranscribeProgress } from "./lib/transcribe";
import { useAudioLooper, type LooperOptions } from "./lib/useAudioLooper";

type Phase = "idle" | "decoding" | "transcribing" | "ready" | "error";

export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [progress, setProgress] = useState<TranscribeProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<LooperOptions>({
    repeatCount: 3,
    autoAdvance: true,
    speed: 1,
    gapMs: 400,
  });

  const looper = useAudioLooper(sentences);

  useEffect(() => {
    looper.setOptions(options);
  }, [options, looper]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);
    setPhase("decoding");
    setProgress(null);

    try {
      const url = URL.createObjectURL(file);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      const audio = await decodeAudioFile(file);
      setPhase("transcribing");

      const result = await transcribe(audio, {
        language: "en",
        onProgress: (p) => setProgress(p),
      });
      setSentences(result);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }, []);

  const reset = () => {
    looper.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSentences([]);
    setFileName("");
    setProgress(null);
    setError(null);
    setPhase("idle");
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="py-8 px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SpeakLoop</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload an mp3 · auto-split into sentences · repeat until it sticks
        </p>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pb-40 flex flex-col gap-6">
        {phase === "idle" && <FileDrop onFile={handleFile} />}

        {(phase === "decoding" || phase === "transcribing") && (
          <ProgressCard fileName={fileName} phase={phase} progress={progress} />
        )}

        {phase === "error" && (
          <div className="rounded-2xl bg-red-50 border border-red-200 text-red-800 p-6">
            <div className="font-medium">Something went wrong</div>
            <div className="text-sm mt-1">{error}</div>
            <button
              onClick={reset}
              className="mt-3 text-sm text-red-700 underline hover:text-red-900"
            >
              Try another file
            </button>
          </div>
        )}

        {phase === "ready" && (
          <>
            <NowReading
              sentence={sentences.find((s) => s.id === looper.state.currentId) ?? null}
              repeatsDone={looper.state.repeatsDone}
              repeatCount={options.repeatCount}
              subscribePosition={looper.subscribePosition}
            />
            <SentenceList
              sentences={sentences}
              currentId={looper.state.currentId}
              repeatsDone={looper.state.repeatsDone}
              repeatCount={options.repeatCount}
              onPick={(id) => looper.playSentence(id, true)}
            />
          </>
        )}

        {audioUrl && (
          <audio
            ref={(el) => looper.setAudio(el)}
            src={audioUrl}
            preload="auto"
            hidden
          />
        )}
      </main>

      {phase === "ready" && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <ControlBar
              playing={looper.state.playing}
              options={options}
              onOptions={(p) => setOptions((o) => ({ ...o, ...p }))}
              onPlay={looper.play}
              onPause={looper.pause}
              onPrev={looper.prev}
              onNext={looper.next}
              onReset={reset}
            />
          </div>
        </footer>
      )}
    </div>
  );
}
