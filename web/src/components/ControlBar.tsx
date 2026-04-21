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
const REPEATS = [1, 2, 3, 5, 10, 0]; // 0 = infinite

export function ControlBar({ playing, options, onOptions, onPlay, onPause, onPrev, onNext, onReset }: Props) {
  return (
    <div className="w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <IconButton onClick={onPrev} title="Previous sentence">⏮</IconButton>
        {playing ? (
          <IconButton primary onClick={onPause} title="Pause">⏸</IconButton>
        ) : (
          <IconButton primary onClick={onPlay} title="Play">▶</IconButton>
        )}
        <IconButton onClick={onNext} title="Next sentence">⏭</IconButton>
      </div>

      <Divider />

      <Field label="Repeat">
        <div className="flex gap-1">
          {REPEATS.map((n) => (
            <Chip
              key={n}
              active={options.repeatCount === n}
              onClick={() => onOptions({ repeatCount: n })}
            >
              {n === 0 ? "∞" : `${n}×`}
            </Chip>
          ))}
        </div>
      </Field>

      <Divider />

      <Field label="Speed">
        <div className="flex gap-1">
          {SPEEDS.map((v) => (
            <Chip key={v} active={Math.abs(options.speed - v) < 0.01} onClick={() => onOptions({ speed: v })}>
              {v}×
            </Chip>
          ))}
        </div>
      </Field>

      <Divider />

      <Field label="Gap">
        <input
          type="range"
          min={0}
          max={2000}
          step={100}
          value={options.gapMs}
          onChange={(e) => onOptions({ gapMs: Number(e.target.value) })}
          className="accent-accent w-28"
        />
        <span className="text-sm text-gray-500 tabular-nums w-14">{(options.gapMs / 1000).toFixed(1)}s</span>
      </Field>

      <Divider />

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={options.autoAdvance}
          onChange={(e) => onOptions({ autoAdvance: e.target.checked })}
          className="accent-accent w-4 h-4"
        />
        Auto-advance
      </label>

      <div className="ml-auto">
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          New file
        </button>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center rounded-full transition-all
        ${primary ? "w-12 h-12 bg-accent text-white text-xl hover:scale-105" : "w-10 h-10 bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg"}`}
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all
        ${active ? "bg-accent text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-6 w-px bg-gray-200" />;
}
