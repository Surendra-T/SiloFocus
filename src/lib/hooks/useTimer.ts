"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

export type Phase = "STUDY" | "CHECK_IN" | "BREAK";

export interface TimerConfig {
  studyMin: number;
  breakMin: number;
  /** Flowmodoro: STUDY becomes an open-ended count-up stopwatch. */
  flow: boolean;
}

export interface TickInfo {
  phase: Phase;
  /** Seconds shown on the clock. */
  seconds: number;
  /** Seconds elapsed in the current phase. */
  elapsed: number;
}

export interface TimerCallbacks {
  onTick?: (info: TickInfo) => void;
  onStudyComplete?: (elapsedSec: number) => void;
  onBreakComplete?: () => void;
}

interface Core {
  phase: Phase;
  running: boolean;
  /** Milliseconds accumulated before the current running segment. */
  baseMs: number;
  /** Wall-clock start of the current running segment. */
  startedAt: number;
  elapsed: number;
  breakOverride: number | null;
  lastStudySec: number;
}

function totalFor(core: Core, config: TimerConfig): number {
  if (core.phase === "STUDY") return config.studyMin * 60;
  if (core.phase === "BREAK") return core.breakOverride ?? config.breakMin * 60;
  return 0;
}

/**
 * Timestamp-based timer: remaining time is derived from `Date.now()`, so background-tab
 * throttling can delay a tick but never makes the clock drift.
 */
export function useTimer(config: TimerConfig, callbacks: TimerCallbacks) {
  const core = useRef<Core>({
    phase: "STUDY",
    running: false,
    baseMs: 0,
    startedAt: 0,
    elapsed: 0,
    breakOverride: null,
    lastStudySec: 0,
  });
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const configRef = useRef(config);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    configRef.current = config;
    callbacksRef.current = callbacks;
  });

  const finish = useCallback((total: number) => {
    const c = core.current;
    c.running = false;
    if (c.phase === "STUDY") {
      c.elapsed = total;
      c.baseMs = total * 1000;
      c.lastStudySec = total;
      c.phase = "CHECK_IN";
      bump();
      callbacksRef.current.onStudyComplete?.(total);
    } else {
      c.phase = "STUDY";
      c.elapsed = 0;
      c.baseMs = 0;
      c.breakOverride = null;
      bump();
      callbacksRef.current.onBreakComplete?.();
    }
  }, []);

  const tick = useCallback(() => {
    const c = core.current;
    if (!c.running) return;
    const elapsed = Math.floor((c.baseMs + Date.now() - c.startedAt) / 1000);
    const flowStudy = configRef.current.flow && c.phase === "STUDY";
    const total = totalFor(c, configRef.current);

    if (!flowStudy && elapsed >= total) {
      finish(total);
      return;
    }
    if (elapsed !== c.elapsed) {
      c.elapsed = elapsed;
      bump();
      callbacksRef.current.onTick?.({
        phase: c.phase,
        seconds: flowStudy ? elapsed : total - elapsed,
        elapsed,
      });
    }
  }, [finish]);

  const running = core.current.running;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(tick, 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running, tick]);

  const start = useCallback(() => {
    const c = core.current;
    if (c.running || c.phase === "CHECK_IN") return;
    c.startedAt = Date.now();
    c.running = true;
    bump();
  }, []);

  const pause = useCallback(() => {
    const c = core.current;
    if (!c.running) return;
    c.baseMs += Date.now() - c.startedAt;
    c.running = false;
    c.elapsed = Math.floor(c.baseMs / 1000);
    bump();
  }, []);

  const toggle = useCallback(() => {
    if (core.current.running) pause();
    else start();
  }, [pause, start]);

  const reset = useCallback(() => {
    const c = core.current;
    c.running = false;
    c.baseMs = 0;
    c.elapsed = 0;
    if (c.phase === "CHECK_IN") c.phase = "STUDY";
    bump();
  }, []);

  const startStudy = useCallback((autoStart = false) => {
    const c = core.current;
    c.phase = "STUDY";
    c.baseMs = 0;
    c.elapsed = 0;
    c.breakOverride = null;
    c.running = autoStart;
    c.startedAt = Date.now();
    bump();
  }, []);

  const startBreak = useCallback((options: { seconds?: number; autoStart?: boolean } = {}) => {
    const c = core.current;
    c.phase = "BREAK";
    c.breakOverride = options.seconds ?? null;
    c.baseMs = 0;
    c.elapsed = 0;
    c.running = options.autoStart ?? true;
    c.startedAt = Date.now();
    bump();
  }, []);

  const getElapsedSec = useCallback((): number => {
    const c = core.current;
    return Math.floor((c.baseMs + (c.running ? Date.now() - c.startedAt : 0)) / 1000);
  }, []);

  /** Ends the current study block early and moves to CHECK_IN. Returns the seconds studied. */
  const enterCheckIn = useCallback((): number => {
    const c = core.current;
    const elapsedSec = Math.floor((c.baseMs + (c.running ? Date.now() - c.startedAt : 0)) / 1000);
    c.lastStudySec = elapsedSec;
    c.baseMs = elapsedSec * 1000;
    c.elapsed = elapsedSec;
    c.running = false;
    c.phase = "CHECK_IN";
    bump();
    return elapsedSec;
  }, []);

  const c = core.current;
  const flowStudy = config.flow && c.phase === "STUDY";
  const total = totalFor(c, config);
  const seconds = flowStudy ? c.elapsed : Math.max(0, total - c.elapsed);
  const progress =
    c.phase === "CHECK_IN" ? 0 : flowStudy ? (c.elapsed % 3600) / 3600 : total > 0 ? seconds / total : 0;

  return {
    phase: c.phase,
    running: c.running,
    seconds,
    total,
    progress,
    elapsed: c.elapsed,
    flowStudy,
    lastStudySec: c.lastStudySec,
    start,
    pause,
    toggle,
    reset,
    startStudy,
    startBreak,
    enterCheckIn,
    getElapsedSec,
  };
}
