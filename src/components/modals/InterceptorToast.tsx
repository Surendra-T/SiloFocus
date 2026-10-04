export function InterceptorToast({ nudge, onResume, onDismiss }: { nudge: string, onResume: () => void, onDismiss: () => void }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-rise w-full max-w-md">
      <div className="bg-alabaster dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="w-full h-1 bg-oxblood/80" />
        <div className="p-5">
          <p className="text-xs font-semibold text-oxblood uppercase tracking-wider mb-2">A gentle word</p>
          <p className="font-serif italic text-lg leading-snug mb-5">{nudge}</p>
          <div className="flex gap-3">
            <button onClick={onResume} className="flex-1 py-2 rounded-lg bg-racing text-white dark:bg-stone-800 font-medium">I'm back, let's lock in</button>
            <button onClick={onDismiss} className="px-4 py-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}
