"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import LensleyAvatar from "./brand/LensleyAvatar";

/**
 * Per-case AI-generated pearls. Click → Lensley generates 5–7 fresh
 * board-style pearls tailored to the exact case (uses the diagnosis,
 * presentation, and subspecialty in the prompt). Streams from the
 * existing /api/chat route with mode="pearls" so it inherits caching
 * + per-mode token budgets and doesn't burn extra serverless quota.
 *
 * Output is parsed line-by-line and rendered as a tight bullet list,
 * with a "Save as flashcards" hook on each pearl. We deliberately
 * keep this lean — no markdown rendering, no images — because pearls
 * are short one-liners and the chrome would compete with the text.
 */
interface Props {
  caseTitle: string;
  diagnosis: string;
  presentation?: string;
  subspecialty?: string;
}

const SYSTEM_PROMPT = `You are Lensley, the Chief Examiner. You generate high-yield ABO-board oral-exam pearls. Output FORMAT REQUIREMENTS:
- Numbered list, 5–7 pearls.
- Each pearl is ONE sentence (≤ 25 words).
- Cover: pathophys, exam clue, can't-miss DDx item, management specifics (drug + dose), one fatal flaw, one landmark trial if applicable, one follow-up pearl.
- No preamble. No "Here are…". Start with "1." on the first line.
- No closing summary.`;

function parsePearls(text: string): string[] {
  // Strip leading whitespace + common preamble lines
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const pearls: string[] = [];
  for (const line of lines) {
    // Match "1. ...", "1) ...", "- ...", "* ..."
    const m = line.match(/^(?:\d+[.)]|[-*•])\s+(.+)$/);
    if (m) {
      pearls.push(m[1].trim());
    } else if (pearls.length > 0 && !/^(here|note|remember|tip|the (above|following))/i.test(line)) {
      // Continuation of previous pearl (multi-line wrapping)
      pearls[pearls.length - 1] += " " + line;
    }
  }
  return pearls.filter((p) => p.length > 5);
}

export default function AIPearlsCard({ caseTitle, diagnosis, presentation, subspecialty }: Props) {
  const reduce = useReducedMotion();
  const [generating, setGenerating] = useState(false);
  const [pearls, setPearls] = useState<string[]>([]);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setPearls([]);
    setRaw("");
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg = `Generate fresh pearls for this case.\n\nDiagnosis: ${diagnosis}\nSubspecialty: ${subspecialty || "(unspecified)"}\nPresentation: ${presentation || caseTitle}\n\nRemember: numbered list, 5–7 single-sentence pearls, no preamble, no summary.`;

    let response: Response;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "pearls",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg },
          ],
        }),
        signal: abortRef.current.signal,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Network — try again.");
      }
      setGenerating(false);
      return;
    }

    if (!response.ok || !response.body) {
      setError("AI service error. Try again in a moment.");
      setGenerating(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let acc = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t || t.startsWith(":") || !t.startsWith("data: ")) continue;
          const data = t.slice(6);
          if (data === "[DONE]") continue;
          try {
            const obj = JSON.parse(data);
            if (obj.error) {
              setError(obj.error.message || "Model error.");
              continue;
            }
            const chunk = obj.choices?.[0]?.delta?.content || "";
            if (chunk) {
              acc += chunk;
              setRaw(acc);
              // Re-parse on every chunk so the list shows up live as
              // new lines stream in. parsePearls is cheap enough.
              setPearls(parsePearls(acc));
            }
          } catch { /* malformed chunk, ignore */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Stream broke — try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  const showCard = generating || pearls.length > 0 || raw.length > 0 || error;

  return (
    <div className="rounded-xl border border-primary-500/15 bg-gradient-to-br from-primary-500/5 to-slate-800/30 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-primary-500/30 bg-slate-900">
          <LensleyAvatar size={40} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-primary-200">
              Ask Lensley for case-specific pearls
            </p>
            {generating ? (
              <button
                onClick={stop}
                className="text-[11px] text-rose-300 hover:text-rose-200 transition-colors"
              >
                Stop
              </button>
            ) : pearls.length > 0 ? (
              <button
                onClick={generate}
                className="text-[11px] text-primary-300 hover:text-primary-200 transition-colors"
              >
                Regenerate
              </button>
            ) : (
              <button
                onClick={generate}
                className="rounded-md bg-primary-500/20 px-2.5 py-1 text-[11px] font-semibold text-primary-200 hover:bg-primary-500/30 transition-colors"
              >
                Generate
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Streams 5–7 fresh ABO-style pearls tailored to <span className="text-slate-300">{diagnosis}</span>.
            Doesn&apos;t burn your local content — uses Gemini.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 overflow-hidden"
          >
            {error ? (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-200">
                {error}
              </div>
            ) : pearls.length > 0 ? (
              <ol className="space-y-2 list-decimal list-inside">
                {pearls.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={reduce ? false : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.4) }}
                    className="text-sm text-slate-200 leading-relaxed marker:text-primary-400 marker:font-semibold"
                  >
                    <span className="ml-1">{p}</span>
                  </motion.li>
                ))}
              </ol>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <motion.span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary-400"
                  animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                Lensley is reasoning…
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
