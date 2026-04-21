import { useEffect, useRef } from "react";
import type { Sentence } from "../lib/transcribe";

type Props = {
  sentences: Sentence[];
  currentId: number | null;
  onPick: (id: number) => void;
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SentenceList({ sentences, currentId, onPick }: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentId]);

  return (
    <div className="w-full">
      <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-4 pb-3 border-b border-line">
        Transcript
      </div>
      <div className="reader-scroll max-h-[48vh] overflow-y-auto -mx-2">
        {sentences.map((s) => {
          const active = s.id === currentId;
          return (
            <button
              key={s.id}
              ref={active ? activeRef : null}
              onClick={() => onPick(s.id)}
              className={`group w-full text-left px-3 py-3 flex items-baseline gap-4 transition-colors border-l-2
                ${active ? "bg-amber-50 border-amber-400" : "border-transparent hover:bg-ink/[0.02]"}`}
            >
              <span
                className={`text-xs tabular-nums w-10 shrink-0 pt-0.5
                  ${active ? "text-amber-700 font-semibold" : "text-ink-faint group-hover:text-ink-muted"}`}
              >
                {fmt(s.start)}
              </span>
              <span
                className={`font-reader text-[17px] leading-[1.55]
                  ${active ? "text-ink" : "text-ink-soft"}`}
              >
                {s.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
