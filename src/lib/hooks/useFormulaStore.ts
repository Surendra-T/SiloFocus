"use client";

import { createPersistentStore } from "../store/createPersistentStore";

interface FormulaState {
  sheets: Record<string, string>;
}

const store = createPersistentStore<FormulaState>("silofocus-formulas-v1", { sheets: {} }, (raw) => {
  const sheets: Record<string, string> = {};
  if (raw.sheets && typeof raw.sheets === "object") {
    for (const [k, v] of Object.entries(raw.sheets as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) sheets[k] = v.slice(0, 20_000);
    }
  }
  return { sheets };
});

export const formulaStore = {
  save(subject: string, markdown: string) {
    store.set((s) => ({ sheets: { ...s.sheets, [subject]: markdown } }));
  },
  clear(subject: string) {
    store.set((s) => {
      const next = { ...s.sheets };
      delete next[subject];
      return { sheets: next };
    });
  },
};

export function useGeneratedSheets(): Record<string, string> {
  return store.useStore().sheets;
}
