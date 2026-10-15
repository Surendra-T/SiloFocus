import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { normalizeSubject } from "../../../lib/db/models";
import { streamGeminiChat, TUTOR_SYSTEM_PROMPT, formulaPrompt } from "../../../lib/ai/geminiEdge";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

function parseHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { role, content } = item as Record<string, unknown>;
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content: content.slice(0, 4000) });
    }
  }
  return out.slice(-12);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = normalizeSubject(body.subject) ?? "General";
  const mode = body.mode === "formula" ? "formula" : "doubt";
  const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

  let userContent: string;
  let history: ChatMessage[];
  if (mode === "formula") {
    userContent = formulaPrompt(subject, rawMessage.slice(0, 200));
    history = [];
  } else {
    if (!rawMessage || rawMessage.length > 4000) {
      return NextResponse.json({ error: "Message must be 1-4000 characters" }, { status: 400 });
    }
    userContent = `Subject: ${subject}\nQuestion: ${rawMessage}`;
    history = parseHistory(body.history);
  }

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userContent },
    ];

    return await streamGeminiChat({
      messages,
      temperature: mode === "formula" ? 0.3 : 0.5,
      signal: req.signal,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[chat] inference failed", err);
    return NextResponse.json(
      { error: "The tutor isn't responding. Please verify your GEMINI_API_KEY." },
      { status: 503 },
    );
  }
}
