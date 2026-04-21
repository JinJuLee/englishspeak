import type { LooperOptions } from "../lib/useAudioLooper";

type Props = {
  playing: boolean;
  options: LooperOptions;
  onOptions: (p: Partial<LooperOptions>) => void;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const REPEATS = [1, 2, 3, 5, 10, 0];

export function ControlBar({ playing, options, onOptions, onPlay, onPause, onPrev, onNext, onReset }: Props) {
  return (
    <div className="w-full bg-page/95 backdrop-blur-md border border-line rounded-full shadow-[0_1px_20px_rgba(0,0,0,0.04)] px-3 py-2 flex items-center gap-1 overflow-x-auto">
      <Transport onPrev={onPrev} onNext={onNext} playing={playing} onPlay={onPlay} onPause={onPause} />
      <Divider />
      <Picker
        label="Loop"
        value={options.repeatCount}
        options={REPEATS.map((n) => ({ value: n, label: n === 0 ? "∞" : `${n}` }))}
        onChange={(v) => onOptions({ repeatCount: v })}
      />
      <Divider />
      <Picker
        label="Speed"
        value={options.speed}
        options={SPEEDS.map((v) => ({ value: v, label: `${v}×` }))}
        onChange={(v) => onOptions({ speed: v })}
      />
      <Divider />
      <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer px-3 py-1.5 select-none">
        <input
          type="checkbox"
          checked={options.autoAdvance}
          onChange={(e) => onOptions({ autoAdvance: e.target.checked })}
          className="accent-ink w-3.5 h-3.5"
        />
        Auto-next
      </label>
      <Divider />
      <div className="flex items-center gap-2 px-3">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted">Gap</span>
        <input
          type="range"
          min={0}
          max={2000}
          step={100}
          value={options.gapMs}
          onChange={(e) => onOptions({ gapMs: Number(e.target.value) })}
          className="accent-ink w-20"
        />
        <span className="text-xs text-ink-soft tabular-nums w-8">{(options.gapMs / 1000).toFixed(1)}s</span>
      </div>
      <div className="ml-auto pl-2">
        <button
          onClick={onReset}
          className="text-xs text-ink-muted hover:text-ink px-3 py-1.5 rounded-full transition-colors"
          title="Load a different file"
        >
          New
        </button>
      </div>
    </div>
  );
}

function Transport({
  playing,
  onPlay,
  onPause,
  onPrev,
  onNext,
}: {
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <TransportBtn onClick={onPrev} label="Previous">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
      </TransportBtn>
      <TransportBtn primary onClick={playing ? onPause : onPlay} label={playing ? "Pause" : "Play"}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </TransportBtn>
      <TransportBtn onClick={onNext} label="Next">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2 6L5.5 6v12z" /></svg>
      </TransportBtn>
    </div>
  );
}

function TransportBtn({
  children,
  onClick,
  label,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center rounded-full transition-colors
        ${primary ? "w-9 h-9 bg-ink text-page hover:bg-ink-soft" : "w-9 h-9 text-ink-soft hover:bg-ink/[0.05]"}`}
    >
      {children}
    </button>
  );
}

function Picker<T extends number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3">
      <span className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
      <div className="flex gap-0.5">
        {options.map((o) => {
          const active = Math.abs((value as number) - (o.value as number)) < 0.0001;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`px-2 py-1 text-xs font-medium rounded-full transition-colors tabular-nums
                ${active ? "bg-ink text-page" : "text-ink-soft hover:bg-ink/[0.05]"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-line shrink-0" />;
}
