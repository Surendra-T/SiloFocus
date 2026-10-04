import { memo } from "react";
import { cn } from "../../lib/utils";
import { RollingDigits } from "./RollingDigits";
import { toClockString, type TimepieceProps } from "./types";

/** Mercury-column thermometer beside bold, understated numerals. */
function LinearPillarBase({ seconds, progress, running, phase }: TimepieceProps) {
  const fill = Math.min(1, Math.max(0, progress));
  const color = phase === "BREAK" ? "bg-accent" : "bg-glow";

  return (
    <div className="flex items-center gap-8 sm:gap-12">
      <div className="flex h-[300px] flex-col items-center" aria-hidden="true">
        <div className="relative w-4 flex-1 overflow-hidden rounded-t-full border border-b-0 border-edge bg-canvas/60">
          <div
            className={cn(
              "absolute inset-0 origin-bottom will-change-transform",
              color,
              running ? "transition-transform duration-1000 ease-linear" : "transition-transform duration-500 ease-silk",
            )}
            style={{ transform: `scaleY(${fill})` }}
          />
          {[0.25, 0.5, 0.75].map((t) => (
            <span
              key={t}
              className="absolute right-0 h-px w-1.5 bg-ink/40"
              style={{ bottom: `${t * 100}%` }}
            />
          ))}
        </div>
        <div className={cn("-mt-px h-8 w-8 rounded-full border border-edge transition-colors duration-500", color)} />
      </div>
      <RollingDigits value={toClockString(seconds)} className="text-7xl text-ink sm:text-8xl" />
    </div>
  );
}

export const LinearPillar = memo(LinearPillarBase);
