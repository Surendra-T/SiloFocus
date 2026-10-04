"use client";

import { useState } from "react";
import { ModalShell } from "../common/ModalShell";
import { Sparkles } from "lucide-react";

interface CheckInData {
  moodScore: number;
  productivityScore: number;
  notes: string;
}

interface CheckInModalProps {
  onSave: (data: CheckInData) => void;
  onSkip: () => void;
}

export function CheckInModal({ onSave, onSkip }: CheckInModalProps) {
  const [mood, setMood] = useState(7);
  const [prod, setProd] = useState(8);
  const [notes, setNotes] = useState("");

  const NumberRow = ({
    val,
    setVal,
    label,
  }: {
    val: number;
    setVal: (n: number) => void;
    label: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="eyebrow">{label}</span>
        <span className="font-serif text-base font-semibold text-ink tabular-nums">{val}/10</span>
      </div>
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const active = n === val;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setVal(n)}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full font-serif text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                active
                  ? "bg-accent text-onaccent scale-105 shadow-sm"
                  : "border border-edge/80 text-subtle hover:text-ink hover:border-glow bg-transparent"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <ModalShell open={true} onClose={onSkip} title="Session Reflection" className="max-w-md">
      <div className="p-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-glow uppercase tracking-widest mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Block Completed
          </div>
          <h2 className="text-2xl font-serif font-medium text-ink">Session Reflection</h2>
          <p className="text-xs text-subtle">Rate your mental state to ground your study intelligence</p>
        </div>

        <div className="space-y-5 pt-2">
          <NumberRow val={mood} setVal={setMood} label="Mindset & Mood" />
          <NumberRow val={prod} setVal={setProd} label="Focus & Productivity" />

          <div>
            <label htmlFor="checkin-notes" className="eyebrow block mb-1.5">
              Field Notes (Optional)
            </label>
            <input
              id="checkin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={280}
              placeholder="What breakthroughs or problems did you tackle?"
              className="field"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-edge/60">
          <button type="button" onClick={onSkip} className="btn-ghost">
            Skip
          </button>
          <button
            type="button"
            onClick={() => onSave({ moodScore: mood, productivityScore: prod, notes })}
            className="btn-primary min-w-28"
          >
            Save Record
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
