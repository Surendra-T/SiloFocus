"use client";

import { createPersistentStore, clampNumber, oneOf } from "../store/createPersistentStore";
import { normalizeSubject } from "../db/models";

export const TOPOLOGIES = ["radial", "flip", "analog", "linear"] as const;
export type Topology = (typeof TOPOLOGIES)[number];

export const TICK_PRESETS = ["off", "grandfather", "pocket", "soft"] as const;
export type TickSetting = (typeof TICK_PRESETS)[number];

export const CHIME_PRESETS = ["bowl", "shinkansen", "bell"] as const;
export type ChimeSetting = (typeof CHIME_PRESETS)[number];

export interface AmbientVolumes {
  brown: number;
  pink: number;
  rain: number;
}

export interface Settings {
  subject: string;
  recentSubjects: string[];
  topology: Topology;
  studyMin: number;
  breakMin: number;
  flow: boolean;
  tickPreset: TickSetting;
  tickVolume: number;
  chimePreset: ChimeSetting;
  chimeVolume: number;
  masterVolume: number;
  muted: boolean;
  ambientVolumes: AmbientVolumes;
  socratic: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  subject: "Physics",
  recentSubjects: [],
  topology: "radial",
  studyMin: 25,
  breakMin: 5,
  flow: false,
  tickPreset: "off",
  tickVolume: 0.5,
  chimePreset: "bowl",
  chimeVolume: 0.7,
  masterVolume: 0.8,
  muted: false,
  ambientVolumes: { brown: 0.5, pink: 0.5, rain: 0.5 },
  socratic: false,
};

function sanitize(raw: Record<string, unknown>, d: Settings): Partial<Settings> {
  const av = (raw.ambientVolumes && typeof raw.ambientVolumes === "object" ? raw.ambientVolumes : {}) as Record<
    string,
    unknown
  >;
  const recent = Array.isArray(raw.recentSubjects)
    ? Array.from(
        new Set(raw.recentSubjects.map((s) => normalizeSubject(s)).filter((s): s is string => s !== null)),
      ).slice(0, 6)
    : d.recentSubjects;

  return {
    subject: normalizeSubject(raw.subject) ?? d.subject,
    recentSubjects: recent,
    topology: oneOf(raw.topology, TOPOLOGIES, d.topology),
    studyMin: clampNumber(raw.studyMin, 1, 120, d.studyMin, true),
    breakMin: clampNumber(raw.breakMin, 1, 30, d.breakMin, true),
    flow: raw.flow === true,
    tickPreset: oneOf(raw.tickPreset, TICK_PRESETS, d.tickPreset),
    tickVolume: clampNumber(raw.tickVolume, 0, 1, d.tickVolume),
    chimePreset: oneOf(raw.chimePreset, CHIME_PRESETS, d.chimePreset),
    chimeVolume: clampNumber(raw.chimeVolume, 0, 1, d.chimeVolume),
    masterVolume: clampNumber(raw.masterVolume, 0, 1, d.masterVolume),
    muted: raw.muted === true,
    ambientVolumes: {
      brown: clampNumber(av.brown, 0, 1, d.ambientVolumes.brown),
      pink: clampNumber(av.pink, 0, 1, d.ambientVolumes.pink),
      rain: clampNumber(av.rain, 0, 1, d.ambientVolumes.rain),
    },
    socratic: raw.socratic === true,
  };
}

export const settingsStore = createPersistentStore<Settings>("silofocus-settings-v1", DEFAULT_SETTINGS, sanitize);

export function useSettingsStore() {
  const settings = settingsStore.useStore();
  return { settings, update: settingsStore.set };
}

/** Sets the active subject and remembers it in the recent list. */
export function setSubject(input: string): void {
  const subject = normalizeSubject(input);
  if (!subject) return;
  settingsStore.set((prev) => ({
    subject,
    recentSubjects: [subject, ...prev.recentSubjects.filter((s) => s !== subject)].slice(0, 6),
  }));
}
