"use client";

import { useSyncExternalStore } from "react";

export interface PersistentStore<T> {
  /** React hook returning the current (hydration-safe) snapshot. */
  useStore: () => T;
  get: () => T;
  set: (patch: Partial<T> | ((prev: T) => Partial<T>)) => void;
}

/**
 * A tiny localStorage-backed external store.
 * - Server and first hydration render use `defaults`, so there are no hydration mismatches.
 * - `sanitize` must return only valid fields; anything else falls back to `defaults`.
 * - Changes sync across tabs through the `storage` event.
 */
export function createPersistentStore<T extends object>(
  key: string,
  defaults: T,
  sanitize: (raw: Record<string, unknown>, defaults: T) => Partial<T>,
): PersistentStore<T> {
  let state: T = defaults;
  let loaded = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const readStorage = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaults;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...defaults, ...sanitize(parsed as Record<string, unknown>, defaults) };
      }
    } catch {
      /* corrupt or unavailable storage: fall through to defaults */
    }
    return defaults;
  };

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    state = readStorage();
    window.addEventListener("storage", (event) => {
      if (event.key === key) {
        state = readStorage();
        emit();
      }
    });
  };

  const get = (): T => {
    load();
    return state;
  };

  const subscribe = (listener: () => void) => {
    load();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const set: PersistentStore<T>["set"] = (patch) => {
    load();
    const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    state = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* quota exceeded or private mode: keep in-memory state */
    }
    emit();
  };

  return {
    useStore: () => useSyncExternalStore(subscribe, get, () => defaults),
    get,
    set,
  };
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const clamped = Math.min(max, Math.max(min, value));
  return integer ? Math.round(clamped) : clamped;
}

export function oneOf<const O extends readonly string[]>(value: unknown, options: O, fallback: O[number]): O[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as O[number]) : fallback;
}
