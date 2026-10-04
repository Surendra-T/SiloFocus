import { formatClock, cn } from "../../lib/utils";

export function PomodoroTimer({ remaining, max, phase }: { remaining: number, max: number, phase: string }) {
  const pct = Math.max(0, Math.min(100, (remaining / max) * 100));
  const r = 140;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex flex-col items-center justify-center my-8">
      <div className="absolute -top-6 text-sm font-medium uppercase tracking-widest text-stone-500">{phase === "STUDY" ? "Deep Work" : "Intermission"}</div>
      <svg className="w-[320px] h-[320px] transform -rotate-90">
        <circle cx="160" cy="160" r={r} className="stroke-stone-200 dark:stroke-stone-800" strokeWidth="2" fill="none" />
        <circle 
          cx="160" cy="160" r={r} 
          className={cn("transition-all duration-1000 ease-linear", phase === "STUDY" ? "stroke-brass-dark dark:stroke-brass-light" : "stroke-racing-400")} 
          strokeWidth="4" fill="none" 
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" 
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-7xl font-serif tabular-nums tracking-tight">{formatClock(remaining)}</div>
      </div>
    </div>
  );
}
