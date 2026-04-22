import { NextRequest } from "next/server";

/**
 * Ollama Cloud chat proxy.
 *
 * Talks to https://ollama.com/api/chat using Kimi K2.6 (a multimodal, high-
 * context reasoning model). The client already speaks OpenAI-style SSE
 * (`data: {"choices":[{"delta":{"content":"..."}}]}`), so this route:
 *   1) fetches from Ollama's NDJSON streaming endpoint,
 *   2) filters internal "thinking" tokens unless ?think=1,
 *   3) re-emits chunks as OpenAI-style SSE so the existing client works.
 *
 * Auth is server-side only (OLLAMA_API_KEY env var) — never exposed to browser.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const PRIMARY_MODEL = process.env.OLLAMA_MODEL || "kimi-k2.6:cloud";
// Fallback if primary is temporarily rate-limited or unavailable. gpt-oss is
// Ollama's own cloud model and is guaranteed available.
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || "gpt-oss:120b";

interface IncomingMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function sseEncode(text: string) {
  return new TextEncoder().encode(
    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
  );
}

function sseDone() {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

function sseNotice(text: string) {
  return sseEncode(text);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OLLAMA_API_KEY || "";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server not configured: OLLAMA_API_KEY missing." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { messages?: IncomingMessage[]; think?: boolean; temperature?: number } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Messages array required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Safety: clamp message length to avoid oversized payloads
  const normalizedMessages = messages
    .slice(-40) // last 40 messages max (model context is 256K — this is conservative)
    .map((m) => ({
      role: m.role,
      content: (m.content || "").toString().slice(0, 20000),
    }));

  const showThinking = body.think === true;
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.5;

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];

  let lastError = "";

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const upstream = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: normalizedMessages,
          stream: true,
          options: {
            temperature,
          },
        }),
      });

      if (!upstream.ok) {
        lastError = `Upstream ${upstream.status} on ${model}`;
        // For auth errors, don't bother with fallback
        if (upstream.status === 401 || upstream.status === 403) {
          return new Response(
            JSON.stringify({ error: "AI service authentication failed." }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }
        continue;
      }

      if (!upstream.body) {
        lastError = `No body on ${model}`;
        continue;
      }

      // Adapt NDJSON → SSE
      const readable = new ReadableStream({
        async start(controller) {
          // If we fell back, tell the client once
          if (i > 0) {
            controller.enqueue(
              sseNotice(`_(Using ${model} fallback)_\n\n`)
            );
          }

          const reader = upstream.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let sawAnyContent = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              // NDJSON: split on \n, keep remainder in buffer
              let idx: number;
              // eslint-disable-next-line no-cond-assign
              while ((idx = buffer.indexOf("\n")) >= 0) {
                const line = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 1);
                if (!line) continue;

                try {
                  const obj = JSON.parse(line) as {
                    message?: { role?: string; content?: string; thinking?: string };
                    done?: boolean;
                    error?: string;
                  };
                  if (obj.error) {
                    controller.enqueue(sseNotice(`\n\n_Upstream error: ${obj.error}_`));
                    continue;
                  }
                  const content = obj.message?.content || "";
                  const thinking = obj.message?.thinking || "";
                  if (content) {
                    sawAnyContent = true;
                    controller.enqueue(sseEncode(content));
                  } else if (thinking && showThinking) {
                    controller.enqueue(
                      sseEncode(`\u200b`) // zero-width space to keep stream alive; could also forward italicized thinking
                    );
                  }
                  if (obj.done) break;
                } catch {
                  // Skip malformed JSON lines
                }
              }
            }

            // If upstream closed without any content (rare), tell the client
            if (!sawAnyContent) {
              controller.enqueue(sseNotice("_(No response from model — please retry.)_"));
            }
            controller.enqueue(sseDone());
          } catch (streamErr) {
            controller.enqueue(
              sseNotice(`\n\n_Stream error: ${(streamErr as Error).message}_`)
            );
            controller.enqueue(sseDone());
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          // Let middleware know not to buffer (Vercel)
          "X-Accel-Buffering": "no",
        },
      });
    } catch (err) {
      lastError = `Fetch error on ${model}: ${(err as Error).message}`;
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: `All AI models failed. ${lastError}` }),
    { status: 502, headers: { "Content-Type": "application/json" } }
  );
}
