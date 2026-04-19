"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";

interface AIExaminerProps {
  database: CasesDatabase;
  onBack: () => void;
  initialCase?: CaseData | null;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

type ExaminerMode = "free-chat" | "examiner" | "tutor" | "quiz";

const API_KEY_STORAGE = "ophtho_openrouter_key";
const BUILTIN_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
const USE_SERVER_PROXY = true; // Use server-side API route to protect API key

function getStoredApiKey(): string {
  if (USE_SERVER_PROXY) return "server-proxy";
  if (typeof window === "undefined") return BUILTIN_KEY;
  return localStorage.getItem(API_KEY_STORAGE) || BUILTIN_KEY;
}
function setStoredApiKey(key: string) {
  if (typeof window !== "undefined") localStorage.setItem(API_KEY_STORAGE, key);
}

function buildSystemPrompt(mode: ExaminerMode, database: CasesDatabase, currentCase?: CaseData | null): string {
  const imageUrl = currentCase?.imageFile
    ? `/images/${currentCase.imageFile}`
    : currentCase?.externalImageUrl || null;
  const imageInstruction = imageUrl
    ? `\nCLINICAL IMAGE URL: ${imageUrl}\nIMPORTANT: When presenting this case, provide the clinical image link in markdown format so the candidate can view it: [View Clinical Image](${imageUrl}). Present it at the start of the case before asking for the image description.`
    : '';
  const caseContext = currentCase
    ? `\n\nCURRENT CASE CONTEXT:\nTitle: ${currentCase.diagnosisTitle || currentCase.title}\nPresentation: ${currentCase.presentation}\nPhoto Description: ${currentCase.photoDescription}${imageInstruction}\nQuestions and Model Answers:\n${currentCase.questions.map(q => `Q${q.number}: ${q.question}\nA: ${q.answer}`).join('\n\n')}`
    : '';

  const subspecialtySummary = database.subspecialties.map(s =>
    `${s.name}: ${s.cases.filter(c => c.questions.length > 0).length} cases`
  ).join(', ');

  const base = `You are an expert ophthalmology oral board examiner and educator with deep knowledge of all subspecialties: ${subspecialtySummary}.

EXAM FORMAT (ABO Virtual Oral Examination):
- 42 Patient Management Problems (PMPs) across 3 virtual rooms, 50 minutes each
- 2 examiners per room, each presenting 7 cases (14 per room, ~3.5 min per case)
- 6 equally-weighted topic areas (16.7% each): Anterior Segment, External Eye & Adnexa, Neuro-Ophthalmology & Orbit, Optics/Visual Physiology/Refractive Errors, Pediatric Ophthalmology & Strabismus, Posterior Segment
- Room pairings: Room 1 (Anterior + Optics), Room 2 (External + Pediatrics), Room 3 (Neuro + Posterior)

ABO 3-DOMAIN SCORING RUBRIC (0-3 scale per domain):
1. DATA ACQUISITION: Image description, targeted history, focused exam findings, appropriate workup (not shotgunning)
2. DIAGNOSIS: Prioritized differential (most likely first, then life/sight-threatening rule-outs), correct working diagnosis
3. MANAGEMENT: Stepwise treatment (conservative → medical → surgical unless emergency), complications, follow-up, patient counseling

COMPENSATORY SCORING: Strong performance in one area can offset weakness in another. Pass/fail only — no domain-level feedback given.

THE 8-ELEMENT PMP FRAMEWORK (candidates MUST follow this sequence):
1. DESCRIBE — Concisely describe what you see (laterality, location, morphology, color, size, associated findings) — 2-3 sentences, NO diagnosis yet
2. HISTORY — Ask focused, hypothesis-driven questions (onset, pain, vision change, trauma, systemic disease, meds, family hx) — NOT a full ROS
3. EXAM — State what else you want: VA, pupils (RAPD), IOP, motility, CVF, slit lamp, DFE — tailored to the complaint
4. DIFFERENTIAL — 3-4 entities, ordered by likelihood, ALWAYS include the can't-miss life/eye/sight-threatening diagnosis
5. WORKUP — Targeted labs/imaging (OCT, FA, B-scan, MRI, CBC, ESR/CRP etc), explaining WHY each is ordered
6. DIAGNOSIS — State most likely dx and briefly justify from findings
7. MANAGEMENT — Specific treatment (drug name, dose, procedure), plus what you'd counsel the patient and when to refer/co-manage
8. FOLLOW-UP — Explicit interval and what you'd check — this is the step most candidates forget and it is HEAVILY weighted

CRITICAL SCORING NOTE: Management protocols (elements 7+8) account for roughly 40% of the score — the single largest category. Algorithmic mastery of management + follow-up is higher yield than obscure diagnostic trivia.

CLINICAL ACCURACY REQUIREMENTS:
- Use evidence-based 2024-2026 guidelines (AAO Preferred Practice Patterns)
- Specific drug names, dosages, frequencies (not vague "give antibiotics")
- Reference landmark trials: ONTT, CATT, DRCR.net, PEDIG, EVS, COMS, AREDS2, IIHTT
- Use grading systems: ETDRS severity, SUN criteria, Frisen grading, ROP staging
- Know surgical indications and complications for every procedure you mention

FATAL FLAW DETECTION — these omissions should be flagged as critical failures:
- Missing GCA in elderly patient with AION (must get ESR/CRP, start IV steroids before biopsy)
- Missing retinoblastoma in pediatric leukocoria
- Suggesting intraocular biopsy for suspected retinoblastoma (tumor seeding risk)
- Failing to check globe integrity before manipulating periocular trauma
- Prescribing oral steroids alone for optic neuritis (ONTT showed increased recurrence)
- Not treating the fellow eye in acute angle closure (prophylactic LPI)
- Missing open globe signs (peaked pupil, low IOP, Seidel test)
- Ordering neuroimaging without clinical indication, or NOT ordering it when indicated${caseContext}`;

  switch (mode) {
    case "examiner":
      return `${base}\n\nMODE: ORAL BOARD EXAMINER SIMULATION
You are simulating a real ABO oral board examiner. Your persona is professional, neutral, and terse — like a real examiner who does NOT give feedback during the case.

EXAMINER BEHAVIORAL RULES:
1. PROGRESSIVE DISCLOSURE: Present ONLY an image description and 1-sentence chief complaint. Do NOT provide history, exam findings, or test results unless the candidate explicitly asks for them. If they don't ask, they don't get the data.
2. FRAMEWORK ENFORCEMENT: If the candidate jumps straight to treatment without giving a differential diagnosis, interrupt: "Before we discuss management, what is your differential?"
3. THE CURVEBALL: When the candidate gives a management plan, challenge them with ONE unexpected clinical complication (e.g., "The patient has a severe sulfa allergy," "During surgery, the posterior capsule ruptures," "The pharmacy reports that medication is unavailable").
4. PACING PRESSURE: If the candidate rambles without making clinical decisions, redirect: "In the interest of time, what is your leading diagnosis?" Keep the pace at ~3.5 minutes per case.
5. NEUTRAL AFFECT: Do not say "Good job" or "Correct." Respond like a real examiner: "Okay," "What else?", "Anything else you'd want to check?", or simply move to the next question.
6. STRATEGIC PROBING: Ask "Why?" and "What specific findings?" to test depth. Don't accept vague answers.
7. CASE COMPLETION: After each case, briefly break character to provide scored feedback using the 3-domain rubric (Data Acquisition, Diagnosis, Management) on a 0-3 scale with specific missed elements.

CLINICAL IMAGE PRESENTATION:
- When a case has a clinical image URL, ALWAYS present it as a markdown link at the very start: "[View Clinical Image](url)"
- Say: "Here is the clinical photograph for this case: [View Clinical Image](url). Please describe what you see."
- If no image URL is available, describe the clinical scenario verbally and state "No clinical image available for this case."
- For cases with images, the candidate MUST describe the image before proceeding.

Present cases across all 6 subspecialties. Start with the clinical image (if available) and a brief chief complaint.`;

    case "tutor":
      return `${base}\n\nMODE: TEACHING TUTOR
You are a thorough, encouraging ophthalmology teacher. When the candidate asks about any topic:
1. Explain using the 8-element PMP framework structure
2. Include high-yield clinical pearls and "must-not-miss" diagnoses
3. Flag common board exam pitfalls (the 7 failure modes: no verbal fluency, unstructured delivery, overconfidence, reading examiner faces, over-differentiating, missing emergencies, poor optics prep)
4. Reference landmark trials with specific findings (ONTT, CATT, DRCR.net, EVS, COMS, PEDIG, AREDS2)
5. Use mnemonics when available (TFSOM for choroidal melanoma, CONES for keratoconus)
6. Connect to related topics across subspecialties
7. Teach the "soliloquy approach" — rehearsed, structured verbal scripts for each high-yield condition
8. Provide a "minimum sufficient workup" — penalize shotgunning mentally

Be thorough but organized with clear structure and headers. After explaining, offer to quiz them.`;

    case "quiz":
      return `${base}\n\nMODE: RAPID-FIRE QUIZ
Quiz the candidate with rapid-fire questions across all 6 subspecialties. For each question:
1. Present a brief clinical stem (1-2 sentences with key findings)
2. Ask a focused question targeting one of the 3 ABO domains (Data Acquisition, Diagnosis, or Management)
3. Wait for their answer
4. Score their response on specificity — penalize vague answers ("antibiotics" vs "fortified tobramycin + cefazolin q1h")
5. Flag any fatal flaws (missed GCA, retinoblastoma, open globe, etc.)
6. Give brief, domain-tagged feedback and move on

Mix question types across domains and subspecialties. Include curveball questions (drug allergies, surgical complications, contraindications). Track score by domain and give periodic breakdowns. After every 10 questions, give a summary: "Data Acquisition: X/10, Diagnosis: X/10, Management: X/10."`;

    default:
      return `${base}\n\nMODE: FREE DISCUSSION
You can help with any ophthalmology topic. Answer questions, explain concepts, discuss cases, review differentials, or chat about exam strategy. Share preparation tips including:
- The 8-element PMP framework
- Time management (3.5 min/case target)
- The soliloquy approach for verbal fluency
- Common failure modes and how to avoid them
- Study timeline recommendations (2-6 months, phased approach)
Be helpful, specific, and thorough.`;
  }
}

async function streamViaProxy(
  messages: Message[],
  onChunk: (text: string) => void,
): Promise<boolean> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
  });

  if (!response.ok) return false;

  const reader = response.body?.getReader();
  if (!reader) return false;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
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
        // Skip malformed JSON chunks
      }
    }
  }
  return true;
}

async function tryStreamDirect(
  model: string,
  messages: Message[],
  apiKey: string,
  onChunk: (text: string) => void,
): Promise<boolean> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://ophthalmology-boards.vercel.app",
      "X-Title": "OphthoBoard Pro AI Examiner",
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) return false;

  const reader = response.body?.getReader();
  if (!reader) return false;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
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

async function streamChat(messages: Message[], apiKey: string, onChunk: (text: string) => void, onDone: () => void): Promise<void> {
  try {
    if (USE_SERVER_PROXY) {
      // Use server-side API route (API key hidden from client)
      const ok = await streamViaProxy(messages, onChunk);
      if (!ok) {
        onChunk("\n\n_Error: AI service unavailable. Please try again later._");
      }
    } else if (apiKey && apiKey !== "server-proxy") {
      // Direct call with user-provided key
      const ok = await tryStreamDirect("qwen/qwen3.6-plus:free", messages, apiKey, onChunk);
      if (!ok) {
        onChunk("_Switching to backup model..._\n\n");
        const fallbackOk = await tryStreamDirect("google/gemini-3-flash-preview", messages, apiKey, onChunk);
        if (!fallbackOk) {
          onChunk("\n\n_Error: Both models failed. Please try again later._");
        }
      }
    } else {
      onChunk("AI service is not configured. Please try again later.");
    }
  } catch (error) {
    onChunk(`\n\n_Error: ${error instanceof Error ? error.message : 'Failed to connect to AI. Please try again.'}_`);
  }
  onDone();
}

function renderMarkdownContent(text: string) {
  // Split text into segments: markdown links, bold, italic, and plain text
  const parts: Array<{ type: string; content: string; href?: string }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Find markdown link [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Find bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Find italic _text_
    const italicMatch = remaining.match(/_([^_]+)_/);

    // Find earliest match
    const matches = [
      linkMatch ? { index: remaining.indexOf(linkMatch[0]), match: linkMatch, type: 'link' } : null,
      boldMatch ? { index: remaining.indexOf(boldMatch[0]), match: boldMatch, type: 'bold' } : null,
      italicMatch ? { index: remaining.indexOf(italicMatch[0]), match: italicMatch, type: 'italic' } : null,
    ].filter(Boolean).sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push({ type: 'text', content: remaining });
      break;
    }

    const earliest = matches[0]!;
    if (earliest.index > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, earliest.index) });
    }

    if (earliest.type === 'link') {
      parts.push({ type: 'link', content: earliest.match![1], href: earliest.match![2] });
    } else if (earliest.type === 'bold') {
      parts.push({ type: 'bold', content: earliest.match![1] });
    } else if (earliest.type === 'italic') {
      parts.push({ type: 'italic', content: earliest.match![1] });
    }

    remaining = remaining.slice(earliest.index + earliest.match![0].length);
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'link') {
          return (
            <a key={i} href={part.href} target="_blank" rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 underline font-medium">
              {part.content}
            </a>
          );
        }
        if (part.type === 'bold') {
          return <strong key={i} className="font-semibold text-white">{part.content}</strong>;
        }
        if (part.type === 'italic') {
          return <em key={i} className="text-slate-400 italic">{part.content}</em>;
        }
        return <span key={i}>{part.content}</span>;
      })}
    </>
  );
}

export default function AIExaminer({ database, onBack, initialCase }: AIExaminerProps) {
  const [mode, setMode] = useState<ExaminerMode>("free-chat");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCase, setCurrentCase] = useState<CaseData | null>(initialCase || null);
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const key = getStoredApiKey();
    if (key) setApiKey(key);
    else setShowKeyInput(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started && inputRef.current) inputRef.current.focus();
  }, [started, isStreaming]);

  const startSession = useCallback(() => {
    const systemMsg: Message = {
      role: "system",
      content: buildSystemPrompt(mode, database, currentCase),
    };

    let greeting = "";
    switch (mode) {
      case "examiner": {
        const caseImageUrl = currentCase?.imageFile
          ? `/images/${currentCase.imageFile}`
          : currentCase?.externalImageUrl || null;
        if (currentCase && caseImageUrl) {
          greeting = `Let's begin with a case.\n\n**Clinical Image:** [View Clinical Image](${caseImageUrl})\n\n${currentCase.presentation}\n\nPlease start by describing what you see in the clinical image.`;
        } else if (currentCase) {
          greeting = `Let's begin with a case. ${currentCase.presentation}\n\nPlease describe what you would do first.`;
        } else {
          greeting = "Welcome to your oral board simulation. I'll present you with cases just like the real ABO exam. Ready to begin?";
        }
        break;
      }
      case "tutor":
        greeting = "I'm your ophthalmology tutor. Ask me about any topic - from basic science to complex clinical scenarios. I'll explain thoroughly with clinical pearls and board-relevant tips. What would you like to learn about?";
        break;
      case "quiz":
        greeting = "Let's do a rapid-fire quiz! I'll ask questions across all subspecialties. Answer as concisely as you can. Ready? Here's your first question...";
        break;
      default:
        greeting = "Hi! I'm your AI study companion for ophthalmology oral boards. I can answer questions, explain concepts, discuss cases, or just chat about exam prep. What's on your mind?";
    }

    const assistantMsg: Message = { role: "assistant", content: greeting };
    setMessages([systemMsg, assistantMsg]);
    setStarted(true);

    // For quiz and examiner mode, auto-generate first question
    if (mode === "quiz" && !currentCase) {
      const allMsgs = [systemMsg, assistantMsg, { role: "user" as const, content: "Start the quiz!" }];
      setIsStreaming(true);
      let accumulated = "";
      streamChat(allMsgs, apiKey, (chunk) => {
        accumulated += chunk;
        setMessages([systemMsg, assistantMsg, { role: "assistant", content: accumulated }]);
      }, () => {
        setMessages(prev => [...prev.slice(0, 1), prev[1], { role: "assistant", content: accumulated }]);
        setIsStreaming(false);
      });
    }
  }, [mode, database, currentCase]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let accumulated = "";
    const placeholderMsg: Message = { role: "assistant", content: "" };
    setMessages([...updatedMessages, placeholderMsg]);

    await streamChat(updatedMessages, apiKey, (chunk) => {
      accumulated += chunk;
      setMessages([...updatedMessages, { role: "assistant", content: accumulated }]);
    }, () => {
      setIsStreaming(false);
    });
  };

  // MODE SELECTION
  if (!started) {
    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Home</span>
            </button>
            <h1 className="text-lg font-bold text-white">AI Examiner</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                🤖
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Examiner & Tutor</h2>
              <p className="text-slate-400">Powered by advanced AI with full ophthalmology knowledge</p>
            </div>

            <div className="space-y-3 mb-8">
              {([
                ["examiner", "🎓 Mock Examiner", "Simulates a real ABO oral board examiner. Presents cases and evaluates your responses.", "from-rose-500 to-orange-500"],
                ["tutor", "📚 Teaching Tutor", "Ask about any topic and get thorough explanations with pearls and high-yield facts.", "from-emerald-500 to-teal-500"],
                ["quiz", "⚡ Rapid Quiz", "Rapid-fire questions across all subspecialties with instant feedback.", "from-amber-500 to-yellow-500"],
                ["free-chat", "💬 Free Discussion", "Open conversation about any ophthalmology topic or exam prep question.", "from-primary-500 to-violet-500"],
              ] as const).map(([key, label, desc, gradient]) => (
                <button
                  key={key}
                  onClick={() => setMode(key as ExaminerMode)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    mode === key
                      ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                      : "glass-card-light hover:bg-slate-700/40 text-slate-300"
                  }`}
                >
                  <p className="font-semibold">{label}</p>
                  <p className={`text-sm mt-1 ${mode === key ? "text-white/80" : "text-slate-400"}`}>{desc}</p>
                </button>
              ))}
            </div>

            {/* Optional: Select a case to focus on */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Focus on a specific case (optional)</label>
              <select
                value={currentCase?.id || ""}
                onChange={(e) => {
                  if (!e.target.value) { setCurrentCase(null); return; }
                  const found = database.subspecialties.flatMap(s => s.cases).find(c => c.id === e.target.value);
                  setCurrentCase(found || null);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50"
              >
                <option value="">Any topic / Random cases</option>
                {database.subspecialties.map(s => (
                  <optgroup key={s.id} label={s.name}>
                    {s.cases.filter(c => c.questions.length > 0).map(c => (
                      <option key={c.id} value={c.id}>#{c.caseNumber} {c.title}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* API Key Setup — only shown if no builtin key is configured */}
            {!BUILTIN_KEY && (
              <div className="mb-6">
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  {apiKey ? "API Key configured" : "Set up API Key (required)"}
                  {apiKey && <span className="text-emerald-400 text-xs">Connected</span>}
                </button>
                {showKeyInput && (
                  <div className="mt-3 animate-fade-in">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-2">
                        Enter your <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary-400 underline">OpenRouter API key</a> (free tier available).
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-or-v1-..."
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-600/50 text-white text-sm placeholder-slate-500"
                        />
                        <button
                          onClick={() => { setStoredApiKey(apiKey); setShowKeyInput(false); }}
                          disabled={!apiKey.startsWith("sk-")}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Your key is stored locally in your browser only.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => { if (!BUILTIN_KEY) setStoredApiKey(apiKey); startSession(); }}
              disabled={!apiKey.startsWith("sk-")}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all shadow-lg"
            >
              {apiKey.startsWith("sk-") ? "Start Session" : "Enter API Key to Start"}
            </button>
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
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Exit</span>
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-white">
              {mode === "examiner" ? "🎓 Mock Examiner" : mode === "tutor" ? "📚 Tutor" : mode === "quiz" ? "⚡ Quiz" : "💬 Chat"}
            </p>
            {currentCase && <p className="text-xs text-slate-400">{currentCase.title}</p>}
          </div>
          <button
            onClick={() => { setStarted(false); setMessages([]); }}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.filter(m => m.role !== "system").map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-xs text-primary-400 shrink-0 mr-2 mt-0.5">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-slate-700/80 text-white border border-slate-600/30"
                    : "bg-slate-900/50 text-slate-200 border border-slate-800/50"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed chat-markdown">{renderMarkdownContent(msg.content)}</div>
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-xs text-primary-400 shrink-0 mr-2 mt-0.5">
                AI
              </div>
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass-card border-t border-slate-700/50 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
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
            placeholder={isStreaming ? "Waiting for response..." : "Type your answer or question..."}
            disabled={isStreaming}
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-primary-500 transition-colors disabled:opacity-50"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
