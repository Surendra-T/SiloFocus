import { MongoClient, ObjectId, Db, Collection } from "mongodb";

export const SUBJECTS = ["Physics", "Chemistry", "Mathematics"] as const;
export type Subject = (typeof SUBJECTS)[number];

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

export interface SessionStats {
  totalHours: number;
  totalSessions: number;
  avgProductivity: number;
  avgMood: number;
  currentStreak: number;
  longestStreak: number;
  bySubject: Record<Subject, { hours: number; sessions: number; avgProductivity: number }>;
  recent: any[];
}

export const COLLECTIONS = { sessions: "study_sessions" } as const;

export function isSubject(v: unknown): v is Subject {
  return typeof v === "string" && SUBJECTS.includes(v as Subject);
}

export function validateCheckIn(body: any): { ok: true; data: CheckInInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  if (!isSubject(body.subject)) return { ok: false, error: "Invalid subject" };
  
  let dur = Number(body.durationMinutes);
  if (isNaN(dur) || dur < 0 || dur > 180) return { ok: false, error: "Invalid duration" };
  
  let mood = Number(body.moodScore);
  if (isNaN(mood) || mood < 1 || mood > 10) return { ok: false, error: "Invalid mood score" };
  
  let prod = Number(body.productivityScore);
  if (isNaN(prod) || prod < 1 || prod > 10) return { ok: false, error: "Invalid productivity score" };
  
  let notes = String(body.notes || "").slice(0, 280);
  
  return { ok: true, data: { subject: body.subject, durationMinutes: dur, moodScore: mood, productivityScore: prod, notes } };
}
