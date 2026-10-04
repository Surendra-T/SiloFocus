"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw, SkipForward, SlidersHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Phase } from "../../lib/hooks/useTimer";
import { Switch } from "../common/Switch";

const PRESETS = [
  { study: 25, brk: 5 },
  { study: 50, brk: 10 },
  { study: 90, brk: 15 },
] as const;

interface ControlsProps {
  phase: Phase;
  running: boolean;
  flow: boolean;
  studyMin: number;
  breakMin: number;
  onToggle: () => void;
  onReset: () => void;
  /** STUDY: end the block early. BREAK: skip the rest of the break. */
  onTakeMoment: () => void;
  onDurationsChange: (studyMin: number, breakMin: number) => void;
  onFlowChange: (flow: boolean) => void;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v) || min)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className="font-serif text-lg tabular-nums">{value} min</span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="icon-btn border border-edge/80" aria-label={`Decrease ${label}`} onClick={() => set(value - 1)}>
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-label={label}
          onChange={(e) => set(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <button type="button" className="icon-btn border border-edge/80" aria-label={`Increase ${label}`} onClick={() => set(value + 1)}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Controls({
  phase,
  running,
  flow,
  studyMin,
  breakMin,
  onToggle,
  onReset,
  onTakeMoment,
  onDurationsChange,
  onFlowChange,
}: ControlsProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activePreset = PRESETS.find((p) => p.study === studyMin && p.brk === breakMin);

  useEffect(() => {
    if (!customOpen) return;
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setCustomOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [customOpen]);

  const locked = running;
  const momentLabel = phase === "BREAK" ? "Skip Break" : flow ? "Finish & Break" : "Take a Moment";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onToggle} disabled={phase === "CHECK_IN"} className="btn-primary min-w-32 px-8 py-3">
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" onClick={onReset} className="btn-ghost py-3" aria-label="Reset timer">
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button type="button" onClick={onTakeMoment} disabled={phase === "CHECK_IN"} className="btn-ghost py-3">
          <SkipForward className="h-4 w-4" />
          {momentLabel}
        </button>
      </div>

      <div className="relative flex w-full flex-wrap items-center justify-center gap-2" ref={popoverRef}>
        {PRESETS.map((p) => (
          <button
            key={p.study}
            type="button"
            disabled={locked}
            onClick={() => onDurationsChange(p.study, p.brk)}
            aria-pressed={activePreset === p}
            className={cn("chip tabular-nums", activePreset === p && "chip-active")}
          >
            {p.study} / {p.brk}
          </button>
        ))}
        <button
          type="button"
          disabled={locked}
          onClick={() => setCustomOpen((o) => !o)}
          aria-expanded={customOpen}
          aria-haspopup="dialog"
          className={cn("chip gap-1.5", !activePreset && "chip-active")}
        >
          <SlidersHorizontal className="h-3 w-3" />
          {activePreset ? "Custom" : `${studyMin} / ${breakMin}`}
        </button>

        {customOpen && (
          <div
            role="dialog"
            aria-label="Custom intervals"
            className="card absolute bottom-full left-1/2 z-20 mb-3 w-[min(22rem,90vw)] -translate-x-1/2 animate-rise space-y-5 bg-canvas p-5"
          >
            <Stepper label="Study" value={studyMin} min={1} max={120} onChange={(v) => onDurationsChange(v, breakMin)} />
            <Stepper label="Break" value={breakMin} min={1} max={30} onChange={(v) => onDurationsChange(studyMin, v)} />
          </div>
        )}
      </div>

      <label className={cn("flex items-center gap-3 text-sm text-subtle", locked && "opacity-50")}>
        <Switch checked={flow} onChange={onFlowChange} disabled={locked} label="Flowmodoro" />
        <span className="flex items-center gap-2">
          Flowmodoro
          <span className="hidden text-xs sm:inline">open-ended count-up</span>
        </span>
      </label>
    </div>
  );
}
