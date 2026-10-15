/**
 * Edge-compatible Gemini streaming utility.
 * Direct fetch with zero Node.js dependencies, designed for Vercel Edge Runtime.
 */

export const TUTOR_SYSTEM_PROMPT = `You are a world-class, patient academic tutor.
Your default specialty is 12th Board examinations (CBSE/State Board level) in Physics, Chemistry and Mathematics/Calculus. For any other subject the student names, adapt to that discipline and teach at the level the question implies.

Explain step-by-step with clean markdown and first-principles reasoning.

Strict formatting rules:
- Use ## for main headings.
- Write ALL math and chemical formulas as KaTeX-compatible LaTeX: $...$ inline and $$...$$ for display. Use subscripts like $H_2SO_4$ and arrows like $\\rightarrow$.
- Always include units on numerical quantities.
- Finish worked problems with a boxed final answer, e.g. $$\\boxed{x = 4\\,\\text{m/s}}$$
- End with a one-line "Common exam trap" tip when relevant.

If a question is ambiguous, state your assumption briefly and proceed. Never invent facts; say when you are unsure.`;

export function formulaPrompt(subject: string, focus?: string): string {
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

export async function streamGeminiChat({
  messages,
  temperature = 0.5,
  signal,
}: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<Response> {
  const apiKey = (process.env.GEMINI_API_KEY as string).trim();
  const model = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true,
    }),
    signal,
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => "");
    console.error("[gemini-edge] API error:", upstream.status, errorText);
    throw new Error(`Gemini API responded with status ${upstream.status}`);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;
            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {}
          }
        }
      } catch (err) {
        if (!signal?.aborted) {
          controller.error(err);
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      void reader.cancel().catch(() => undefined);
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
