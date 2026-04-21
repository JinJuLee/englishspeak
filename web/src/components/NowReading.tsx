import { useEffect, useRef } from "react";
import type { Sentence } from "../lib/transcribe";
import { RecordControls } from "./RecordControls";

type Props = {
  sentence: Sentence | null;
  repeatsDone: number;
  repeatCount: number;
  subscribePosition: (fn: (pos: number) => void) => () => void;
  fileKey: string | null;
  onPlayOriginal: () => void;
  onPlayOriginalOnce: () => Promise<void>;
  onPauseOriginal: () => void;
  onRecordingsChanged?: () => void;
};

export function NowReading({
  sentence,
  repeatsDone,
  repeatCount,
  subscribePosition,
  fileKey,
  onPlayOriginal,
  onPlayOriginalOnce,
  onPauseOriginal,
  onRecordingsChanged,
}: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const activeWordIdxRef = useRef<number>(-1);

  const words = sentence
    ? sentence.text.split(/(\s+)/).filter((w) => w.trim().length > 0)
    : [];

  useEffect(() => {
    if (!sentence) return;
    wordsRef.current = wordsRef.current.slice(0, words.length);
    activeWordIdxRef.current = -1;

    const duration = Math.max(sentence.end - sentence.start, 0.001);
    const unsub = subscribePosition((pos) => {
      const local = Math.min(Math.max(pos - sentence.start, 0), duration);
      const pct = (local / duration) * 100;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${pct / 100})`;
      }
      if (words.length > 0) {
        const idx = Math.min(
          Math.floor((local / duration) * words.length),
          words.length - 1
        );
        if (idx !== activeWordIdxRef.current) {
          const prev = wordsRef.current[activeWordIdxRef.current];
          const next = wordsRef.current[idx];
          if (prev) prev.classList.remove("word-active");
          if (next) next.classList.add("word-active");
          activeWordIdxRef.current = idx;
        }
      }
    });
    return unsub;
  }, [sentence, subscribePosition, words.length]);

  if (!sentence) {
    return (
      <div className="w-full py-20 text-center text-ink-faint font-reader text-lg italic">
        Select a sentence below to begin
      </div>
    );
  }

  return (
    <article className="w-full py-10">
      <div className="flex items-baseline justify-between mb-5 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        <span>Sentence {sentence.id + 1}</span>
        <span className="tabular-nums">
          {repeatCount === 0
            ? `${repeatsDone} / ∞`
            : `${Math.min(repeatsDone, repeatCount)} / ${repeatCount}`}
        </span>
      </div>

      <p className="font-reader text-[30px] md:text-[34px] leading-[1.45] text-ink">
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) wordsRef.current[i] = el;
            }}
            className="word inline-block mr-[0.3em]"
          >
            {w}
          </span>
        ))}
      </p>

      <div className="mt-10 h-[3px] w-full bg-line relative overflow-hidden rounded-full">
        <div
          ref={barRef}
          className="h-full w-full bg-amber-400 origin-left rounded-full"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {fileKey && (
        <RecordControls
          key={`${fileKey}::${sentence.id}`}
          fileKey={fileKey}
          sentenceId={sentence.id}
          onPlayOriginal={onPlayOriginal}
          onPlayOriginalOnce={onPlayOriginalOnce}
          onBeforeRecord={onPauseOriginal}
          onRecorded={onRecordingsChanged}
          onDeleted={onRecordingsChanged}
        />
      )}
    </article>
  );
}
