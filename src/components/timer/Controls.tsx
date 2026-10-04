export function Controls({ running, onToggle, onReset, onSkip, phase }: any) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <button onClick={onToggle} className="px-8 py-3 rounded-full bg-racing text-white font-medium hover:bg-racing-400 transition-colors w-32">
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={onReset} className="px-6 py-3 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
          Reset
        </button>
      </div>
      <button onClick={onSkip} className="text-sm opacity-60 hover:opacity-100 transition-opacity underline underline-offset-4">
        {phase === "STUDY" ? "Take a Moment" : "Skip Break"}
      </button>
    </div>
  );
}
