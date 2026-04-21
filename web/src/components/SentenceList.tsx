import { useEffect, useRef } from "react";
import type { Sentence } from "../lib/transcribe";

type Props = {
  sentences: Sentence[];
  currentId: number | null;
  repeatsDone: number;
  repeatCount: number;
  onPick: (id: number) => void;
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SentenceList({ sentences, currentId, repeatsDone, repeatCount, onPick }: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentId]);

  return (
    <div className="reader-scroll w-full max-h-[60vh] overflow-y-auto rounded-2xl bg-white border border-gray-200 p-2">
      {sentences.map((s) => {
        const active = s.id === currentId;
        return (
          <button
            key={s.id}
            ref={active ? activeRef : null}
            onClick={() => onPick(s.id)}
            className={`group w-full text-left rounded-xl px-5 py-3 my-1 transition-all
              ${active
                ? "bg-accentSoft text-gray-900"
                : "hover:bg-gray-50 text-gray-700"}`}
          >
            <div className="flex items-baseline gap-3">
              <span className={`text-xs tabular-nums w-12 shrink-0 ${active ? "text-accent font-semibold" : "text-gray-400"}`}>
                {fmt(s.start)}
              </span>
              <span className={`text-lg leading-relaxed ${active ? "font-medium" : ""}`}>
                {s.text}
              </span>
              {active && (
                <span className="ml-auto text-xs text-accent font-semibold tabular-nums shrink-0">
                  {repeatCount === 0
                    ? `${repeatsDone}/∞`
                    : `${Math.min(repeatsDone, repeatCount)}/${repeatCount}`}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
