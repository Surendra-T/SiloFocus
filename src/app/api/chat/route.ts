import { NextRequest, NextResponse } from "next/server";
import { studyAgent } from "../../../../mastra/agents/studyAgent";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message, subject, history } = await req.json();
    if (!message || !subject || !Array.isArray(history)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    
    const messages = [...history, { role: "user", content: \Subject: \\\nQuestion: \\ }];

    return await Sentry.startSpan({ name: "gemma-doubt-solver", op: "ai.inference" }, async (span) => {
      try {
        const stream = await studyAgent.stream(messages);
        
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream.textStream) {
                controller.enqueue(encoder.encode(chunk));
              }
            } catch (err) {
              console.error("Stream error", err);
              controller.error(err);
            } finally {
              controller.close();
            }
          }
        });

        return new Response(readable, {
          headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache", "Connection": "keep-alive" }
        });
      } catch (err) {
        console.error("Inference error", err);
        Sentry.captureException(err);
        return new Response("The local tutor (Gemma 2) isn't responding — is ollama serve running?", { status: 503 });
      }
    });

  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
