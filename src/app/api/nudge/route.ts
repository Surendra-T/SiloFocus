import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { nudgeAgent, buildNudgePrompt } from "../../../mastra/agents/nudgeAgent";
import { getSessionsCollection } from "../../../lib/db/client";
import { normalizeSubject, type StudySession } from "../../../lib/db/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fallbackNudge(history: StudySession[], subject: string): string {
  const comeback = [...history].sort((a, b) => b.productivityScore - a.productivityScore)[0];
  if (comeback && comeback.productivityScore >= 7) {
    const day = comeback.completedAt.toLocaleDateString("en-US", { weekday: "long" });
    return `Remember ${day}? Your ${comeback.subject} session landed a ${comeback.productivityScore}/10 once you settled in. Close the extra tabs and give ${subject} one clean block.`;
  }
  return `You have been away for a moment. Take one slow breath, close the extra tabs, and give ${subject} just ten focused minutes.`;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const idle = typeof body.idleTimeSeconds === "number" && body.idleTimeSeconds >= 0 ? body.idleTimeSeconds : null;
  const subject = normalizeSubject(body.currentSubject);
  if (idle === null || !subject) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let history: StudySession[] = [];
  try {
    const coll = await getSessionsCollection();
    history = await coll.find({ subject }).sort({ completedAt: -1 }).limit(3).toArray();
    if (history.length === 0) {
      history = await coll.find().sort({ completedAt: -1 }).limit(3).toArray();
    }
  } catch (err) {
    console.error("[nudge] history unavailable", err);
  }

  return Sentry.startSpan({ name: "gemma-nudge", op: "ai.inference", attributes: { subject } }, async () => {
    try {
      const out = await nudgeAgent.generate([{ role: "user", content: buildNudgePrompt(history, subject, idle) }], {
        abortSignal: AbortSignal.timeout(25_000),
        modelSettings: { temperature: 0.8, maxOutputTokens: 140 },
      });
      const text = out.text.trim();
      if (!text) throw new Error("Empty nudge");
      return NextResponse.json({ nudge: text, source: "ai", context: { sessionsUsed: history.length } });
    } catch (err) {
      console.error("[nudge] model failed", err);
      Sentry.captureException(err);
      return NextResponse.json({
        nudge: fallbackNudge(history, subject),
        source: "fallback",
        context: { sessionsUsed: history.length },
      });
    }
  });
}
