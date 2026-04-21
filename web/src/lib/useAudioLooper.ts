import { useCallback, useEffect, useRef, useState } from "react";
import type { Sentence } from "./transcribe";

export type LooperState = {
  playing: boolean;
  currentId: number | null;
  repeatsDone: number;
};

export type LooperOptions = {
  repeatCount: number; // 0 = infinite
  autoAdvance: boolean;
  speed: number;
  gapMs: number;
};

export function useAudioLooper(sentences: Sentence[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const gapTimerRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const positionListenersRef = useRef<Set<(pos: number) => void>>(new Set());

  const optsRef = useRef<LooperOptions>({
    repeatCount: 3,
    autoAdvance: true,
    speed: 1,
    gapMs: 400,
  });

  const [state, setState] = useState<LooperState>({
    playing: false,
    currentId: null,
    repeatsDone: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  const setAudio = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
    if (el) el.playbackRate = optsRef.current.speed;
  }, []);

  const setOptions = useCallback((patch: Partial<LooperOptions>) => {
    optsRef.current = { ...optsRef.current, ...patch };
    if (audioRef.current && patch.speed !== undefined) {
      audioRef.current.playbackRate = patch.speed;
    }
  }, []);

  const subscribePosition = useCallback((fn: (pos: number) => void) => {
    positionListenersRef.current.add(fn);
    fn(positionRef.current);
    return () => {
      positionListenersRef.current.delete(fn);
    };
  }, []);

  const clearGap = () => {
    if (gapTimerRef.current !== null) {
      window.clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
  };

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const getSentence = (id: number | null) =>
    id == null ? null : sentencesRef.current.find((s) => s.id === id) ?? null;

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    clearGap();
    setState((s) => ({ ...s, playing: false }));
  }, []);

  const playSentence = useCallback((id: number, resetRepeats = true) => {
    const audio = audioRef.current;
    const s = getSentence(id);
    if (!audio || !s) return;
    clearGap();
    audio.currentTime = s.start;
    audio.playbackRate = optsRef.current.speed;
    audio.play().catch(() => {});
    positionRef.current = s.start;
    positionListenersRef.current.forEach((fn) => fn(s.start));
    setState((prev) => ({
      ...prev,
      playing: true,
      currentId: id,
      repeatsDone: resetRepeats ? 0 : prev.repeatsDone,
    }));
  }, []);

  const onEndOfSentence = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();

    const { repeatCount, autoAdvance, gapMs } = optsRef.current;
    const curId = stateRef.current.currentId;
    const cur = getSentence(curId);
    if (!cur) return;

    const repeatsDoneNow = stateRef.current.repeatsDone + 1;
    const needMore = repeatCount === 0 || repeatsDoneNow < repeatCount;

    if (needMore) {
      setState((s) => ({ ...s, repeatsDone: repeatsDoneNow }));
      gapTimerRef.current = window.setTimeout(() => {
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = cur.start;
        a.play().catch(() => {});
        setState((s) => ({ ...s, playing: true }));
      }, gapMs);
    } else if (autoAdvance) {
      const next = sentencesRef.current.find((x) => x.id > cur.id);
      if (next) {
        gapTimerRef.current = window.setTimeout(() => {
          playSentence(next.id, true);
        }, gapMs);
      } else {
        setState((s) => ({ ...s, playing: false }));
      }
    } else {
      setState((s) => ({ ...s, playing: false }));
    }
  }, [playSentence]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      const cur = getSentence(stateRef.current.currentId);
      if (cur && stateRef.current.playing && !audio.paused) {
        const pos = audio.currentTime;
        positionRef.current = pos;
        positionListenersRef.current.forEach((fn) => fn(pos));
        if (pos >= cur.end) {
          onEndOfSentence();
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onEndOfSentence]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => stopRaf();
  }, [tick]);

  const play = useCallback(() => {
    const cur = stateRef.current.currentId;
    if (cur != null) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.playbackRate = optsRef.current.speed;
      audio.play().catch(() => {});
      setState((s) => ({ ...s, playing: true }));
    } else if (sentencesRef.current.length > 0) {
      playSentence(sentencesRef.current[0].id, true);
    }
  }, [playSentence]);

  const next = useCallback(() => {
    const curId = stateRef.current.currentId;
    const curIdx = curId == null ? -1 : sentencesRef.current.findIndex((s) => s.id === curId);
    const nxt = sentencesRef.current[curIdx + 1];
    if (nxt) playSentence(nxt.id, true);
  }, [playSentence]);

  const prev = useCallback(() => {
    const curId = stateRef.current.currentId;
    const curIdx = curId == null ? -1 : sentencesRef.current.findIndex((s) => s.id === curId);
    const prv = sentencesRef.current[curIdx - 1];
    if (prv) playSentence(prv.id, true);
  }, [playSentence]);

  return {
    setAudio,
    setOptions,
    subscribePosition,
    state,
    play,
    pause,
    playSentence,
    next,
    prev,
  };
}
