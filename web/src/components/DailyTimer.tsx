import { useDailyTimer, formatElapsed, formatDate, formatTime } from "../lib/useDailyTimer";

export function DailyTimer() {
  const { state, elapsedMs, start, stop } = useDailyTimer();
  const dateStr = formatDate(new Date());

  return (
    <div className="w-full border-b border-line">
      <div className="max-w-reader mx-auto px-6 h-12 flex items-center justify-center gap-4 text-sm">
        <span className="text-[11px] uppercase tracking-widest text-ink-muted shrink-0">
          {dateStr}
        </span>
        <Divider />

        {state.status === "idle" && (
          <button
            onClick={start}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-amber-400 text-ink hover:bg-amber-500 transition-colors"
          >
            <DotIcon />
            Start today's session
          </button>
        )}

        {state.status === "running" && (
          <>
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-amber-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Live
            </span>
            <span className="font-reader text-lg tabular-nums text-ink">
              {formatElapsed(elapsedMs)}
            </span>
            <span className="text-[11px] text-ink-muted tabular-nums">
              since {formatTime(new Date(state.sessionStart))}
            </span>
            <button
              onClick={stop}
              className="ml-1 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border border-line text-ink-soft hover:border-ink/30 hover:text-ink transition-colors"
            >
              <StopIcon />
              End
            </button>
          </>
        )}

        {state.status === "ended" && (
          <>
            <span className="text-[11px] uppercase tracking-widest text-ink-muted">Today</span>
            <span className="font-reader text-lg tabular-nums text-ink">
              {formatElapsed(elapsedMs)}
            </span>
            <span className="text-[11px] text-ink-muted tabular-nums">
              {formatTime(new Date(state.sessionStart))} → {formatTime(new Date(state.endedAt))}
            </span>
            <span className="text-xs text-ink-faint italic">See you tomorrow 🌙</span>
          </>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-4 w-px bg-line shrink-0" />;
}

function DotIcon() {
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-ink" />;
}

function StopIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>;
}
