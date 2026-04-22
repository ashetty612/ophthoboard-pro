"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";
import { FATAL_FLAWS } from "@/lib/fatal-flaws";

/**
 * AI Examiner — powered by Kimi K2.6 via Ollama Cloud (server-side proxy).
 * API key lives server-side only (OLLAMA_API_KEY env var).
 * Client never sees it.
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
  | "examiner"       // Full mock oral board with curveballs
  | "tutor"          // Deep teaching on any topic
  | "quiz"           // Rapid-fire questions
  | "free-chat"      // Open discussion
  | "soap"           // SOAP-note practice on a case
  | "deep-dive"      // Subspecialty deep-dive lecture
  | "case-builder"   // AI generates new cases for practice
  | "pearls"         // High-yield pearl dump on a topic
  | "viva"           // Verbal-only viva voce — forces terse answers
  | "ddx-drill";     // "Give me 5 DDx for..." drill

function buildSystemPrompt(
  mode: ExaminerMode,
  database: CasesDatabase,
  currentCase?: CaseData | null,
  subspecialtyFocus?: string
): string {
  const imageUrl = currentCase?.imageFile
    ? `/images/${currentCase.imageFile}`
    : currentCase?.externalImageUrl || null;
  const imageInstruction = imageUrl
    ? `\nCLINICAL IMAGE URL: ${imageUrl}\nIMPORTANT: When presenting this case, provide the clinical image link in markdown format so the candidate can view it: [View Clinical Image](${imageUrl}). Present it at the start of the case before asking for the image description.`
    : "";
  const caseContext = currentCase
    ? `\n\nCURRENT CASE CONTEXT:\nTitle: ${currentCase.diagnosisTitle || currentCase.title}\nPresentation: ${currentCase.presentation}\nPhoto Description: ${currentCase.photoDescription || "(none)"}${imageInstruction}\nQuestions and Model Answers:\n${currentCase.questions
        .map((q) => `Q${q.number}: ${q.question}\nA: ${q.answer}`)
        .join("\n\n")}`
    : "";

  const subspecialtySummary = database.subspecialties
    .map((s) => `${s.name}: ${s.cases.filter((c) => c.questions.length > 0).length} cases`)
    .join(", ");

  // Fatal-flaw grounding: inject the full 25 must-not-miss items so the
  // model never hallucinates around them and always surfaces them when relevant.
  const fatalFlawContext = FATAL_FLAWS
    .slice(0, 25)
    .map(
      (f) =>
        `- [${f.subspecialty}] ${f.scenario} → MUST NOT MISS: ${f.mustNotMiss}. Say: ${f.safetyNetPhrase}`
    )
    .join("\n");

  const base = `You are an expert ophthalmology oral board examiner and educator with deep knowledge of all subspecialties: ${subspecialtySummary}.

EXAM FORMAT (ABO Virtual Oral Examination):
- 42 Patient Management Problems (PMPs) across 3 virtual rooms, 50 minutes each
- 2 examiners per room, each presenting 7 cases (14 per room, ~3.5 min per case)
- 6 equally-weighted topic areas (16.7% each): Anterior Segment, External Eye & Adnexa, Neuro-Ophthalmology & Orbit, Optics/Visual Physiology/Refractive Errors, Pediatric Ophthalmology & Strabismus, Posterior Segment
- Room pairings: Room 1 (Anterior + Optics), Room 2 (External + Pediatrics), Room 3 (Neuro + Posterior)

ABO 3-DOMAIN SCORING (0-3 scale): Data Acquisition, Diagnosis, Management. Compensatory — strength offsets weakness. Pass/fail only.

THE 8-ELEMENT PMP FRAMEWORK (enforce this order):
1. DESCRIBE — laterality, location, morphology, color, size, associated findings (2-3 sentences, NO dx yet)
2. HISTORY — focused, hypothesis-driven (not a full ROS)
3. EXAM — VA, pupils (RAPD), IOP, motility, CVF, slit lamp, DFE — tailored to complaint
4. DIFFERENTIAL — 3-4 entities, ordered by likelihood, ALWAYS include the can't-miss
5. WORKUP — targeted labs/imaging (OCT, FA, B-scan, MRI, ESR/CRP) + WHY
6. DIAGNOSIS — most likely + brief justification
7. MANAGEMENT — specific drugs/doses/procedures + counseling + referral
8. FOLLOW-UP — explicit interval + what to check (most candidates forget this; HEAVILY weighted)

Management (7+8) ≈ 40% of the score. Specificity beats vagueness every time.

FATAL-FLAW REGISTRY — these omissions fail candidates on the real exam:
${fatalFlawContext}

CLINICAL ACCURACY:
- Cite 2024-2026 AAO PPP guidelines. Landmark trials: ONTT, CATT, DRCR.net, EVS, COMS, AREDS2, PEDIG, IIHTT, OHTS, MARINA, ANCHOR, VIEW, BRAVO, CRUISE, SCORE, CVOS, BVOS
- Grading: ETDRS, SUN, Frisen, ROP ICROP, Shaffer/Spaeth angle
- Specific drug names/doses/frequencies — never "give antibiotics"
- Surgical indications AND complications for every procedure mentioned${caseContext}${
    subspecialtyFocus ? `\n\nSUBSPECIALTY FOCUS: ${subspecialtyFocus}` : ""
  }`;

  switch (mode) {
    case "examiner":
      return `${base}

MODE: ORAL BOARD EXAMINER SIMULATION
You are a real ABO oral board examiner. Professional, neutral, terse. Do NOT give feedback during the case.

RULES:
1. PROGRESSIVE DISCLOSURE: Present only an image (if any) and a 1-sentence chief complaint. Do not provide history/exam/tests unless the candidate explicitly asks.
2. FRAMEWORK ENFORCEMENT: If candidate jumps to treatment without a differential, interrupt: "Before management — what's your differential?"
3. CURVEBALL: When the candidate gives a management plan, introduce ONE clinical complication (sulfa allergy, PCR during surgery, pharmacy shortage, positive preg test, etc.).
4. PACING: If rambling, redirect: "In the interest of time, your leading diagnosis?". Target ≤ 3.5 min/case.
5. NEUTRAL AFFECT: No "Good job" / "Correct". Use "Okay," "What else?", "Anything else?", or move on.
6. PROBE DEPTH: Ask "Why?" and "What specific findings?" Don't accept vague answers.
7. CASE END: After the case, break character with 3-domain scored feedback (0-3) + specific missed elements + at least 1 fatal flaw if any applied.

Present cases across all 6 subspecialties.`;

    case "tutor":
      return `${base}

MODE: TEACHING TUTOR
Thorough, encouraging. For any topic:
1. Structure response using the 8-element framework
2. Include high-yield pearls + must-not-miss diagnoses
3. Flag board pitfalls (unstructured delivery, overconfidence, reading examiner faces, shotgunning, missing emergencies, poor optics prep)
4. Cite landmark trials with specific findings
5. Use mnemonics (TFSOM, CONES, PANDAS, etc.) when applicable
6. Connect across subspecialties
7. Teach the "soliloquy approach" — rehearsed verbal scripts
8. Provide a "minimum sufficient workup" — penalize shotgunning

Use clear headers + bullets. End with: "Want me to quiz you on this?"`;

    case "quiz":
      return `${base}

MODE: RAPID-FIRE QUIZ
Ask rapid-fire questions across all 6 subspecialties. For each:
1. Brief clinical stem (1-2 sentences)
2. Focused question targeting ONE of: Data Acquisition / Diagnosis / Management
3. Wait for candidate's answer
4. Score on specificity — penalize "antibiotics" vs "fortified vanco + tobra q1h"
5. Flag fatal-flaw misses
6. Domain-tagged feedback, then next question

Mix domains and subspecialties. Include curveballs (allergies, complications, contraindications). After every 10 Qs, give summary: "Data Acq: X/10, Dx: X/10, Mgmt: X/10, Fatal flaws missed: X."`;

    case "soap":
      return `${base}

MODE: SOAP NOTE PRACTICE
The candidate is practicing structured clinical documentation. Present a case scenario and ask them to write a SOAP note:
- S (Subjective): HPI, ROS, PMH, Meds, Allergies, SH/FH
- O (Objective): VA, IOP, pupils, motility, CVF, SL exam OU, DFE
- A (Assessment): prioritized problem list with differentials
- P (Plan): treatment + patient counseling + follow-up interval

After they respond, critique ruthlessly: what's missing, wordy, disorganized, or vague. Show the "perfect" SOAP they should write. Target: 5-8 sentences total.`;

    case "deep-dive":
      return `${base}

MODE: SUBSPECIALTY DEEP-DIVE
Deliver a structured, board-focused lecture on the candidate's chosen topic. Format:
1. **Epidemiology** (prevalence, demographics, risk factors)
2. **Pathophysiology** (mechanism in 3-5 sentences)
3. **Classic presentation** + photo description
4. **Differential** (3-5 mimics with distinguishing features)
5. **Workup** (tests + WHY, in order)
6. **Diagnosis** (gold standard + confirming tests)
7. **Management** (medical → laser → surgical tiers)
8. **Follow-up** (intervals, what to watch for)
9. **Landmark trials** (1-3 with key findings)
10. **Board pearls** (5-8 high-yield one-liners)
11. **Fatal flaws to avoid**

Aim for dense, bulleted, scannable. End with a one-question pop-quiz on the most-tested fact.`;

    case "case-builder":
      return `${base}

MODE: CUSTOM CASE GENERATOR
Generate a novel, realistic oral-board-style case tailored to the candidate's request. Output strictly:

**CHIEF COMPLAINT**: [1 sentence, age + sex + symptom + duration]
**IMAGE DESCRIPTION**: [what the examiner would show on a slide]
**KEY HISTORY**: [3-5 bullet points of what's available if asked]
**KEY EXAM**: [relevant findings available if asked]
**WHAT THE EXAMINER WILL PROBE**: [3 anticipated questions]
**FATAL FLAWS THIS CASE TESTS**: [1-2 items]
**MODEL 8-ELEMENT RESPONSE**: [a fully-worked soliloquy the candidate should be able to deliver]

End with: "Ready to try this case out loud? Walk through your 8-element response."`;

    case "pearls":
      return `${base}

MODE: HIGH-YIELD PEARL DUMP
The candidate needs a cram-session dump on their requested topic. Output format:

## [Topic] — Board Pearls

1. [Pearl #1 — 1 line, classic association or key fact]
2. [Pearl #2]
...
(aim for 10-15 pearls, board-hitting facts only)

### Fatal flaws to NEVER miss
- [Fatal flaw 1] — say exactly: "[safety-net phrase]"
- [Fatal flaw 2]

### Key trials
- [Trial] — [1-sentence takeaway]

### Mnemonics
- [Mnemonic] — [expansion]

Be dense, scannable, and board-focused. NO fluff.`;

    case "viva":
      return `${base}

MODE: VIVA VOCE
Simulate verbal oral-exam pressure. Ask one focused clinical question. Expect a SHORT response (≤ 3 sentences). If candidate rambles, interrupt with "Stop. Commit to your diagnosis." Give neutral "Hm" or "Go on." Never validate. After 3 questions, give domain scores.

Be terse. Use sentence fragments. Mimic high-pressure exam cadence.`;

    case "ddx-drill":
      return `${base}

MODE: DIFFERENTIAL DIAGNOSIS DRILL
Drill the candidate on differentials. For each prompt:
1. Present a chief complaint: e.g. "Leukocoria in a 2-year-old."
2. Ask: "Give me 5 differentials, ordered most-likely to least. Must-not-miss first if applicable."
3. Score on: correct order, must-not-miss included, clinical reasoning, specificity.
4. Give the "gold-standard" 5 DDx they should have named.
5. Move to next prompt.

Cycle through all subspecialties. After 10 prompts, domain score summary.`;

    default:
      return `${base}

MODE: FREE DISCUSSION
You can help with any ophthalmology topic. Share prep tips: 8-element PMP, 3.5-min pacing, soliloquy approach, failure modes, 2-6 month study timelines. Be helpful, specific, thorough.`;
  }
}

async function streamViaProxy(
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<boolean> {
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
    onChunk(`\n\n_Network error: ${(e as Error).message}. Please retry._`);
    return false;
  }

  if (!response.ok) {
    try {
      const err = await response.json();
      onChunk(`\n\n_AI error: ${err?.error || response.statusText}_`);
    } catch {
      onChunk(`\n\n_AI error: ${response.statusText}_`);
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
      throw e;
    }
    if (chunk.done) break;

    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {
        // Skip malformed
      }
    }
  }
  return true;
}

function renderMarkdownContent(text: string) {
  // Split text into segments: markdown links, bold, italic, headers, and plain text.
  // Keep this simple; production rendering could use `marked` or `react-markdown`.
  const parts: Array<{ type: string; content: string; href?: string }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    const matches: Array<{ type: string; index: number; match: RegExpMatchArray }> = [];
    const linkM = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkM?.index !== undefined) matches.push({ type: "link", index: linkM.index, match: linkM });
    const boldM = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldM?.index !== undefined) matches.push({ type: "bold", index: boldM.index, match: boldM });
    const italicM = remaining.match(/(?:^|[^*])\*([^*]+)\*(?:[^*]|$)/);
    if (italicM?.index !== undefined) matches.push({ type: "italic", index: italicM.index, match: italicM });

    matches.sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push({ type: "text", content: remaining });
      break;
    }
    const earliest = matches[0]!;
    if (earliest.index > 0) parts.push({ type: "text", content: remaining.slice(0, earliest.index) });

    if (earliest.type === "link") {
      parts.push({ type: "link", content: earliest.match![1], href: earliest.match![2] });
    } else if (earliest.type === "bold") {
      parts.push({ type: "bold", content: earliest.match![1] });
    } else if (earliest.type === "italic") {
      parts.push({ type: "italic", content: earliest.match![1] });
    }
    remaining = remaining.slice(earliest.index + earliest.match![0].length);
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "link") {
          return (
            <a
              key={i}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 underline font-medium"
            >
              {part.content}
            </a>
          );
        }
        if (part.type === "bold") {
          return <strong key={i} className="font-semibold text-white">{part.content}</strong>;
        }
        if (part.type === "italic") {
          return <em key={i} className="text-slate-400 italic">{part.content}</em>;
        }
        return <span key={i}>{part.content}</span>;
      })}
    </>
  );
}

const MODE_CARDS: Array<[ExaminerMode, string, string, string]> = [
  ["examiner", "🎓 Mock Examiner", "Full ABO-style simulation. Neutral affect, curveballs, 3-domain scoring.", "from-rose-500 to-orange-500"],
  ["viva", "🎤 Viva Voce", "Verbal-pressure simulation. ≤3 sentence answers enforced.", "from-rose-600 to-pink-600"],
  ["quiz", "⚡ Rapid Quiz", "Rapid-fire questions with instant domain-tagged scoring.", "from-amber-500 to-yellow-500"],
  ["ddx-drill", "🎯 DDx Drill", "'Give me 5 DDx for...' cycling through all subspecialties.", "from-fuchsia-500 to-purple-600"],
  ["soap", "📋 SOAP Practice", "Write a SOAP note; AI critiques ruthlessly and shows the perfect one.", "from-cyan-500 to-blue-600"],
  ["case-builder", "🧪 Case Builder", "AI generates novel boards-style cases tailored to your gap areas.", "from-teal-500 to-emerald-600"],
  ["deep-dive", "📖 Deep Dive", "Structured subspecialty lecture with trials, pearls, fatal flaws.", "from-indigo-500 to-violet-600"],
  ["pearls", "💎 Pearl Dump", "High-yield board pearls for cramming a topic fast.", "from-amber-400 to-orange-400"],
  ["tutor", "📚 Teaching Tutor", "Deep explanations with pearls, trials, mnemonics.", "from-emerald-500 to-teal-500"],
  ["free-chat", "💬 Free Chat", "Open conversation about any ophth/exam-prep topic.", "from-primary-500 to-violet-500"],
];

export default function AIExaminer({ database, onBack, initialCase }: AIExaminerProps) {
  const [mode, setMode] = useState<ExaminerMode>("examiner");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCase, setCurrentCase] = useState<CaseData | null>(initialCase || null);
  const [subspecialtyFocus, setSubspecialtyFocus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started && inputRef.current) inputRef.current.focus();
  }, [started, isStreaming]);

  // Cleanup any active stream on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const startSession = useCallback(() => {
    const systemMsg: Message = {
      role: "system",
      content: buildSystemPrompt(mode, database, currentCase, subspecialtyFocus || undefined),
    };

    let greeting = "";
    switch (mode) {
      case "examiner": {
        const caseImageUrl = currentCase?.imageFile
          ? `/images/${currentCase.imageFile}`
          : currentCase?.externalImageUrl || null;
        if (currentCase && caseImageUrl) {
          greeting = `Let's begin.\n\n**Clinical Image:** [View Clinical Image](${caseImageUrl})\n\n${currentCase.presentation}\n\nPlease describe what you see.`;
        } else if (currentCase) {
          greeting = `Let's begin. ${currentCase.presentation}\n\nWhat's your first step?`;
        } else {
          greeting = "Welcome to your oral board simulation. I'll present cases across all 6 subspecialties just like the real ABO exam. Ready? Here's your first case...";
        }
        break;
      }
      case "viva":
        greeting = "Viva voce. Short answers only. Here's your first question — fire back in ≤ 3 sentences.";
        break;
      case "tutor":
        greeting = "I'm your ophthalmology tutor. Ask me about any topic — basic science, clinical cases, surgical decision-making, or exam strategy. I'll give you the board-level answer plus pearls.";
        break;
      case "quiz":
        greeting = "Rapid-fire quiz mode. Here's question 1...";
        break;
      case "soap":
        greeting = "SOAP-note practice. Here's the scenario — write a complete SOAP note and I'll critique it.";
        break;
      case "deep-dive":
        greeting = subspecialtyFocus
          ? `Deep-dive on ${subspecialtyFocus} — what specific topic do you want covered?`
          : "Deep-dive lecture mode. What topic would you like me to cover?";
        break;
      case "case-builder":
        greeting = "Case builder. Tell me: subspecialty + difficulty (easy/medium/hard) + (optional) a gap you want tested. I'll generate a novel boards-style case.";
        break;
      case "pearls":
        greeting = "Pearl dump mode. Give me a topic and I'll fire back the top 10-15 board pearls, fatal flaws, key trials, and mnemonics.";
        break;
      case "ddx-drill":
        greeting = "DDx drill. Here's prompt 1...";
        break;
      default:
        greeting = "Hi! I'm your AI study companion. Ask anything about ophthalmology or exam prep.";
    }

    const assistantMsg: Message = { role: "assistant", content: greeting };
    setMessages([systemMsg, assistantMsg]);
    setStarted(true);

    // Auto-generate first question for modes that need it
    if (["quiz", "ddx-drill"].includes(mode) || (mode === "examiner" && !currentCase)) {
      const allMsgs = [systemMsg, assistantMsg, { role: "user" as const, content: "Start." }];
      setIsStreaming(true);
      abortRef.current = new AbortController();
      let accumulated = "";
      streamViaProxy(
        allMsgs,
        (chunk) => {
          accumulated += chunk;
          setMessages([systemMsg, assistantMsg, { role: "assistant", content: accumulated }]);
        },
        abortRef.current.signal
      ).finally(() => {
        setIsStreaming(false);
      });
    }
  }, [mode, database, currentCase, subspecialtyFocus]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    setError("");

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let accumulated = "";
    const placeholderMsg: Message = { role: "assistant", content: "" };
    setMessages([...updatedMessages, placeholderMsg]);

    abortRef.current = new AbortController();
    try {
      await streamViaProxy(
        updatedMessages,
        (chunk) => {
          accumulated += chunk;
          setMessages([...updatedMessages, { role: "assistant", content: accumulated }]);
        },
        abortRef.current.signal
      );
    } catch (e) {
      setError((e as Error).message);
    }
    setIsStreaming(false);
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  // MODE SELECTION
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
                Powered by Kimi K2.6 · 256K context · grounded in 25 fatal-flaw safety nets
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

            {/* Optional: subspecialty focus (for deep-dive, case-builder, ddx-drill) */}
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

            {/* Optional: pick a specific case for examiner mode */}
            {mode === "examiner" && (
              <div className="mb-5">
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">
                  Case (optional)
                </label>
                <select
                  value={currentCase?.id || ""}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setCurrentCase(null);
                      return;
                    }
                    const found = database.subspecialties
                      .flatMap((s) => s.cases)
                      .find((c) => c.id === e.target.value);
                    setCurrentCase(found || null);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50 min-h-[44px]"
                >
                  <option value="">Random cases</option>
                  {database.subspecialties.map((s) => (
                    <optgroup key={s.id} label={s.name}>
                      {s.cases
                        .filter((c) => c.questions.length > 0)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.caseNumber} {c.title}
                          </option>
                        ))}
                    </optgroup>
                  ))}
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
              Server-side AI — no API key setup needed. Your prompts and messages stay private.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CHAT INTERFACE
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages
            .filter((m) => m.role !== "system")
            .map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary-600 text-white"
                      : "glass-card-light text-slate-100"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed chat-markdown">
                    {renderMarkdownContent(msg.content || (isStreaming && i === messages.length - 1 ? "…thinking…" : ""))}
                  </div>
                </div>
              </div>
            ))}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl px-4 py-3 bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm">
                {error}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
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
                  sendMessage();
                }
              }}
              placeholder={isStreaming ? "AI is responding..." : "Type your answer... (Enter to send, Shift+Enter for newline)"}
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
