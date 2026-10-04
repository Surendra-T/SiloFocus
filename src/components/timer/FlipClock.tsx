import { memo, useState } from "react";
import { cn } from "../../lib/utils";
import { toClockString, type TimepieceProps } from "./types";

function Half({ pos, digit, className }: { pos: "top" | "bottom"; digit: string; className?: string }) {
  return (
    <div className={cn("flap", pos === "top" ? "flap-top" : "flap-bottom", className)}>
      <span
        className={cn(
          "absolute left-0 right-0 flex h-[200%] items-center justify-center",
          pos === "top" ? "top-0" : "-top-full",
        )}
      >
        {digit}
      </span>
    </div>
  );
}

/**
 * One split-flap card. The old top flap rotates down (rotateX 0 -> -180deg, back face hidden),
 * then the new bottom flap swings into place.
 */
function FlipDigit({ digit }: { digit: string }) {
  const [state, setState] = useState({ cur: digit, prev: digit, n: 0 });
  if (digit !== state.cur) {
    setState({ cur: digit, prev: state.cur, n: state.n + 1 });
  }
  const { cur, prev, n } = state;

  return (
    <div
      className="relative h-[1.2em] w-[0.78em] rounded-[0.14em] border border-edge/70 shadow-glow [perspective:600px]"
      aria-hidden="true"
    >
      <Half pos="top" digit={cur} />
      <Half pos="bottom" digit={prev} />
      {n > 0 && <Half key={`t${n}`} pos="top" digit={prev} className="flap-top-anim" />}
      {n > 0 && <Half key={`b${n}`} pos="bottom" digit={cur} className="flap-bottom-anim" />}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2 bg-canvas/80" />
    </div>
  );
}

function FlipClockBase({ seconds }: TimepieceProps) {
  const text = toClockString(seconds);
  const chars = text.split("");
  return (
    <div
      role="timer"
      aria-label={text.replace(":", " minutes ") + " seconds"}
      className="flex items-center gap-[0.12em] font-serif text-6xl tabular-nums text-ink sm:text-7xl"
    >
      {chars.map((ch, i) => {
        const key = chars.length - i;
        return ch === ":" ? (
          <span key={key} aria-hidden="true" className="flex w-[0.28em] flex-col items-center gap-[0.18em]">
            <span className="h-[0.07em] w-[0.07em] rounded-full bg-glow" />
            <span className="h-[0.07em] w-[0.07em] rounded-full bg-glow" />
          </span>
        ) : (
          <FlipDigit key={key} digit={ch} />
        );
      })}
    </div>
  );
}

export const FlipClock = memo(FlipClockBase);
