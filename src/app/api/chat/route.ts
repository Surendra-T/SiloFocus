import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { studyAgent } from "../../../mastra/agents/studyAgent";
import { normalizeSubject } from "../../../lib/db/models";

export const runtime = "nodejs";
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

function formulaPrompt(subject: string, focus: string): string {
  return `Create a compact exam cheat-sheet of the most important formulas and key concepts for "${subject}"${
    focus ? `, focusing on: ${focus}` : ""
  }.

Rules:
- Group with "## " headings (max 5 groups).
- Under each heading list 3-6 items as: **Name** — one short line, then the formula alone in a display block $$ ... $$.
- Use only KaTeX-compatible LaTeX (\\frac, \\sqrt, \\int, \\vec, \\Delta, subscripts with _{}).
- If the subject has few formulas, list key laws, definitions or rules instead (in plain text, math only where needed).
- No introduction and no closing remarks.`;
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

  return Sentry.startSpanManual(
    { name: "gemma-doubt-solver", op: "ai.inference", attributes: { subject, mode } },
    async (span) => {
      const startedAt = performance.now();
      let ended = false;
      const endSpan = () => {
        if (ended) return;
        ended = true;
        span.setAttribute("ai.total_ms", Math.round(performance.now() - startedAt));
        span.end();
      };

      try {
        const result = await studyAgent.stream(
          [...history, { role: "user", content: userContent }] as any,
          {
            abortSignal: req.signal,
            modelSettings: { temperature: mode === "formula" ? 0.3 : 0.5 },
          },
        );
        const reader = result.textStream.getReader();
        // Pull the first chunk before replying so connection failures surface as a real HTTP error.
        const first = await reader.read();
        if (first.done || !first.value) throw new Error("The model returned no output");
        span.setAttribute("ai.ttft_ms", Math.round(performance.now() - startedAt));

        const encoder = new TextEncoder();
        const body = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              controller.enqueue(encoder.encode(first.value));
              for (;;) {
                const next = await reader.read();
                if (next.done) break;
                if (next.value) controller.enqueue(encoder.encode(next.value));
              }
            } catch (err) {
              if (!req.signal.aborted) {
                Sentry.captureException(err);
                controller.enqueue(encoder.encode("\n\n_The response was interrupted._"));
              }
            } finally {
              endSpan();
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            }
          },
          cancel() {
            void reader.cancel().catch(() => undefined);
            endSpan();
          },
        });

        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
        });
      } catch (err) {
        endSpan();
        Sentry.captureException(err);
        console.error("[chat] inference failed", err);
        return NextResponse.json(
          { error: "The local tutor (Gemma 2) isn't responding. Is `ollama serve` running?" },
          { status: 503 },
        );
      }
    },
  );
}
