import type { Phase } from "../../lib/hooks/useTimer";

/** Props shared by every clock topology. */
export interface TimepieceProps {
  /** Seconds shown on the clock (remaining, or elapsed in Flowmodoro). */
  seconds: number;
  /** Fraction (0..1) of the ring / pillar to fill. */
  progress: number;
  phase: Phase;
  running: boolean;
  flow: boolean;
}

/** "MM:SS" — minutes grow past two digits for long Flowmodoro sessions. */
export function toClockString(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
