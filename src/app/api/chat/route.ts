import { NextRequest } from "next/server";
import { logEvent } from "@/lib/telemetry";
import { buildRelevantContext } from "@/lib/ai-context";

/**
 * Ollama Cloud chat proxy.
 *
 * Primary: gpt-oss:120b — fast (sub-5s first token), strong clinical reasoning.
 * Optional: kimi-k2.6:cloud — deep thinking, 256K context, slower (~30-60s).
 *   Enable with body.deep_thinking === true (not wired by default).
 * Fallback: gpt-oss:20b — cheaper fallback if 120b is rate-limited.
 *
 * Streams NDJSON -> OpenAI-style SSE and emits heartbeat comments every
 * 5s while upstream is silent, so Vercel's edge doesn't buffer and the
 * client can show live progress.
 */

export const runtime = "nodejs";
export const maxDuration = 90;

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "https://ollama.com";
const DEFAULT_PRIMARY = "gpt-oss:120b";
const DEFAULT_FALLBACK = "gpt-oss:20b";
const DEEP_MODEL = "kimi-k2.6:cloud";

const PRIMARY_MODEL = process.env.OLLAMA_MODEL || DEFAULT_PRIMARY;
const FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || DEFAULT_FALLBACK;

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;
const TIMEOUT_MS = 85_000; // slightly under Vercel maxDuration 90s
const HEARTBEAT_MS = 5_000;
const MAX_RETRIES = 2;
const NON_RETRYABLE = new Set([400, 401, 403, 404]);

interface IncomingMessage { role: "system" | "user" | "assistant"; content: string }

// --- Rate limiter (per-IP token bucket) ----------------------------------
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

// --- SSE helpers ----------------------------------------------------------
const enc = new TextEncoder();
const sseEncode = (text: string) =>
  enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
const sseError = (code: string, message: string) =>
  enc.encode(`data: ${JSON.stringify({ error: { code, message } })}\n\n`);
const sseHeartbeat = () => enc.encode(`: heartbeat\n\n`);
const sseDone = () => enc.encode("data: [DONE]\n\n");

// --- Upstream fetch with retry-with-jitter -------------------------------
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let attempt = 0;
  let lastErr: unknown;
  for (;;) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (NON_RETRYABLE.has(res.status) || attempt >= MAX_RETRIES) return res;
      lastErr = `status ${res.status}`;
      try { await res.body?.cancel(); } catch { /* ignore */ }
    } catch (err) {
      if ((err as Error)?.name === "AbortError" || attempt >= MAX_RETRIES) throw err;
      lastErr = err;
    }
    attempt += 1;
    const delay = Math.min(2000, 250 * 2 ** (attempt - 1)) + Math.random() * 200;
    logEvent({
      type: "warning",
      message: "ollama upstream retry",
      context: { attempt, delayMs: Math.round(delay), lastErr: String(lastErr) },
    });
    await new Promise((r) => setTimeout(r, delay));
  }
}

// --- Route handler --------------------------------------------------------
export async function POST(request: NextRequest) {
  const apiKey = process.env.OLLAMA_API_KEY || "";
  if (!apiKey) {
    return Response.json(
      { error: { code: "config", message: "Server not configured: OLLAMA_API_KEY missing." } },
      { status: 500 }
    );
  }

  const rl = rateLimit(getClientIp(request));
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: { code: "rate_limited", message: "Too many requests.", retryAfter: rl.retryAfter } }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: {
    messages?: IncomingMessage[];
    think?: boolean;
    temperature?: number;
    deep_thinking?: boolean;
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

  // Retrieval: ground the model in curated board-relevant references.
  const lastUser = [...normalized].reverse().find((m) => m.role === "user");
  if (lastUser && lastUser.content) {
    const ctxBlock = buildRelevantContext(lastUser.content);
    if (ctxBlock) {
      normalized.unshift({
        role: "system",
        content: "RELEVANT REFERENCES (trust these over general knowledge):\n" + ctxBlock,
      });
    }
  }

  const showThinking = body.think === true;
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.4;

  // Model cascade: caller can opt into deep reasoning with Kimi, but by
  // default we use gpt-oss:120b for speed. Fallback to gpt-oss:20b.
  const primary = body.deep_thinking ? DEEP_MODEL : PRIMARY_MODEL;
  const fallback = body.deep_thinking ? PRIMARY_MODEL : FALLBACK_MODEL;
  const models = [primary, fallback];
  let lastError = "";

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const upstream = await fetchWithRetry(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: normalized,
          stream: true,
          options: { temperature },
        }),
        signal: controller.signal,
      });

      if (!upstream.ok || !upstream.body) {
        lastError = `Upstream ${upstream.status} on ${model}`;
        logEvent({ type: "error", message: "ollama non-ok", context: { status: upstream.status, model } });
        clearTimeout(timeoutId);
        if (upstream.status === 401 || upstream.status === 403) {
          return Response.json({ error: { code: "auth", message: "AI service authentication failed." } }, { status: 502 });
        }
        continue;
      }

      const usedFallback = i > 0;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      const readable = new ReadableStream({
        async start(ctrl) {
          // Emit an initial byte IMMEDIATELY so the client opens its reader
          // and browser/CDN doesn't buffer. This is critical for perceived
          // responsiveness — without it, no bytes flow for 5-10s while the
          // model "thinks," and some edge proxies buffer the whole stream.
          try {
            ctrl.enqueue(sseHeartbeat());
          } catch { /* ignore */ }

          if (usedFallback) {
            try { ctrl.enqueue(sseEncode(`_(Using ${model} fallback)_\n\n`)); } catch { /* ignore */ }
          }

          // Heartbeat: every HEARTBEAT_MS, emit an SSE comment if we haven't
          // flushed anything recently. Keeps the connection alive and
          // prevents edge-layer buffering.
          let lastFlushAt = Date.now();
          heartbeatTimer = setInterval(() => {
            if (Date.now() - lastFlushAt >= HEARTBEAT_MS) {
              try { ctrl.enqueue(sseHeartbeat()); } catch { /* ignore */ }
            }
          }, HEARTBEAT_MS);

          const reader = upstream.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let sawContent = false;

          try {
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
                    ctrl.enqueue(sseError("model", obj.error));
                    lastFlushAt = Date.now();
                    continue;
                  }
                  const content = obj.message?.content || "";
                  const thinking = obj.message?.thinking || "";
                  if (content) {
                    sawContent = true;
                    ctrl.enqueue(sseEncode(content));
                    lastFlushAt = Date.now();
                  } else if (thinking && showThinking) {
                    // Forward thinking tokens as small visible progress
                    ctrl.enqueue(sseEncode("\u200b"));
                    lastFlushAt = Date.now();
                  } else if (thinking) {
                    // Silent heartbeat to keep the connection warm during long think
                    ctrl.enqueue(sseHeartbeat());
                    lastFlushAt = Date.now();
                  }
                  if (obj.done) break;
                } catch { /* skip malformed */ }
              }
            }
            if (!sawContent) ctrl.enqueue(sseError("model", "No response from model."));
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
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = (err as Error)?.name === "AbortError";
      lastError = `${isAbort ? "Timeout" : "Fetch error"} on ${model}: ${(err as Error).message}`;
      logEvent({ type: "error", message: "ollama fetch failed", context: { model, error: lastError } });
      if (isAbort && i === models.length - 1) {
        return Response.json({ error: { code: "timeout", message: "Upstream timed out." } }, { status: 504 });
      }
      continue;
    }
  }

  return Response.json(
    { error: { code: "upstream", message: `All AI models failed. ${lastError}` } },
    { status: 502 }
  );
}
