import { Agent } from "@mastra/core/agent";
import type { StudySession } from "../../lib/db/models";
import { ollamaModel } from "../model";

const instructions = `You are an empathetic, witty older brother / mentor helping a student focus.
Your constraints:
- Respond in exactly 2-3 sentences, under 60 words.
- Reference at least one concrete data point from the provided study history (a subject, a score, or what worked for them).
- Never shame or guilt the student. No emojis.
- End with one concrete, tiny action to get back to work.`;

export const nudgeAgent = new Agent({
  id: "study-nudge",
  name: "SiloFocus Nudge",
  instructions,
  model: ollamaModel,
});

type HistoryItem = Pick<StudySession, "subject" | "moodScore" | "productivityScore" | "notes" | "completedAt">;

export function buildNudgePrompt(history: HistoryItem[], currentSubject: string, idleSeconds: number): string {
  const lines = history.map((h) => {
    const day = new Date(h.completedAt).toLocaleDateString("en-US", { weekday: "short" });
    return `${day} · ${h.subject} · mood ${h.moodScore} -> productivity ${h.productivityScore} · '${h.notes}'`;
  });
  const histStr = lines.length > 0 ? lines.join("\n") : "No prior history available.";
  return `The student should be studying ${currentSubject} but has been away or idle for about ${Math.round(idleSeconds)} seconds.
Recent study history:
${histStr}

Write the nudge.`;
}
