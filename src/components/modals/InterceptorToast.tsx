"use client";

import { ShieldAlert, ArrowRight } from "lucide-react";

interface InterceptorToastProps {
  nudge: string;
  onResume: () => void;
  onDismiss: () => void;
}

export function InterceptorToast({ nudge, onResume, onDismiss }: InterceptorToastProps) {
  return (
    <aside
      role="alertdialog"
      aria-label="Procrastination Interceptor"
      aria-live="polite"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-rise w-[min(28rem,90vw)] pointer-events-auto"
    >
      <div className="card border-edge overflow-hidden shadow-2xl bg-canvas flex flex-col">
        <div className="w-full h-1 bg-gradient-to-r from-glow via-accent to-glow" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-glow">
              <ShieldAlert className="h-3.5 w-3.5" />
              Focus Reality Check
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-subtle hover:text-ink transition-colors"
            >
              Dismiss
            </button>
          </div>

          <p className="font-serif italic text-base sm:text-lg text-ink leading-relaxed">
            {nudge || "You've been away for a moment. Take a breath and let's finish this block."}
          </p>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onResume}
              className="btn-primary w-full justify-center"
            >
              I'm back, let's lock in
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
