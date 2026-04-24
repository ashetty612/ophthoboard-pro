"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";

/**
 * AI Examiner — powered by Gemini 3 Flash Preview (primary) via Google
 * Generative Language API, with Ollama Cloud (Kimi K2.6 / gpt-oss:120b)
 * as server-side fallback. API keys are server-side only; client never sees them.
 *
 * Fixes applied after debugging session:
 *   - Slim system prompts (~600 tokens, was ~7000). Fatal flaws injected
 *     via retrieval only when relevant.
 *   - Every mode auto-starts with meaningful content on session start.
 *   - Case images embedded directly in chat bubbles (not just linked).
 *   - Live elapsed-time indicator while the model is responding.
 *   - Inline markdown image rendering (![alt](url) → <img>).
 *   - Prompt quality: cite briefly, always explain WHY+HOW, end with 2-3 pearls.
 */

interface AIExaminerProps {
  database: CasesDatabase;
  onBack: () => void;
  initialCase?: CaseData | null;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

type ExaminerMode =
  | "examiner"
  | "viva"
  | "quiz"
  | "ddx-drill"
  | "soap"
  | "case-builder"
  | "deep-dive"
  | "pearls"
  | "tutor"
  | "free-chat";

// ---------------------------------------------------------------------------
// System prompts — intentionally lean. Retrieval layer on the server adds
// fatal-flaw / trial / PPP context only when relevant to the query.
// ---------------------------------------------------------------------------

const BASE_PROMPT = `You are a world-class ophthalmology oral board examiner, educator, and practicing ophthalmologist. You draw on AAO PPP guidelines, BCSC, Ryan's Retina, Albert & Jakobiec, Walsh & Hoyt, Kanski, landmark RCTs, and surgical textbooks.

RESPONSE QUALITY — every substantive answer must:
1. Be clinically, surgically, and board-relevant.
2. Explain the WHY (mechanism/pathophysiology) AND the HOW (technique or decision rule).
3. Cite briefly in-line: e.g. "per ONTT", "AAO PPP 2023 Glaucoma", "BCSC §10-ch4", "EVS", "DRCR Protocol T", "Ryan §58". Prefer short in-text references over paragraphs.
4. End with 2-3 high-yield PEARLS (one-liners, board-hitting).
5. Name the must-not-miss fatal flaw if one applies, and say the exact safety-net phrase.
6. Use specific drug names, doses, and surgical steps — never vague "antibiotics".
7. When you know a trial's result, state the number (e.g., "ONTT: IVMP 1g × 3d sped recovery but did not change final VA").

ABO EXAM FORMAT (know cold):
- 42 Patient Management Problems across 3 virtual rooms (50 min each), 6 equally-weighted topic areas: Anterior, External/Adnexa, Neuro/Orbit, Optics, Peds/Strab, Posterior.
- Compensatory 3-domain scoring 0-3: Data Acquisition · Diagnosis · Management. Pass/fail only.
- 8-element PMP: Describe → History → Exam → Differential (incl. can't-miss) → Workup → Diagnosis → Management → Follow-up. Management+follow-up ≈ 40% of score.
- Target pace: ≤ 3.5 min/case.

You are also a learning expert. Teach with active recall, interleaving, "soliloquy" verbal scripts, and spaced review. Be direct and information-dense — no fluff.`;

function buildSystemPrompt(
  mode: ExaminerMode,
  currentCase?: CaseData | null,
  subspecialtyFocus?: string
): string {
  let modeRules = "";
  switch (mode) {
    case "examiner":
      modeRules = `MODE: ORAL BOARD EXAMINER
Professional, neutral, terse. Progressive disclosure — give only chief complaint and image; reveal history/exam only when asked. If candidate jumps to treatment without a differential, interrupt: "Before management — your differential?" After the candidate's plan, throw ONE curveball (allergy, surgical complication, pharmacy shortage). Never say "Good job"/"Correct"; use "Okay," "What else?", or move on. End case with 3-domain score (0-3 each), missed elements, and any fatal flaw.`;
      break;
    case "viva":
      modeRules = `MODE: VIVA VOCE
Fire one focused question. Demand ≤ 3-sentence commits. If candidate rambles, interrupt: "Stop. Commit." Neutral "Hm," "Go on." After 3 Qs, give domain scores.`;
      break;
    case "quiz":
      modeRules = `MODE: RAPID-FIRE QUIZ
Ask one question at a time. Brief stem (1-2 sentences), one focused question tagged to Data-Acq / Dx / Mgmt. Wait for candidate. Score on specificity — penalize "antibiotics". Flag fatal flaws. After 10 Qs give: "Data-Acq X/10, Dx X/10, Mgmt X/10."`;
      break;
    case "ddx-drill":
      modeRules = `MODE: DDX DRILL
Present a chief complaint ("Leukocoria, 2yo"). Ask for 5 DDx ordered most-likely first, with can't-miss included. Score on order, can't-miss, reasoning. Then give gold-standard 5 DDx. Cycle subspecialties.`;
      break;
    case "soap":
      modeRules = `MODE: SOAP NOTE PRACTICE
Present a scenario. Candidate writes SOAP (S/O/A/P). Critique ruthlessly — what's missing, wordy, vague. Then show the ideal SOAP (5-8 dense sentences).`;
      break;
    case "case-builder":
      modeRules = `MODE: CASE BUILDER
Generate a novel boards-style case. Output:
**CHIEF COMPLAINT** · **IMAGE DESCRIPTION** · **KEY HISTORY** (3-5 bullets) · **KEY EXAM** (relevant findings) · **ANTICIPATED PROBES** (3 Qs) · **FATAL FLAW TESTED** · **MODEL 8-ELEMENT RESPONSE** (fully-worked soliloquy).`;
      break;
    case "deep-dive":
      modeRules = `MODE: SUBSPECIALTY DEEP-DIVE
Lecture on the requested topic. Sections: Epidemiology · Pathophys · Classic presentation (+photo desc) · Differential (3-5) · Workup (with WHY) · Diagnosis · Management (medical→laser→surgical tiers) · Follow-up · Landmark trials (1-3, with numbers) · 5-8 board pearls · Fatal flaws. End with a pop quiz on the single most-tested fact.`;
      break;
    case "pearls":
      modeRules = `MODE: PEARL DUMP
Return the topic's top 10-15 board pearls as numbered one-liners. Then ### Fatal flaws (with exact safety-net phrases). ### Key trials (with numbers). ### Mnemonics. Dense, scannable, no fluff.`;
      break;
    case "tutor":
      modeRules = `MODE: TEACHING TUTOR
Teach the requested topic with structure + pearls + trials + mnemonics. Explain WHY and HOW. End with "Want me to quiz you on this?"`;
      break;
    default:
      modeRules = `MODE: FREE DISCUSSION
Help with any ophthalmology or exam-prep topic. Be specific, thorough, board-relevant.`;
  }

  const extra: string[] = [];
  if (subspecialtyFocus) extra.push(`SUBSPECIALTY FOCUS: ${subspecialtyFocus}`);

  if (currentCase) {
    const img =
      currentCase.imageFile
        ? `/images/${currentCase.imageFile}`
        : currentCase.externalImageUrl || null;
    const lines = [
      `CURRENT CASE`,
      `Title: ${currentCase.diagnosisTitle || currentCase.title}`,
      `Presentation: ${currentCase.presentation || "(not provided)"}`,
    ];
    if (currentCase.photoDescription) lines.push(`Photo: ${currentCase.photoDescription}`);
    if (img) lines.push(`Image: ${img} (use ![Clinical photo](${img}) in your first message)`);
    if (currentCase.questions && currentCase.questions.length) {
      const modelAnswers = currentCase.questions
        .slice(0, 6)
        .map((q) => `Q${q.number} ${q.question}\n   A: ${(q.answer || "").slice(0, 500)}`)
        .join("\n");
      lines.push(`Model answers (reference only — challenge the candidate; don't give these away):\n${modelAnswers}`);
    }
    extra.push(lines.join("\n"));
  }

  return [BASE_PROMPT, modeRules, ...extra].join("\n\n");
}

// ---------------------------------------------------------------------------
// Pre-computed opening messages — show INSTANTLY while AI warms up (or instead).
// ---------------------------------------------------------------------------

function pickRandomCaseWithImage(database: CasesDatabase): CaseData | null {
  const candidates = database.subspecialties
    .flatMap((s) => s.cases)
    .filter((c) => c.questions && c.questions.length > 0 && (c.imageFile || c.externalImageUrl));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function caseOpeningMessage(c: CaseData): string {
  const imgUrl = c.imageFile ? `/images/${c.imageFile}` : c.externalImageUrl || "";
  const lead = c.presentation?.trim() || c.title;
  const parts: string[] = [];
  if (imgUrl) parts.push(`![Clinical photo](${imgUrl})`);
  parts.push(`**Case.** ${lead}`);
  parts.push(`_Describe what you see in the image. Then walk me through your approach._`);
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Streaming with elapsed-time progress + error-code-aware fallback messages
// ---------------------------------------------------------------------------

async function streamViaProxy(
  messages: Message[],
  onChunk: (text: string) => void,
  onProgress: (firstByteMs: number) => void,
  onError: (code: string, message: string) => void,
  signal?: AbortSignal
): Promise<boolean> {
  const start = performance.now();
  let firstByteReported = false;
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return false;
    onError("network", (e as Error).message || "Connection failed.");
    return false;
  }

  if (!response.ok) {
    try {
      const err = await response.json();
      const code = err?.error?.code || "upstream";
      const msg = err?.error?.message || response.statusText;
      onError(code, msg);
    } catch {
      onError("upstream", response.statusText);
    }
    return false;
  }

  const reader = response.body?.getReader();
  if (!reader) return false;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (e) {
      if ((e as Error).name === "AbortError") return false;
      onError("network", (e as Error).message || "Stream broke.");
      return false;
    }
    if (chunk.done) break;
    if (!firstByteReported) {
      firstByteReported = true;
      onProgress(Math.round(performance.now() - start));
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue; // heartbeat comment
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          onError(parsed.error.code || "model", parsed.error.message || "Model error.");
          continue;
        }
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch { /* skip malformed */ }
    }
  }
  return true;
}

function friendlyError(code: string, msg: string): string {
  const prefix =
    code === "rate_limited" ? "⏱️ Slow down — " :
    code === "timeout" ? "⌛ That took too long — try a shorter or simpler question. " :
    code === "auth" ? "🔒 " :
    code === "network" ? "📡 Network hiccup — " :
    code === "model" ? "🤖 AI model error — " :
    code === "config" ? "⚙️ " : "";
  return `${prefix}${msg}`;
}

// ---------------------------------------------------------------------------
// Markdown rendering: links, bold, italic, AND inline images.
// ---------------------------------------------------------------------------

interface MdPart {
  type: "text" | "link" | "bold" | "italic" | "image" | "heading" | "br";
  content: string;
  href?: string;
  level?: number;
}

function parseMarkdown(text: string): MdPart[] {
  const out: MdPart[] = [];
  // Split by lines for heading/break detection, but keep inline inside each line
  const lines = text.split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      out.push({ type: "heading", content: headingMatch[2], level: headingMatch[1].length });
      if (li < lines.length - 1) out.push({ type: "br", content: "" });
      continue;
    }
    // Parse inline
    let rem = line;
    while (rem.length > 0) {
      const matches: Array<{ type: MdPart["type"]; index: number; full: string; c: string; href?: string }> = [];
      const imgM = rem.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgM?.index !== undefined) matches.push({ type: "image", index: imgM.index, full: imgM[0], c: imgM[1], href: imgM[2] });
      const lnkM = rem.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lnkM?.index !== undefined) matches.push({ type: "link", index: lnkM.index, full: lnkM[0], c: lnkM[1], href: lnkM[2] });
      const bM = rem.match(/\*\*([^*]+)\*\*/);
      if (bM?.index !== undefined) matches.push({ type: "bold", index: bM.index, full: bM[0], c: bM[1] });
      const iM = rem.match(/(?:^|[^*_])[*_]([^*_]+)[*_](?:[^*_]|$)/);
      if (iM?.index !== undefined) {
        const inner = iM[1];
        const leading = iM[0].indexOf(inner) - 1;
        const absIdx = iM.index + leading;
        matches.push({ type: "italic", index: absIdx, full: inner, c: inner });
      }
      matches.sort((a, b) => a.index - b.index);
      if (!matches.length) { out.push({ type: "text", content: rem }); break; }
      const m = matches[0]!;
      if (m.index > 0) out.push({ type: "text", content: rem.slice(0, m.index) });
      if (m.type === "image") out.push({ type: "image", content: m.c, href: m.href });
      else if (m.type === "link") out.push({ type: "link", content: m.c, href: m.href });
      else if (m.type === "bold") out.push({ type: "bold", content: m.c });
      else if (m.type === "italic") out.push({ type: "italic", content: m.c });
      rem = rem.slice(m.index + m.full.length);
    }
    if (li < lines.length - 1) out.push({ type: "br", content: "" });
  }
  return out;
}

function renderMarkdown(text: string) {
  const parts = parseMarkdown(text);
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "image") {
          return (
            <img
              key={i}
              src={part.href}
              alt={part.content || "Clinical image"}
              className="my-2 max-h-96 w-auto rounded-xl border border-slate-700/50 block"
              loading="lazy"
            />
          );
        }
        if (part.type === "link") {
          return (
            <a key={i} href={part.href} target="_blank" rel="noopener noreferrer"
               className="text-primary-400 hover:text-primary-300 underline font-medium">
              {part.content}
            </a>
          );
        }
        if (part.type === "bold") {
          return <strong key={i} className="font-semibold text-white">{part.content}</strong>;
        }
        if (part.type === "italic") {
          return <em key={i} className="text-slate-300 italic">{part.content}</em>;
        }
        if (part.type === "heading") {
          const size = part.level === 1 ? "text-lg" : part.level === 2 ? "text-base" : "text-sm";
          return <strong key={i} className={`block ${size} font-bold text-white mt-2 mb-1`}>{part.content}</strong>;
        }
        if (part.type === "br") return <br key={i} />;
        return <span key={i}>{part.content}</span>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------

const MODE_CARDS: Array<[ExaminerMode, string, string, string]> = [
  ["examiner", "🎓 Mock Examiner", "Full ABO-style simulation with a real case + curveballs + 3-domain scoring.", "from-rose-500 to-orange-500"],
  ["viva", "🎤 Viva Voce", "Verbal pressure; ≤3 sentence answers enforced.", "from-rose-600 to-pink-600"],
  ["quiz", "⚡ Rapid Quiz", "Rapid-fire questions; instant domain-tagged scoring.", "from-amber-500 to-yellow-500"],
  ["ddx-drill", "🎯 DDx Drill", "'Give me 5 DDx for...' cycled across subspecialties.", "from-fuchsia-500 to-purple-600"],
  ["soap", "📋 SOAP Practice", "Write a SOAP note; AI critiques & shows the ideal.", "from-cyan-500 to-blue-600"],
  ["case-builder", "🧪 Case Builder", "AI generates novel cases tailored to your gaps.", "from-teal-500 to-emerald-600"],
  ["deep-dive", "📖 Deep Dive", "Structured subspecialty lecture + trials + fatal flaws.", "from-indigo-500 to-violet-600"],
  ["pearls", "💎 Pearl Dump", "Top 10-15 board pearls + fatal flaws + mnemonics.", "from-amber-400 to-orange-400"],
  ["tutor", "📚 Teaching Tutor", "Deep explanations with pearls, trials, mnemonics.", "from-emerald-500 to-teal-500"],
  ["free-chat", "💬 Free Chat", "Open discussion.", "from-primary-500 to-violet-500"],
];

// Suggested opening prompts when user hasn't entered a subspecialty focus
const AUTO_START_PROMPT: Record<ExaminerMode, string> = {
  examiner: "Start the case. I'll walk through my approach.",
  viva: "First question.",
  quiz: "Start the quiz. First question.",
  "ddx-drill": "First DDx prompt.",
  soap: "Present the first SOAP-practice scenario.",
  "case-builder": "Build a novel boards-style case.",
  "deep-dive": "Begin with a high-yield topic and structured lecture.",
  pearls: "Dump your top pearls for today's highest-yield topic.",
  tutor: "What topic would you like me to cover? If unsure, start with something high-yield.",
  "free-chat": "Hi! What's on your mind today?",
};

export default function AIExaminer({ database, onBack, initialCase }: AIExaminerProps) {
  const [mode, setMode] = useState<ExaminerMode>("examiner");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [firstByteMs, setFirstByteMs] = useState<number | null>(null);
  const [currentCase, setCurrentCase] = useState<CaseData | null>(initialCase || null);
  const [subspecialtyFocus, setSubspecialtyFocus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // List of cases with images for Examiner mode random-pick
  const casesWithImages = useMemo(
    () =>
      database.subspecialties
        .flatMap((s) => s.cases)
        .filter((c) => c.questions?.length > 0 && (c.imageFile || c.externalImageUrl)),
    [database]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started && inputRef.current) inputRef.current.focus();
  }, [started, isStreaming]);

  useEffect(() => () => { abortRef.current?.abort(); if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current); }, []);

  const startElapsed = () => {
    const t0 = performance.now();
    setElapsedMs(0);
    setFirstByteMs(null);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedMs(Math.round(performance.now() - t0));
    }, 200);
  };
  const stopElapsed = () => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const streamAndAppend = useCallback(
    async (updatedMessages: Message[]) => {
      setError("");
      setIsStreaming(true);
      startElapsed();

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      let accumulated = "";
      const placeholder: Message = { role: "assistant", content: "" };
      setMessages([...updatedMessages, placeholder]);

      let gotError = false;
      await streamViaProxy(
        updatedMessages,
        (chunk) => {
          accumulated += chunk;
          setMessages([...updatedMessages, { role: "assistant", content: accumulated }]);
        },
        (fbMs) => setFirstByteMs(fbMs),
        (code, msg) => {
          gotError = true;
          setError(friendlyError(code, msg));
        },
        abortRef.current.signal
      );

      // If no content streamed and no error shown, surface a generic hint
      if (!gotError && !accumulated.trim()) {
        setError("The AI didn't return any content. Try again or rephrase.");
      }

      setIsStreaming(false);
      stopElapsed();
    },
    []
  );

  const startSession = useCallback(() => {
    const sysPrompt = buildSystemPrompt(mode, currentCase, subspecialtyFocus || undefined);
    const systemMsg: Message = { role: "system", content: sysPrompt };

    // Pre-computed opening: for examiner mode, show the case IMMEDIATELY
    // (image + presentation) before the AI takes over. This avoids any
    // perceived "nothing is happening" during warm-up.
    const assistantMsgs: Message[] = [];
    let followUpPrompt = AUTO_START_PROMPT[mode];

    if (mode === "examiner") {
      const c = currentCase || pickRandomCaseWithImage(database);
      if (c) {
        setCurrentCase(c);
        assistantMsgs.push({ role: "assistant", content: caseOpeningMessage(c) });
        followUpPrompt =
          "The candidate is now looking at the case. Wait for them to describe the image and their approach. When they speak, probe with progressive disclosure per examiner rules.";
      } else {
        assistantMsgs.push({
          role: "assistant",
          content: "**Welcome to your ABO oral board simulation.** I'll present a novel case. Ready?",
        });
      }
    } else {
      const greet: Record<ExaminerMode, string> = {
        examiner: "",
        viva: "**Viva voce.** Short answers only (≤3 sentences). First question in a second…",
        quiz: "**Rapid-fire quiz.** First question incoming…",
        "ddx-drill": "**DDx drill.** First prompt coming up…",
        soap: "**SOAP-note practice.** First scenario loading…",
        "case-builder": "**Case builder.** Generating a novel case now…",
        "deep-dive": subspecialtyFocus
          ? `**Deep dive: ${subspecialtyFocus}.** Starting with a high-yield topic…`
          : "**Deep-dive lecture mode.** Picking a high-yield topic…",
        pearls: subspecialtyFocus
          ? `**Pearl dump: ${subspecialtyFocus}.** Compiling the top pearls…`
          : "**Pearl dump.** Starting with a high-yield topic…",
        tutor: "**Teaching tutor ready.** What topic would you like me to cover? Say a word and I'll start.",
        "free-chat": "**Hi! I'm your AI study companion.** What's on your mind today?",
      };
      assistantMsgs.push({ role: "assistant", content: greet[mode] });
    }

    const initial = [systemMsg, ...assistantMsgs];
    setMessages(initial);
    setStarted(true);

    // Auto-run the follow-up prompt for modes that should stream content
    // immediately. Tutor/free-chat wait for user input.
    if (mode !== "tutor" && mode !== "free-chat") {
      void streamAndAppend([...initial, { role: "user", content: followUpPrompt }]);
    }
  }, [mode, currentCase, subspecialtyFocus, database, streamAndAppend]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    await streamAndAppend(updated);
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    stopElapsed();
  };

  const regenerateLast = async () => {
    // Strip the last assistant message and re-stream
    const prior = [...messages];
    while (prior.length && prior[prior.length - 1].role !== "user") prior.pop();
    if (prior.length === 0) return;
    await streamAndAppend(prior);
  };

  // ─── MODE SELECTION ──────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors min-h-[44px]"
              aria-label="Return home"
            >
              <svg className="w-5 h-5" aria-hidden fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Home</span>
            </button>
            <h1 className="text-lg font-bold text-white">AI Examiner</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                🤖
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">AI Examiner & Tutor</h2>
              <p className="text-sm text-slate-400">
                Grounded in 27 fatal-flaw safety nets, 46 landmark trials, 25 AAO PPPs.
                Cites briefly; explains WHY+HOW; ends with 2-3 pearls.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
              {MODE_CARDS.map(([key, label, desc, gradient]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`p-3.5 rounded-xl text-left transition-all min-h-[88px] ${
                    mode === key
                      ? `bg-gradient-to-r ${gradient} text-white shadow-lg ring-2 ring-white/20`
                      : "glass-card-light hover:bg-slate-700/40 text-slate-300"
                  }`}
                >
                  <p className="font-semibold text-sm">{label}</p>
                  <p className={`text-xs mt-1 leading-snug ${mode === key ? "text-white/85" : "text-slate-400"}`}>
                    {desc}
                  </p>
                </button>
              ))}
            </div>

            {["deep-dive", "case-builder", "ddx-drill", "pearls", "quiz"].includes(mode) && (
              <div className="mb-5 animate-fade-in">
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                  Subspecialty focus (optional)
                </label>
                <select
                  value={subspecialtyFocus}
                  onChange={(e) => setSubspecialtyFocus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50 min-h-[44px]"
                >
                  <option value="">All subspecialties</option>
                  {database.subspecialties.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {mode === "examiner" && (
              <div className="mb-5">
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                  Case (optional — random if blank; only cases with images)
                </label>
                <select
                  value={currentCase?.id || ""}
                  onChange={(e) => {
                    if (!e.target.value) { setCurrentCase(null); return; }
                    const found = casesWithImages.find((c) => c.id === e.target.value);
                    setCurrentCase(found || null);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50 min-h-[44px]"
                >
                  <option value="">Random case (with image)</option>
                  {database.subspecialties.map((s) => {
                    const list = s.cases.filter((c) => c.questions?.length > 0 && (c.imageFile || c.externalImageUrl));
                    if (!list.length) return null;
                    return (
                      <optgroup key={s.id} label={s.name}>
                        {list.map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.caseNumber} {c.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              onClick={startSession}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-lg transition-all shadow-lg min-h-[52px]"
            >
              Start Session
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Server-side AI — no setup needed. Primary: Gemini 3 Flash (Ollama fallback).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHAT INTERFACE ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors min-h-[44px]"
            aria-label="Exit session"
          >
            <svg className="w-5 h-5" aria-hidden fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Exit</span>
          </button>
          <div className="text-center min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {MODE_CARDS.find(([k]) => k === mode)?.[1] || mode}
            </p>
            {currentCase && <p className="text-xs text-slate-400 truncate">{currentCase.title}</p>}
          </div>
          <button
            onClick={() => {
              abortRef.current?.abort();
              setMessages([]);
              setStarted(false);
              setError("");
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg min-h-[44px]"
            aria-label="Change mode"
          >
            Modes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {(() => {
            const visibleMessages = messages.filter((m) => m.role !== "system");
            return visibleMessages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isPlaceholder = !isUser && !msg.content && isStreaming && i === visibleMessages.length - 1;
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? "bg-primary-600 text-white"
                        : "glass-card-light text-slate-100"
                    }`}
                  >
                    {isPlaceholder ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                        <span>
                          {firstByteMs == null
                            ? `AI is reasoning${elapsedMs >= 1000 ? ` · ${(elapsedMs / 1000).toFixed(1)}s` : "…"}`
                            : `Streaming · ${((elapsedMs - firstByteMs) / 1000).toFixed(1)}s`}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed chat-markdown">
                        {renderMarkdown(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl px-4 py-3 bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm">
                {error}
                <button
                  onClick={regenerateLast}
                  disabled={isStreaming}
                  className="mt-2 text-xs underline hover:text-rose-100 block"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="glass-card border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={isStreaming ? "AI is responding — press Stop to interrupt" : "Answer or ask anything… (Enter to send, Shift+Enter newline)"}
              disabled={isStreaming}
              rows={1}
              className="flex-1 resize-none px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:border-primary-500/50 min-h-[44px] max-h-40"
              aria-label="Your message"
            />
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm min-h-[44px]"
                aria-label="Stop generation"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium text-sm min-h-[44px]"
                aria-label="Send message"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
