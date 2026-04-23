import { NextRequest } from "next/server";
import { logEvent } from "@/lib/telemetry";
import { buildRelevantContext } from "@/lib/ai-context";

/**
 * Chat proxy with multi-provider cascade.
 *
 * Primary:  Gemini 3 Flash Preview (Google Generative Language API)
 *           — ~1-5s first-token, excellent clinical reasoning.
 * Fallback: Kimi K2.6 (Ollama Cloud) — deep reasoning, slower (~30-60s).
 *
 * Converts each provider's native streaming format into a unified
 * OpenAI-style SSE stream so the client parser doesn't change:
 *   data: {"choices":[{"delta":{"content":"..."}}]}
 *
 * API keys are server-side only. `GOOGLE_API_KEY` primary, `OLLAMA_API_KEY` fallback.
 *
 * Behavior:
 *   - Per-IP token-bucket rate limit (30 req/min)
 *   - 85s upstream timeout (< Vercel 90s edge limit)
 *   - Scheduled SSE heartbeat every 5s if idle (keeps connection warm,
 *     prevents edge buffering)
 *   - Structured error codes: auth | rate_limited | timeout | model |
 *     network | bad_request | config | upstream
 */

export const runtime = "nodejs";
export const maxDuration = 90;

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${encodeURIComponent(key)}&alt=sse`;

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const OLLAMA_PRIMARY = process.env.OLLAMA_MODEL || "kimi-k2.6:cloud";
const OLLAMA_FALLBACK = process.env.OLLAMA_FALLBACK_MODEL || "gpt-oss:120b";

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;
const TIMEOUT_MS = 85_000;
const HEARTBEAT_MS = 5_000;

interface IncomingMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// --- Rate limiter ---------------------------------------------------------
interface Bucket { tokens: number; resetAt: number }
const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimit(ip: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    lastCleanup = now;
  }
  let b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    b = { tokens: RATE_MAX, resetAt: now + RATE_WINDOW_MS };
    buckets.set(ip, b);
  }
  if (b.tokens <= 0) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  b.tokens -= 1;
  return { ok: true };
}

// --- SSE helpers (always emit OpenAI-style to the client) -----------------
const enc = new TextEncoder();
const sseEncode = (text: string) =>
  enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
const sseError = (code: string, message: string) =>
  enc.encode(`data: ${JSON.stringify({ error: { code, message } })}\n\n`);
const sseHeartbeat = () => enc.encode(`: heartbeat\n\n`);
const sseDone = () => enc.encode("data: [DONE]\n\n");

// --- Message transforms ---------------------------------------------------

/** OpenAI-style -> Gemini-style. Concatenates all system messages into a
 *  single systemInstruction, converts assistant→model, wraps text in parts.
 */
function toGeminiBody(
  messages: IncomingMessage[],
  temperature: number
): unknown {
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const conv = messages.filter((m) => m.role !== "system");
  const contents = conv.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  // Gemini requires the first turn to be "user" — if the conversation begins
  // with an assistant greeting (auto-start), prepend a synthetic user turn.
  if (contents.length && contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: "(session start)" }] });
  }
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 2500,
      responseModalities: ["TEXT"],
    },
    // safetySettings loose for medical content (education)
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };
  if (sys) body.systemInstruction = { parts: [{ text: sys }] };
  return body;
}

// --- Streaming adapters ---------------------------------------------------

type StreamCtrl = ReadableStreamDefaultController<Uint8Array>;

/** Adapt Gemini SSE stream to OpenAI-style chunks flushed into ctrl. */
async function pumpGemini(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  ctrl: StreamCtrl,
  onFlush: () => void
): Promise<{ sawContent: boolean; upstreamError?: string }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let sawContent = false;
  let upstreamError: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    // eslint-disable-next-line no-cond-assign
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const obj = JSON.parse(data);
        // Error frame
        if (obj.error) {
          upstreamError = obj.error?.message || "Gemini error";
          break;
        }
        const candidates = obj.candidates;
        if (!Array.isArray(candidates)) continue;
        for (const cand of candidates) {
          const parts = cand?.content?.parts;
          if (!Array.isArray(parts)) continue;
          for (const p of parts) {
            if (p?.text) {
              sawContent = true;
              ctrl.enqueue(sseEncode(p.text));
              onFlush();
            }
          }
        }
      } catch {
        // skip malformed
      }
    }
  }
  return { sawContent, upstreamError };
}

/** Adapt Ollama NDJSON stream to OpenAI-style chunks flushed into ctrl. */
async function pumpOllama(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  ctrl: StreamCtrl,
  onFlush: () => void,
  showThinking: boolean
): Promise<{ sawContent: boolean; upstreamError?: string }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let sawContent = false;
  let upstreamError: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    // eslint-disable-next-line no-cond-assign
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line) as {
          message?: { content?: string; thinking?: string };
          done?: boolean;
          error?: string;
        };
        if (obj.error) {
          upstreamError = obj.error;
          break;
        }
        const content = obj.message?.content || "";
        if (content) {
          sawContent = true;
          ctrl.enqueue(sseEncode(content));
          onFlush();
        } else if (showThinking && obj.message?.thinking) {
          ctrl.enqueue(sseEncode("\u200b"));
          onFlush();
        }
        if (obj.done) break;
      } catch {
        // skip malformed
      }
    }
  }
  return { sawContent, upstreamError };
}

// --- Provider invocations -------------------------------------------------

async function callGemini(
  messages: IncomingMessage[],
  temperature: number,
  signal: AbortSignal
): Promise<Response> {
  const key = process.env.GOOGLE_API_KEY || "";
  if (!key) throw new Error("GOOGLE_API_KEY missing");
  return fetch(GEMINI_ENDPOINT(GEMINI_MODEL, key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toGeminiBody(messages, temperature)),
    signal,
  });
}

async function callOllama(
  model: string,
  messages: IncomingMessage[],
  temperature: number,
  signal: AbortSignal
): Promise<Response> {
  const key = process.env.OLLAMA_API_KEY || "";
  if (!key) throw new Error("OLLAMA_API_KEY missing");
  return fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: { temperature },
    }),
    signal,
  });
}

// --- Route handler --------------------------------------------------------

export async function POST(request: NextRequest) {
  // Rate limit
  const rl = rateLimit(getClientIp(request));
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: { code: "rate_limited", message: "Too many requests.", retryAfter: rl.retryAfter } }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) } }
    );
  }

  // Parse body
  let body: {
    messages?: IncomingMessage[];
    think?: boolean;
    temperature?: number;
    deep_thinking?: boolean;
    provider?: "gemini" | "ollama";
  } = {};
  try { body = await request.json(); }
  catch {
    return Response.json({ error: { code: "bad_request", message: "Invalid JSON body." } }, { status: 400 });
  }

  const messages = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: { code: "bad_request", message: "Messages array required." } }, { status: 400 });
  }

  const normalized: IncomingMessage[] = messages.slice(-40).map((m) => ({
    role: m.role,
    content: (m.content || "").toString().slice(0, 20000),
  }));

  // Retrieval grounding
  const lastUser = [...normalized].reverse().find((m) => m.role === "user");
  if (lastUser?.content) {
    const ctxBlock = buildRelevantContext(lastUser.content);
    if (ctxBlock) {
      normalized.unshift({
        role: "system",
        content: "RELEVANT REFERENCES (trust over general knowledge):\n" + ctxBlock,
      });
    }
  }

  const showThinking = body.think === true;
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.4;

  // Provider cascade. Gemini primary. Ollama fallback if explicitly requested
  // (deep_thinking / provider override) or if Gemini fails.
  const wantOllama = body.provider === "ollama" || body.deep_thinking === true;
  const hasGoogle = !!process.env.GOOGLE_API_KEY;
  const hasOllama = !!process.env.OLLAMA_API_KEY;

  type ProviderTag = { name: "gemini" } | { name: "ollama"; model: string };
  const providers: ProviderTag[] = [];
  if (wantOllama && hasOllama) {
    providers.push({ name: "ollama", model: body.deep_thinking ? OLLAMA_PRIMARY : OLLAMA_FALLBACK });
  }
  if (hasGoogle) providers.push({ name: "gemini" });
  if (hasOllama) providers.push({ name: "ollama", model: OLLAMA_FALLBACK });

  if (providers.length === 0) {
    return Response.json(
      { error: { code: "config", message: "No AI provider configured. Set GOOGLE_API_KEY or OLLAMA_API_KEY." } },
      { status: 500 }
    );
  }

  // Dedup providers while preserving order
  const seen = new Set<string>();
  const orderedProviders = providers.filter((p) => {
    const key = p.name === "ollama" ? `ollama:${p.model}` : "gemini";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let lastErr = "";

  for (let i = 0; i < orderedProviders.length; i++) {
    const p = orderedProviders[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const upstream =
        p.name === "gemini"
          ? await callGemini(normalized, temperature, controller.signal)
          : await callOllama(p.model, normalized, temperature, controller.signal);

      if (!upstream.ok || !upstream.body) {
        // Capture upstream error body for debugging
        let debug = "";
        try { debug = (await upstream.text()).slice(0, 300); } catch { /* ignore */ }
        lastErr = `${p.name} ${upstream.status}: ${debug}`;
        logEvent({ type: "error", message: "upstream non-ok", context: { provider: p.name, status: upstream.status } });
        clearTimeout(timeoutId);
        // Auth errors: stop immediately
        if (upstream.status === 401 || upstream.status === 403) {
          return Response.json(
            { error: { code: "auth", message: `AI service authentication failed (${p.name}).` } },
            { status: 502 }
          );
        }
        continue;
      }

      const label = p.name === "ollama" ? `${p.name}:${p.model}` : p.name;
      const usedFallback = i > 0;

      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      const readable = new ReadableStream({
        async start(ctrl) {
          // Prime: immediate heartbeat flushes headers + opens reader
          try { ctrl.enqueue(sseHeartbeat()); } catch { /* ignore */ }
          if (usedFallback) {
            try { ctrl.enqueue(sseEncode(`_(Using ${label} fallback)_\n\n`)); } catch { /* ignore */ }
          }

          let lastFlushAt = Date.now();
          const onFlush = () => { lastFlushAt = Date.now(); };

          heartbeatTimer = setInterval(() => {
            if (Date.now() - lastFlushAt >= HEARTBEAT_MS) {
              try { ctrl.enqueue(sseHeartbeat()); lastFlushAt = Date.now(); } catch { /* ignore */ }
            }
          }, HEARTBEAT_MS);

          const reader = upstream.body!.getReader();
          try {
            const result =
              p.name === "gemini"
                ? await pumpGemini(reader, ctrl, onFlush)
                : await pumpOllama(reader, ctrl, onFlush, showThinking);

            if (result.upstreamError) {
              ctrl.enqueue(sseError("model", result.upstreamError));
            } else if (!result.sawContent) {
              ctrl.enqueue(sseError("model", "No response from model."));
            }
            ctrl.enqueue(sseDone());
          } catch (streamErr) {
            const isAbort = (streamErr as Error)?.name === "AbortError";
            ctrl.enqueue(sseError(
              isAbort ? "timeout" : "network",
              isAbort ? "Upstream timed out." : `Stream error: ${(streamErr as Error).message}`
            ));
            ctrl.enqueue(sseDone());
          } finally {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            clearTimeout(timeoutId);
            ctrl.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          "X-AI-Provider": label,
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = (err as Error)?.name === "AbortError";
      lastErr = `${p.name} error: ${isAbort ? "timeout" : (err as Error).message}`;
      logEvent({ type: "error", message: "upstream fetch failed", context: { provider: p.name, err: lastErr } });
      if (isAbort && i === orderedProviders.length - 1) {
        return Response.json({ error: { code: "timeout", message: "Upstream timed out." } }, { status: 504 });
      }
      continue;
    }
  }

  return Response.json(
    { error: { code: "upstream", message: `All AI providers failed. ${lastErr}` } },
    { status: 502 }
  );
}
