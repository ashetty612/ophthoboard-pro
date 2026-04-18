import { NextRequest } from 'next/server';

const PRIMARY_MODEL = "qwen/qwen3.6-plus:free";
const FALLBACK_MODEL = "google/gemini-3-flash-preview";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Messages array required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Try primary model first, fall back to secondary
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://ophthalmology-boards.vercel.app",
          "X-Title": "OphthoBoard Pro AI Examiner",
        },
        body: JSON.stringify({
          model,
          messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) continue;

      // Stream the response back to the client
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // If we're using fallback, notify the client
          if (model === FALLBACK_MODEL) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: "_Switching to Gemini 3 Flash..._\n\n" } }] })}\n\n`));
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch {
      continue;
    }
  }

  return new Response(JSON.stringify({ error: "All models failed" }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
}
