import { memo } from "react";
import { cn } from "../../lib/utils";
import { TOPOLOGIES, type Topology } from "../../lib/hooks/useSettingsStore";
import { AnalogClock } from "./AnalogClock";
import { FlipClock } from "./FlipClock";
import { LinearPillar } from "./LinearPillar";
import { RollingDigits } from "./RollingDigits";
import { toClockString, type TimepieceProps } from "./types";

export const TOPOLOGY_LABELS: Record<Topology, string> = {
  radial: "Editorial Radial",
  flip: "Split-Flap",
  analog: "Bauhaus Analog",
  linear: "Linear Pillar",
};

const RADIUS = 140;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function EditorialRadial({ seconds, progress, phase, running }: TimepieceProps) {
  const fill = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative flex h-[300px] w-[300px] items-center justify-center">
      <svg viewBox="0 0 300 300" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="150" cy="150" r={RADIUS} fill="none" className="stroke-edge" strokeWidth="1.5" />
        <circle
          cx="150"
          cy="150"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fill)}
          className={cn(
            phase === "BREAK" ? "stroke-accent" : "stroke-glow",
            running ? "transition-[stroke-dashoffset] duration-1000 ease-linear" : "transition-[stroke-dashoffset] duration-500 ease-silk",
          )}
        />
      </svg>
      <RollingDigits value={toClockString(seconds)} className="text-7xl text-ink sm:text-[5.25rem]" />
    </div>
  );
}

const PHASE_LABEL = {
  STUDY: "Deep Work",
  CHECK_IN: "Reflection",
  BREAK: "Intermission",
} as const;

interface PomodoroTimerProps extends TimepieceProps {
  topology: Topology;
  /** When provided, a topology dropdown is shown above the clock. */
  onTopologyChange?: (topology: Topology) => void;
}

/** Master clock coordinator: picks a topology inside a fixed-height stage so switching never shifts layout. */
function PomodoroTimerBase({ topology, onTopologyChange, ...piece }: PomodoroTimerProps) {
  const label = piece.flow && piece.phase === "STUDY" ? "Flow State" : PHASE_LABEL[piece.phase];

  return (
    <div className="w-full">
      <div className="flex min-h-9 items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {piece.flow && piece.phase === "STUDY" && (
            <span
              aria-hidden="true"
              className={cn("h-2 w-2 rounded-full bg-glow", piece.running && "animate-pulse-glow")}
            />
          )}
          <span className="eyebrow">{label}</span>
        </div>
        {onTopologyChange && (
          <label className="flex items-center gap-2">
            <span className="sr-only">Clock topology</span>
            <select
              value={topology}
              onChange={(e) => onTopologyChange(e.target.value as Topology)}
              className="cursor-pointer rounded-full border border-edge/80 bg-transparent px-3 py-1 text-xs font-medium text-subtle transition-colors duration-300 hover:text-ink focus:outline-none"
            >
              {TOPOLOGIES.map((t) => (
                <option key={t} value={t} className="bg-canvas text-ink">
                  {TOPOLOGY_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex h-[340px] items-center justify-center">
        {topology === "radial" && <EditorialRadial {...piece} />}
        {topology === "flip" && <FlipClock {...piece} />}
        {topology === "analog" && <AnalogClock {...piece} />}
        {topology === "linear" && <LinearPillar {...piece} />}
      </div>
    </div>
  );
}

export const PomodoroTimer = memo(PomodoroTimerBase);
