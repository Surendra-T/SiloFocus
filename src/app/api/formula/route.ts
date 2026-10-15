import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { normalizeSubject } from "../../../lib/db/models";
import { streamGeminiChat, TUTOR_SYSTEM_PROMPT, formulaPrompt } from "../../../lib/ai/geminiEdge";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = normalizeSubject(body.subject) ?? "General";
  const focus =
    typeof body.focus === "string"
      ? body.focus.slice(0, 200)
      : typeof body.message === "string"
        ? body.message.slice(0, 200)
        : "";

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      { role: "user", content: formulaPrompt(subject, focus) },
    ];

    return await streamGeminiChat({
      messages,
      temperature: 0.3,
      signal: req.signal,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[formula] generation failed", err);
    return NextResponse.json(
      { error: "Formula generation failed. Please verify your GEMINI_API_KEY." },
      { status: 503 },
    );
  }
}
