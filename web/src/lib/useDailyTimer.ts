import { useCallback, useEffect, useState } from "react";

export type TimerState =
  | { status: "idle"; date: string }
  | { status: "running"; date: string; sessionStart: number }
  | { status: "ended"; date: string; sessionStart: number; endedAt: number };

const STORAGE_KEY = "speakloop:daily-timer";

/** Local-calendar YYYY-MM-DD (not UTC) so midnight flip matches the user's clock. */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fresh(): TimerState {
  return { status: "idle", date: today() };
}

function load(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as TimerState;
    if (!parsed || parsed.date !== today()) return fresh();
    return parsed;
  } catch {
    return fresh();
  }
}

export function useDailyTimer() {
  const [state, setState] = useState<TimerState>(() => load());
  const [, forceTick] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Tick every second while running so the display updates.
  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  // Watch for day rollover (midnight) even if the tab stays open.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (today() !== state.date) setState(fresh());
    }, 30_000);
    return () => window.clearInterval(id);
  }, [state.date]);

  // Recomputed every render — forceTick drives a render each second while
  // running, so the returned value is always fresh.
  const elapsedMs =
    state.status === "running"
      ? Date.now() - state.sessionStart
      : state.status === "ended"
      ? state.endedAt - state.sessionStart
      : 0;

  const start = useCallback(() => {
    setState((s) => {
      if (s.status !== "idle") return s;
      return { status: "running", date: today(), sessionStart: Date.now() };
    });
  }, []);

  const stop = useCallback(() => {
    setState((s) => {
      if (s.status !== "running") return s;
      return { status: "ended", date: s.date, sessionStart: s.sessionStart, endedAt: Date.now() };
    });
  }, []);

  return { state, elapsedMs, start, stop };
}

export function formatElapsed(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
