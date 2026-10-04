import type { RecentSession, SessionStats, StudySession, SubjectStats } from "./models";

const DAY_MS = 86_400_000;

/** Calendar day (YYYY-MM-DD) of `date` in the viewer's timezone. `tzOffsetMinutes` follows Date#getTimezoneOffset. */
export function dayKey(date: Date, tzOffsetMinutes: number): string {
  return new Date(date.getTime() - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

function keyToDayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY_MS);
}

export function computeStreaks(
  dates: Date[],
  tzOffsetMinutes: number,
  now: Date = new Date(),
): { current: number; longest: number } {
  const days = Array.from(new Set(dates.map((d) => keyToDayNumber(dayKey(d, tzOffsetMinutes))))).sort(
    (a, b) => a - b,
  );
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = keyToDayNumber(dayKey(now, tzOffsetMinutes));
  const set = new Set(days);
  let cursor = set.has(today) ? today : set.has(today - 1) ? today - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, longest };
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function round(value: number, places = 1): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? null : round(num / denom, 2);
}

export function toRecent(session: StudySession): RecentSession {
  return {
    _id: String(session._id ?? ""),
    subject: session.subject,
    durationMinutes: session.durationMinutes,
    completedAt: session.completedAt.toISOString(),
    moodScore: session.moodScore,
    productivityScore: session.productivityScore,
    notes: session.notes,
  };
}

/** Sessions must be sorted newest-first. */
export function computeSessionStats(sessions: StudySession[], tzOffsetMinutes: number): SessionStats {
  const bySubjectRaw = new Map<string, { minutes: number; sessions: number; prod: number }>();
  for (const s of sessions) {
    const entry = bySubjectRaw.get(s.subject) ?? { minutes: 0, sessions: 0, prod: 0 };
    entry.minutes += s.durationMinutes;
    entry.sessions += 1;
    entry.prod += s.productivityScore;
    bySubjectRaw.set(s.subject, entry);
  }
  const bySubject: Record<string, SubjectStats> = {};
  for (const [subject, v] of bySubjectRaw) {
    bySubject[subject] = {
      hours: round(v.minutes / 60, 2),
      sessions: v.sessions,
      avgProductivity: round(v.prod / v.sessions, 1),
    };
  }
  const streaks = computeStreaks(
    sessions.map((s) => s.completedAt),
    tzOffsetMinutes,
  );
  return {
    totalHours: round(sessions.reduce((a, s) => a + s.durationMinutes, 0) / 60, 2),
    totalSessions: sessions.length,
    avgProductivity: round(mean(sessions.map((s) => s.productivityScore)), 1),
    avgMood: round(mean(sessions.map((s) => s.moodScore)), 1),
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    bySubject,
    recent: sessions.slice(0, 5).map(toRecent),
  };
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface IntelMetrics {
  windowDays: number;
  totalMinutes: number;
  totalSessions: number;
  avgMood: number;
  avgProductivity: number;
  moodProductivityCorrelation: number | null;
  bySubject: Record<string, { minutes: number; sessions: number; avgProductivity: number; avgMood: number }>;
  byTimeOfDay: Record<TimeOfDay, { sessions: number; avgProductivity: number }>;
  bestSubject: string | null;
  weakestSubject: string | null;
  peakWindow: TimeOfDay | null;
  last7AvgProductivity: number | null;
  previous7AvgProductivity: number | null;
  currentStreak: number;
}

function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function computeIntelMetrics(
  sessions: StudySession[],
  tzOffsetMinutes: number,
  windowDays: number,
  now: Date = new Date(),
): IntelMetrics {
  const subj = new Map<string, { minutes: number; prod: number[]; mood: number[] }>();
  const tod: Record<TimeOfDay, number[]> = { morning: [], afternoon: [], evening: [], night: [] };

  for (const s of sessions) {
    const entry = subj.get(s.subject) ?? { minutes: 0, prod: [], mood: [] };
    entry.minutes += s.durationMinutes;
    entry.prod.push(s.productivityScore);
    entry.mood.push(s.moodScore);
    subj.set(s.subject, entry);

    const localHour = new Date(s.completedAt.getTime() - tzOffsetMinutes * 60_000).getUTCHours();
    tod[timeOfDay(localHour)].push(s.productivityScore);
  }

  const bySubject: IntelMetrics["bySubject"] = {};
  for (const [name, v] of subj) {
    bySubject[name] = {
      minutes: v.minutes,
      sessions: v.prod.length,
      avgProductivity: round(mean(v.prod)),
      avgMood: round(mean(v.mood)),
    };
  }

  const ranked = Object.entries(bySubject).sort((a, b) => b[1].avgProductivity - a[1].avgProductivity);
  const byTimeOfDay = Object.fromEntries(
    (Object.keys(tod) as TimeOfDay[]).map((k) => [k, { sessions: tod[k].length, avgProductivity: round(mean(tod[k])) }]),
  ) as IntelMetrics["byTimeOfDay"];
  const peak = (Object.keys(byTimeOfDay) as TimeOfDay[])
    .filter((k) => byTimeOfDay[k].sessions > 0)
    .sort((a, b) => byTimeOfDay[b].avgProductivity - byTimeOfDay[a].avgProductivity)[0];

  const nowMs = now.getTime();
  const last7 = sessions.filter((s) => nowMs - s.completedAt.getTime() <= 7 * DAY_MS).map((s) => s.productivityScore);
  const prev7 = sessions
    .filter((s) => {
      const age = nowMs - s.completedAt.getTime();
      return age > 7 * DAY_MS && age <= 14 * DAY_MS;
    })
    .map((s) => s.productivityScore);

  return {
    windowDays,
    totalMinutes: sessions.reduce((a, s) => a + s.durationMinutes, 0),
    totalSessions: sessions.length,
    avgMood: round(mean(sessions.map((s) => s.moodScore))),
    avgProductivity: round(mean(sessions.map((s) => s.productivityScore))),
    moodProductivityCorrelation: pearson(
      sessions.map((s) => s.moodScore),
      sessions.map((s) => s.productivityScore),
    ),
    bySubject,
    byTimeOfDay,
    bestSubject: ranked[0]?.[0] ?? null,
    weakestSubject: ranked.length > 1 ? ranked[ranked.length - 1][0] : null,
    peakWindow: peak ?? null,
    last7AvgProductivity: last7.length ? round(mean(last7)) : null,
    previous7AvgProductivity: prev7.length ? round(mean(prev7)) : null,
    currentStreak: computeStreaks(
      sessions.map((s) => s.completedAt),
      tzOffsetMinutes,
      now,
    ).current,
  };
}
