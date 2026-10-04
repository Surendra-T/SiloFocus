import { NextRequest, NextResponse } from "next/server";
import { nudgeAgent, buildNudgePrompt } from "../../../../mastra/agents/nudgeAgent";
import { getSessionsCollection } from "../../../../lib/db/models";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { idleTimeSeconds, currentSubject } = await req.json();
    if (typeof idleTimeSeconds !== "number" || typeof currentSubject !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let history: any[] = [];
    try {
      const coll = await getSessionsCollection();
      history = await coll.find({ subject: currentSubject }).sort({ completedAt: -1 }).limit(3).toArray();
      if (history.length === 0) {
        history = await coll.find().sort({ completedAt: -1 }).limit(3).toArray();
      }
    } catch (e) {
      console.error("DB error fetching history", e);
    }

    const prompt = buildNudgePrompt(history, currentSubject);

    return await Sentry.startSpan({ name: "gemma-nudge", op: "ai.inference" }, async (span) => {
      try {
        const out = await nudgeAgent.generate([{ role: "user", content: prompt }]);
        return NextResponse.json({ nudge: out.text, source: "ai", context: { sessionsUsed: history.length } });
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
        return NextResponse.json({ 
          nudge: "You've been away for a moment. Take a deep breath and let's get back to it. Close the tabs and refocus.", 
          source: "fallback", 
          context: { sessionsUsed: 0 } 
        });
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
