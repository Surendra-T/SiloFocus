import { Agent } from "@mastra/core/agent";

const instructions = `You are an empathetic, witty older brother/mentor persona helping a 12th-grade student focus.
Your constraints:
- Respond in exactly 2-3 sentences.
- Keep it under 60 words.
- You must reference at least one concrete data point from the provided study history.
- Do not shame or guilt the student.
- Do not use emojis.
- End with a concrete, actionable micro-step to get back to studying.`;

export const nudgeAgent = new Agent({
  id: "study-nudge", name: "SiloFocus Nudge",
  instructions,
  model: {
    providerId: "ollama",
    modelId: process.env.OLLAMA_MODEL || "gemma2:9b",
    url: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1",
    apiKey: "ollama",
  },
});

export function buildNudgePrompt(history: any[], currentSubject: string): string {
  let histStr = history.map(h => {
    const day = new Date(h.completedAt).toLocaleDateString("en-US", { weekday: 'short' });
    return `${day} · ${h.subject} · mood ${h.moodScore} -> prod ${h.productivityScore} · '${h.notes}'`;
  }).join("\n");
  
  if (!histStr) histStr = "No prior history available for this subject.";
  
  return `The student is currently supposed to be studying ${currentSubject} but has been distracted or idle.
Here is their recent relevant study history:
${histStr}

Provide a short nudge.`;
}
