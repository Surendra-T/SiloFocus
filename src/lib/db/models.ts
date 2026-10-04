import type { ObjectId } from "mongodb";

/** Suggested subjects. Users may enter any custom subject string. */
export const DEFAULT_SUBJECTS = ["Physics", "Chemistry", "Mathematics"] as const;

/** A subject is any trimmed, non-empty label of at most 60 characters. */
export type Subject = string;

export const MAX_SUBJECT_LENGTH = 60;

export interface StudySession {
  _id?: ObjectId;
  subject: Subject;
  durationMinutes: number;
  completedAt: Date;
  moodScore: number;
  productivityScore: number;
  notes: string;
}

export type CheckInInput = Omit<StudySession, "_id" | "completedAt">;

export interface SubjectStats {
  hours: number;
  sessions: number;
  avgProductivity: number;
}

export interface RecentSession {
  _id: string;
  subject: Subject;
  durationMinutes: number;
  completedAt: string;
  moodScore: number;
  productivityScore: number;
  notes: string;
}

export interface SessionStats {
  totalHours: number;
  totalSessions: number;
  avgProductivity: number;
  avgMood: number;
  currentStreak: number;
  longestStreak: number;
  bySubject: Record<string, SubjectStats>;
  recent: RecentSession[];
}

export const COLLECTIONS = { sessions: "study_sessions" } as const;

/** Collapses whitespace, trims and truncates a user-supplied subject label. */
export function normalizeSubject(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim().slice(0, MAX_SUBJECT_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

export function isSubject(value: unknown): value is Subject {
  return normalizeSubject(value) !== null;
}

function toFiniteNumber(value: unknown): number {
  return typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
}

export function validateCheckIn(
  body: unknown,
): { ok: true; data: CheckInInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const raw = body as Record<string, unknown>;

  const subject = normalizeSubject(raw.subject);
  if (!subject) return { ok: false, error: "Invalid subject" };

  const durationMinutes = toFiniteNumber(raw.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0 || durationMinutes > 180) {
    return { ok: false, error: "Invalid duration" };
  }

  const moodScore = toFiniteNumber(raw.moodScore);
  if (!Number.isFinite(moodScore) || moodScore < 1 || moodScore > 10) {
    return { ok: false, error: "Invalid mood score" };
  }

  const productivityScore = toFiniteNumber(raw.productivityScore);
  if (!Number.isFinite(productivityScore) || productivityScore < 1 || productivityScore > 10) {
    return { ok: false, error: "Invalid productivity score" };
  }

  const notes = typeof raw.notes === "string" ? raw.notes.slice(0, 280) : "";

  return {
    ok: true,
    data: {
      subject,
      durationMinutes: Math.round(durationMinutes),
      moodScore: Math.round(moodScore),
      productivityScore: Math.round(productivityScore),
      notes,
    },
  };
}
