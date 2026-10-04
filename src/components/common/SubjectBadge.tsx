"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { DEFAULT_SUBJECTS, MAX_SUBJECT_LENGTH, normalizeSubject } from "../../lib/db/models";

interface SubjectBadgeProps {
  subject: string;
  recent: string[];
  onChange: (subject: string) => void;
}

/** Subject pill; click to rename the workspace to any discipline. */
export function SubjectBadge({ subject, recent, onChange }: SubjectBadgeProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subject);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = (value: string) => {
    const next = normalizeSubject(value);
    if (next) onChange(next);
    setEditing(false);
  };

  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editing]);

  const suggestions = Array.from(new Set([...recent, ...DEFAULT_SUBJECTS])).filter((s) => s !== subject);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(subject);
          setEditing(true);
        }}
        title="Change subject"
        className="group inline-flex max-w-[11rem] items-center gap-2 rounded-full border border-edge/80 px-3 py-1 text-xs font-medium text-ink transition-all duration-300 ease-silk hover:bg-ink/5 sm:max-w-[16rem]"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-glow" />
        <span className="truncate">{subject}</span>
        <Pencil className="h-3 w-3 shrink-0 text-subtle opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        value={draft}
        maxLength={MAX_SUBJECT_LENGTH}
        aria-label="Subject"
        placeholder="e.g. Bar Exam Prep"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(draft);
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-48 rounded-full border border-glow bg-canvas px-3 py-1 text-xs font-medium text-ink focus:outline-none sm:w-60"
      />
      {suggestions.length > 0 && (
        <ul className="card absolute left-0 top-full z-40 mt-2 flex w-64 animate-rise flex-wrap gap-1.5 bg-canvas p-3">
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" className="chip" onClick={() => commit(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
