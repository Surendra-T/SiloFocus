import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { quizAgent } from "../../../mastra/agents/quizAgent";
import { getSessionsCollection } from "../../../lib/db/client";
import { normalizeSubject } from "../../../lib/db/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPTIONS = {
  modelSettings: { temperature: 0.7, maxOutputTokens: 160 },
} as const;

async function topicHint(subject: string): Promise<string> {
  try {
    const coll = await getSessionsCollection();
    const recent = await coll.find({ subject, notes: { $ne: "" } }).sort({ completedAt: -1 }).limit(2).toArray();
    return recent.map((s) => s.notes).join("; ").slice(0, 300);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const subject = normalizeSubject(body.subject);
  if (!subject) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });

  if (body.mode === "evaluate") {
    const question = typeof body.question === "string" ? body.question.slice(0, 600) : "";
    const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 1200) : "";
    if (!question || !answer) return NextResponse.json({ error: "Question and answer required" }, { status: 400 });

    return Sentry.startSpan({ name: "gemma-socratic-evaluate", op: "ai.inference", attributes: { subject } }, async () => {
      try {
        const out = await quizAgent.generate(
          [{ role: "user", content: `Evaluate this answer.\nSubject: ${subject}\nQuestion: ${question}\nStudent answer: ${answer}` }],
          { abortSignal: AbortSignal.timeout(25_000), ...OPTIONS },
        );
        const text = out.text.trim();
        if (!text) throw new Error("Empty evaluation");
        return NextResponse.json({ evaluation: text, source: "ai" });
      } catch (err) {
        Sentry.captureException(err);
        return NextResponse.json({
          evaluation: "Thanks for committing to an answer; retrieving it from memory is what makes it stick.",
          source: "fallback",
        });
      }
    });
  }

  const hint = await topicHint(subject);
  return Sentry.startSpan({ name: "gemma-socratic-question", op: "ai.inference", attributes: { subject } }, async () => {
    try {
      const out = await quizAgent.generate(
        [
          {
            role: "user",
            content: `Generate 1 sharp, conceptual, short-answer question on the subject "${subject}".${
              hint ? ` The student recently studied: ${hint}.` : ""
            } Output only the question.`,
          },
        ],
        { abortSignal: AbortSignal.timeout(25_000), ...OPTIONS },
      );
      const question = out.text.trim().replace(/^["'\s]+|["'\s]+$/g, "");
      if (!question) throw new Error("Empty question");
      return NextResponse.json({ question });
    } catch (err) {
      Sentry.captureException(err);
      return NextResponse.json({ error: "Could not generate a question" }, { status: 503 });
    }
  });
}
