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
      <header className="w-full border-b border-line">
        <div className="max-w-reader mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span aria-hidden className="text-base leading-none translate-y-[1px]">🪄</span>
            <span className="font-reader text-lg text-ink">SpeakLoop</span>
            <span className="text-[11px] uppercase tracking-widest text-ink-faint">shadowing player</span>
          </div>
          {phase === "ready" && fileName && (
            <span className="text-xs text-ink-muted truncate max-w-[40%]">{fileName}</span>
          )}
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-reader mx-auto px-6 pb-48">
          {phase === "idle" && (
            <>
              <section className="py-16">
                <h1 className="font-reader text-4xl md:text-5xl text-ink leading-tight mb-4">
                  Drill English one sentence at a time.
                </h1>
                <p className="text-ink-soft text-lg leading-relaxed max-w-xl">
                  Drop an mp3. SpeakLoop transcribes it in your browser and turns every
                  sentence into a loop you can repeat as many times as you want.
                </p>
              </section>
              <FileDrop onFile={handleFile} />
              <section className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-ink-soft">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">Private</div>
                  <p>Audio never leaves your browser. No account, no upload.</p>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">No keys</div>
                  <p>Whisper runs locally via WebGPU. Nothing to configure.</p>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-ink-muted mb-2">Built for shadowing</div>
                  <p>Per-sentence repeat, auto-advance, adjustable gap and speed.</p>
                </div>
              </section>
            </>
          )}

          {(phase === "decoding" || phase === "transcribing") && (
            <ProgressCard fileName={fileName} phase={phase} progress={progress} />
          )}

          {phase === "error" && (
            <div className="py-16">
              <div className="text-[11px] uppercase tracking-widest text-ink-muted mb-3">Error</div>
              <div className="font-reader text-xl text-ink mb-4">Something went wrong.</div>
              <div className="text-sm text-ink-soft mb-6 leading-relaxed">{error}</div>
              <button
                onClick={reset}
                className="text-sm text-ink underline underline-offset-4 hover:text-ink-soft"
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
              <div className="mt-8">
                <SentenceList
                  sentences={sentences}
                  currentId={looper.state.currentId}
                  onPick={(id) => looper.playSentence(id, true)}
                />
              </div>
            </>
          )}
        </div>

        {audioUrl && (
          <audio
            ref={(el) => looper.setAudio(el)}
            src={audioUrl}
            preload="auto"
            hidden
          />
        )}
      </main>

      <div className="py-6 text-center text-[11px] tracking-[0.2em] uppercase text-ink-faint">
        PearlLeeStudio
      </div>

      {phase === "ready" && (
        <footer className="fixed bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none">
          <div className="max-w-reader mx-auto pointer-events-auto">
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
