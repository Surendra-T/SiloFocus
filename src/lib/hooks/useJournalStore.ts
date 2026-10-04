"use client";

import { createPersistentStore } from "../store/createPersistentStore";

export interface FocusBlock {
  subject: string;
  minutes: number;
  completedAt: string;
  mood?: number;
  productivity?: number;
  notes?: string;
}

export interface DoubtEntry {
  subject: string;
  question: string;
  answeredAt: string;
}

export interface DayLog {
  blocks: FocusBlock[];
  doubts: DoubtEntry[];
}

interface JournalState {
  days: Record<string, DayLog>;
}

/** YYYY-MM-DD in the user's local timezone. */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const KEEP_DAYS = 30;
const EMPTY_DAY: DayLog = { blocks: [], doubts: [] };

const store = createPersistentStore<JournalState>("silofocus-journal-v1", { days: {} }, (raw) => {
  const out: Record<string, DayLog> = {};
  if (raw.days && typeof raw.days === "object") {
    for (const [key, value] of Object.entries(raw.days as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== "object") continue;
      const v = value as Partial<DayLog>;
      out[key] = {
        blocks: Array.isArray(v.blocks) ? v.blocks : [],
        doubts: Array.isArray(v.doubts) ? v.doubts : [],
      };
    }
  }
  return { days: out };
});

function mutateToday(update: (day: DayLog) => DayLog) {
  const key = localDateKey();
  store.set((s) => {
    const days = { ...s.days, [key]: update(s.days[key] ?? EMPTY_DAY) };
    const kept = Object.keys(days).sort().slice(-KEEP_DAYS);
    return { days: Object.fromEntries(kept.map((k) => [k, days[k]])) };
  });
}

export const journalStore = {
  addFocusBlock(block: FocusBlock) {
    mutateToday((day) => ({ ...day, blocks: [...day.blocks, block] }));
  },
  addDoubt(entry: DoubtEntry) {
    mutateToday((day) => ({ ...day, doubts: [...day.doubts, entry] }));
  },
  getDay(key: string = localDateKey()): DayLog {
    return store.get().days[key] ?? EMPTY_DAY;
  },
};

export function useJournalToday(): DayLog {
  const days = store.useStore().days;
  return days[localDateKey()] ?? EMPTY_DAY;
}
