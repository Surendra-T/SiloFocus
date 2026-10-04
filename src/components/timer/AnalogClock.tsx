import { memo } from "react";
import { cn } from "../../lib/utils";
import { toClockString, type TimepieceProps } from "./types";

const CENTER = 100;

/**
 * Bauhaus dial. Hands show the time on the clock: the minute hand sweeps one revolution per hour,
 * the second hand one per minute. Angles are cumulative (not wrapped) so CSS never spins backwards.
 */
function AnalogClockBase({ seconds, running, phase }: TimepieceProps) {
  const secondAngle = seconds * 6;
  const minuteAngle = seconds * 0.1;
  const transition = running ? "transform 1s linear" : "none";
  const handColor = phase === "BREAK" ? "stroke-accent" : "stroke-ink";
  const label = toClockString(seconds);

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-[300px] w-[300px]"
      role="timer"
      aria-label={label.replace(":", " minutes ") + " seconds"}
    >
      <circle cx={CENTER} cy={CENTER} r="94" className="fill-panel/60 stroke-edge" strokeWidth="1.5" />

      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        const angle = (i * 6 * Math.PI) / 180;
        const outer = 88;
        const inner = major ? 76 : 83;
        return (
          <line
            key={i}
            x1={CENTER + Math.sin(angle) * inner}
            y1={CENTER - Math.cos(angle) * inner}
            x2={CENTER + Math.sin(angle) * outer}
            y2={CENTER - Math.cos(angle) * outer}
            className={major ? "stroke-ink" : "stroke-subtle/60"}
            strokeWidth={major ? 2.4 : 0.8}
            strokeLinecap="butt"
          />
        );
      })}

      <text
        x={CENTER}
        y="138"
        textAnchor="middle"
        className="fill-subtle font-sans text-[8px] tracking-[0.25em]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {label}
      </text>

      <g
        style={{
          transformOrigin: `${CENTER}px ${CENTER}px`,
          transformBox: "view-box",
          transform: `rotate(${minuteAngle}deg)`,
          transition,
        }}
      >
        <line x1={CENTER} y1={CENTER + 10} x2={CENTER} y2="34" className={cn(handColor)} strokeWidth="4" strokeLinecap="round" />
      </g>

      <g
        style={{
          transformOrigin: `${CENTER}px ${CENTER}px`,
          transformBox: "view-box",
          transform: `rotate(${secondAngle}deg)`,
          transition,
        }}
      >
        <line x1={CENTER} y1={CENTER + 18} x2={CENTER} y2="22" className="stroke-glow" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx={CENTER} cy="28" r="3.2" className="fill-glow" />
      </g>

      <circle cx={CENTER} cy={CENTER} r="4.5" className="fill-canvas stroke-ink" strokeWidth="2" />
    </svg>
  );
}

export const AnalogClock = memo(AnalogClockBase);
