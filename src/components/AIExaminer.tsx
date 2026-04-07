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

const OPENROUTER_KEY = "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";
const MODEL = "qwen/qwen3-235b-a22b:free";

function buildSystemPrompt(mode: ExaminerMode, database: CasesDatabase, currentCase?: CaseData | null): string {
  const caseContext = currentCase
    ? `\n\nCURRENT CASE CONTEXT:\nTitle: ${currentCase.diagnosisTitle || currentCase.title}\nPresentation: ${currentCase.presentation}\nPhoto Description: ${currentCase.photoDescription}\nQuestions and Model Answers:\n${currentCase.questions.map(q => `Q${q.number}: ${q.question}\nA: ${q.answer}`).join('\n\n')}`
    : '';

  const subspecialtySummary = database.subspecialties.map(s =>
    `${s.name}: ${s.cases.filter(c => c.questions.length > 0).length} cases`
  ).join(', ');

  const base = `You are an expert ophthalmology oral board examiner and educator. You have deep knowledge of all ophthalmology subspecialties: ${subspecialtySummary}.

You are helping a physician prepare for the American Board of Ophthalmology (ABO) oral board examination. The ABO oral exam consists of 42 cases across 3 appointments of 50 minutes each, covering 6 equally-weighted subject areas (16.7% each): Posterior Segment, External Eye & Adnexa, Anterior Segment, Optics/Visual Physiology/Refractive Errors, Pediatric Ophthalmology & Strabismus, and Neuro-Ophthalmology & Orbit.

The exam evaluates: Data Acquisition (history, exam, testing), Diagnosis, and Management. Scoring is compensatory (strength in one area offsets weakness). Results are pass/fail.

IMPORTANT GUIDELINES:
- Be clinically accurate and evidence-based (2024-2026 guidelines)
- Use specific drug names, dosages, and frequencies when discussing treatment
- Reference landmark trials when relevant (ONTT, CATT, DRCR.net, PEDIG, etc.)
- Mention specific grading systems (ETDRS, SUN criteria, etc.)
- Always think about what examiners are looking for
- Be encouraging but honest about knowledge gaps${caseContext}`;

  switch (mode) {
    case "examiner":
      return `${base}\n\nMODE: ORAL BOARD EXAMINER\nYou are simulating a real ABO oral board examiner. Present cases one at a time following the standard format:\n1. Give a clinical vignette (age, gender, chief complaint)\n2. Describe or reference a clinical image\n3. Ask the candidate to work through the case step by step\n4. After each response, provide brief feedback and move to the next question\n5. Follow the standard ABO sequence: differential diagnosis → history → exam → testing → treatment → prognosis\n6. At the end, give an overall assessment\n\nBe professional but not harsh. Guide the candidate if they get stuck. Time pressure is real - keep things moving.`;

    case "tutor":
      return `${base}\n\nMODE: TEACHING TUTOR\nYou are a friendly ophthalmology teacher. When the candidate asks about any topic:\n1. Explain the concept clearly and thoroughly\n2. Include clinical pearls and high-yield facts\n3. Mention common board exam pitfalls\n4. Connect to related topics\n5. Use mnemonics when helpful\n6. Reference relevant landmark studies\n7. Explain the "why" behind clinical decisions\n\nBe thorough but organized. Use bullet points and clear structure. After explaining, offer to quiz them on the topic.`;

    case "quiz":
      return `${base}\n\nMODE: RAPID-FIRE QUIZ\nQuiz the candidate with rapid-fire questions across all subspecialties. For each question:\n1. Ask a focused clinical question\n2. Wait for their answer\n3. Give immediate feedback (correct/incorrect + brief explanation)\n4. Move to the next question\n\nMix question types: diagnosis from description, treatment choices, management steps, anatomy, physiology, optics calculations, drug mechanisms, surgical indications. Keep questions concise. Track their score mentally and give periodic updates.`;

    default:
      return `${base}\n\nMODE: FREE DISCUSSION\nYou can help with any ophthalmology topic. Answer questions, explain concepts, discuss cases, review differentials, or just chat about exam preparation. Be helpful and thorough.`;
  }
}

async function streamChat(messages: Message[], onChunk: (text: string) => void, onDone: () => void): Promise<void> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://ophthoboard.vercel.app",
        "X-Title": "OphthoBoard Pro AI Examiner",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

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
  } catch (error) {
    onChunk(`\n\n_Error: ${error instanceof Error ? error.message : 'Failed to connect to AI. Please try again.'}_`);
  }
  onDone();
}

export default function AIExaminer({ database, onBack, initialCase }: AIExaminerProps) {
  const [mode, setMode] = useState<ExaminerMode>("free-chat");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCase, setCurrentCase] = useState<CaseData | null>(initialCase || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      case "examiner":
        greeting = currentCase
          ? `Let's begin with a case. ${currentCase.presentation}\n\nPlease describe what you would do first.`
          : "Welcome to your oral board simulation. I'll present you with cases just like the real ABO exam. Ready to begin?";
        break;
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
      streamChat(allMsgs, (chunk) => {
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

    await streamChat(updatedMessages, (chunk) => {
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

            <button
              onClick={startSession}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-lg transition-all shadow-lg"
            >
              Start Session
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
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.filter(m => m.role !== "system").map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white"
                    : "glass-card-light text-slate-200"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="glass-card-light rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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
