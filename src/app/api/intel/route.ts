import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { intelAgent } from "../../../mastra/agents/intelAgent";
import { getSessionsCollection } from "../../../lib/db/client";
import { computeIntelMetrics, type IntelMetrics } from "../../../lib/db/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;

function fallbackBrief(m: IntelMetrics): string {
  const hours = (m.totalMinutes / 60).toFixed(1);
  const lines = [
    `## Headline\nYou logged ${hours} hours across ${m.totalSessions} sessions with an average productivity of ${m.avgProductivity}/10.`,
  ];
  if (m.bestSubject) lines.push(`## What is working\n${m.bestSubject} is your strongest subject right now.`);
  if (m.weakestSubject) lines.push(`## Focus bottlenecks\n${m.weakestSubject} scores lowest; schedule it in your best window.`);
  if (m.peakWindow) lines.push(`## Peak productivity window\nYour best sessions happen in the ${m.peakWindow}.`);
  return lines.join("\n\n");
}

export async function GET(req: NextRequest) {
  const tzParam = Number(req.nextUrl.searchParams.get("tz"));
  const tz = Number.isFinite(tzParam) && Math.abs(tzParam) <= 840 ? tzParam : 0;

  let metrics: IntelMetrics;
  try {
    const coll = await getSessionsCollection();
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);
    const sessions = await coll.find({ completedAt: { $gte: since } }).sort({ completedAt: -1 }).limit(500).toArray();
    metrics = computeIntelMetrics(sessions, tz, WINDOW_DAYS);
  } catch (err) {
    console.error("[intel] database unavailable", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (metrics.totalSessions === 0) {
    return NextResponse.json({
      metrics,
      brief: "## Headline\nNo sessions yet. Complete a focus block and save a check-in to unlock your executive brief.",
      source: "fallback",
    });
  }

  return Sentry.startSpan({ name: "gemma-executive-brief", op: "ai.inference" }, async () => {
    try {
      const out = await intelAgent.generate(
        [{ role: "user", content: `Write the briefing from these metrics (last ${WINDOW_DAYS} days):\n${JSON.stringify(metrics)}` }],
        { abortSignal: AbortSignal.timeout(60_000), modelSettings: { temperature: 0.5, maxOutputTokens: 500 } },
      );
      const brief = out.text.trim();
      if (!brief) throw new Error("Empty brief");
      return NextResponse.json({ metrics, brief, source: "ai" });
    } catch (err) {
      Sentry.captureException(err);
      return NextResponse.json({ metrics, brief: fallbackBrief(metrics), source: "fallback" });
    }
  });
}
