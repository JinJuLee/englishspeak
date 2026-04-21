import { useEffect, useRef } from "react";
import type { Sentence } from "../lib/transcribe";

type Props = {
  sentence: Sentence | null;
  repeatsDone: number;
  repeatCount: number;
  subscribePosition: (fn: (pos: number) => void) => () => void;
};

export function NowReading({ sentence, repeatsDone, repeatCount, subscribePosition }: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);
  const activeWordIdxRef = useRef<number>(-1);

  // Word list cached per sentence
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

      // word highlight: estimate by proportional progress across words
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
      <div className="w-full rounded-2xl bg-white border border-gray-200 p-10 text-center text-gray-400">
        Pick a sentence below to start
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-4 text-xs uppercase tracking-wide font-semibold text-gray-500">
        <span>Now reading · Sentence {sentence.id + 1}</span>
        <span className="text-accent tabular-nums">
          {repeatCount === 0
            ? `${repeatsDone}/∞`
            : `${Math.min(repeatsDone, repeatCount)}/${repeatCount}`}
        </span>
      </div>

      <p className="text-2xl md:text-3xl leading-snug text-gray-900 font-medium">
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) wordsRef.current[i] = el;
            }}
            className="word inline-block mr-[0.35em] transition-colors"
          >
            {w}
          </span>
        ))}
      </p>

      <div className="mt-6 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full w-full bg-accent origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
