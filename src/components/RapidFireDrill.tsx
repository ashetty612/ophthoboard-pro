"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";
import { FATAL_FLAWS } from "@/lib/fatal-flaws";
import { toggleBookmark, getBookmarks } from "@/lib/storage";

interface RapidFireDrillProps {
  database: CasesDatabase;
  onBack: () => void;
}

type DrillMode = "differentials" | "first-step" | "fatal-flaw" | "mixed";
type Phase = "setup" | "drill" | "results";
type Rating = "missed" | "close" | "got-it";

interface DrillItem {
  kind: DrillMode;
  prompt: string;
  answer: string;
  sourceCaseId?: string;
  sourceTitle?: string;
  subspecialty: string;
}

const QUESTION_SECONDS = 30;

// Split multi-line answer into up to 5 bulleted items.
function splitAnswerList(raw: string, max = 5): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n|•|\u2022|;|(?:^|\s)\d+[\.\)]\s+/)
    .map((s) => s.trim().replace(/^[-*·]\s*/, ""))
    .filter((s) => s.length > 2)
    .slice(0, max);
}

// Extract chief complaint from title like "45F - eye pain, photophobia and redness"
function getChiefComplaint(title: string): string {
  const parts = title.split(/\s[-–—]\s/);
  if (parts.length >= 2) return parts.slice(1).join(" - ").trim();
  return title;
}

export default function RapidFireDrill({ database, onBack }: RapidFireDrillProps) {
  // ---- All hooks declared at top (Rules of Hooks) ----
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<DrillMode>("mixed");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    database.subspecialties.map((s) => s.id)
  );
  const [questionCount, setQuestionCount] = useState<number>(20); // 0 means ∞
  const [items, setItems] = useState<DrillItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [revealed, setRevealed] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [userInput, setUserInput] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeUpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load bookmarks on client only (SSR-safe)
  useEffect(() => {
    try {
      setBookmarks(getBookmarks());
    } catch {
      /* ignore */
    }
  }, [phase]);

  // Build pool of drill items from database
  const buildItems = useCallback((): DrillItem[] => {
    const eligibleCases: CaseData[] = database.subspecialties
      .filter((s) => selectedSpecs.includes(s.id))
      .flatMap((s) => s.cases.filter((c) => c.questions.length > 0));

    const diffItems: DrillItem[] = [];
    const firstStepItems: DrillItem[] = [];
    const fatalItems: DrillItem[] = [];

    for (const c of eligibleCases) {
      const cc = getChiefComplaint(c.title);
      // Differentials (Q1)
      const q1 = c.questions.find((q) => q.number === 1);
      if (q1 && q1.answer) {
        const list = splitAnswerList(q1.answer, 5);
        if (list.length >= 2) {
          diffItems.push({
            kind: "differentials",
            prompt: `Name up to 5 differentials for: "${cc}"`,
            answer: list.map((l, i) => `${i + 1}. ${l}`).join("\n"),
            sourceCaseId: c.id,
            sourceTitle: c.title,
            subspecialty: c.subspecialty,
          });
        }
      }
      // First step (Q6 or Q5 fallback)
      const q6 = c.questions.find((q) => q.number === 6) || c.questions.find((q) => q.number === 5);
      if (q6 && q6.answer) {
        const dx = c.diagnosisTitle || cc;
        firstStepItems.push({
          kind: "first-step",
          prompt: `First management step for: ${dx}`,
          answer: q6.answer.trim(),
          sourceCaseId: c.id,
          sourceTitle: c.title,
          subspecialty: c.subspecialty,
        });
      }
    }

    // Fatal-flaw items — filter by subspecialty rough-match
    const specNames = new Set(
      database.subspecialties
        .filter((s) => selectedSpecs.includes(s.id))
        .map((s) => s.name.toLowerCase())
    );
    for (const ff of FATAL_FLAWS) {
      const matchesSpec =
        specNames.size === 0 ||
        [...specNames].some(
          (n) => ff.subspecialty.toLowerCase().includes(n) || n.includes(ff.subspecialty.toLowerCase())
        ) ||
        ff.subspecialty === "General";
      if (!matchesSpec && specNames.size > 0) continue;
      fatalItems.push({
        kind: "fatal-flaw",
        prompt: `Killer diagnosis you must rule out for: ${ff.scenario}`,
        answer: `${ff.mustNotMiss}\n\nSafety-net phrase: ${ff.safetyNetPhrase}`,
        subspecialty: ff.subspecialty,
      });
    }

    let pool: DrillItem[] = [];
    if (mode === "differentials") pool = diffItems;
    else if (mode === "first-step") pool = firstStepItems;
    else if (mode === "fatal-flaw") pool = fatalItems;
    else pool = [...diffItems, ...firstStepItems, ...fatalItems];

    // Shuffle
    pool = pool.slice().sort(() => Math.random() - 0.5);
    if (questionCount > 0) pool = pool.slice(0, questionCount);
    return pool;
  }, [database, selectedSpecs, mode, questionCount]);

  const startDrill = useCallback(() => {
    const built = buildItems();
    if (built.length === 0) return;
    setItems(built);
    setCurrentIdx(0);
    setTimeLeft(QUESTION_SECONDS);
    setRevealed(false);
    setShowTimeUp(false);
    setRatings({});
    setUserInput("");
    setPhase("drill");
  }, [buildItems]);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (advanceRef.current) {
      clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
    if (timeUpRef.current) {
      clearTimeout(timeUpRef.current);
      timeUpRef.current = null;
    }
  }, []);

  // Reveal (manual or time-up)
  const handleReveal = useCallback(() => {
    if (revealed) return;
    setRevealed(true);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [revealed]);

  // Timer effect: countdown when drilling & not revealed
  useEffect(() => {
    if (phase !== "drill" || revealed) return;
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }
          setShowTimeUp(true);
          timeUpRef.current = setTimeout(() => {
            setShowTimeUp(false);
            setRevealed(true);
          }, 700);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [phase, revealed, currentIdx]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Focus input on new question
  useEffect(() => {
    if (phase === "drill" && !revealed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, currentIdx, revealed]);

  const goToQuestion = useCallback(
    (idx: number) => {
      clearTimers();
      setCurrentIdx(idx);
      setTimeLeft(QUESTION_SECONDS);
      setRevealed(false);
      setShowTimeUp(false);
      setUserInput("");
    },
    [clearTimers]
  );

  const advance = useCallback(() => {
    if (currentIdx >= items.length - 1) {
      clearTimers();
      setPhase("results");
    } else {
      goToQuestion(currentIdx + 1);
    }
  }, [currentIdx, items.length, goToQuestion, clearTimers]);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!revealed) return;
      setRatings((prev) => ({ ...prev, [currentIdx]: rating }));
      if (advanceRef.current) clearTimeout(advanceRef.current);
      advanceRef.current = setTimeout(() => {
        advance();
      }, 3000);
    },
    [revealed, currentIdx, advance]
  );

  const handleBookmark = useCallback((caseId: string) => {
    try {
      toggleBookmark(caseId);
      setBookmarks(getBookmarks());
    } catch {
      /* ignore */
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== "drill") return;
    const onKey = (e: KeyboardEvent) => {
      // Don't swallow typing into the input for text-only keys
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) handleReveal();
        else advance();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!revealed) handleReveal();
        else advance();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIdx > 0) goToQuestion(currentIdx - 1);
        return;
      }
      if (!isInput && revealed) {
        if (e.key === "1") {
          e.preventDefault();
          handleRate("missed");
        } else if (e.key === "2") {
          e.preventDefault();
          handleRate("close");
        } else if (e.key === "3") {
          e.preventDefault();
          handleRate("got-it");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, currentIdx, advance, goToQuestion, handleReveal, handleRate]);

  const toggleSpec = (id: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const stats = useMemo(() => {
    const ratingValues = Object.values(ratings);
    const got = ratingValues.filter((r) => r === "got-it").length;
    const close = ratingValues.filter((r) => r === "close").length;
    const missed = ratingValues.filter((r) => r === "missed").length;
    // Streak: consecutive "got-it" (including "close") from the start
    let streak = 0;
    let best = 0;
    for (let i = 0; i < items.length; i++) {
      const r = ratings[i];
      if (r === "got-it") {
        streak++;
        if (streak > best) best = streak;
      } else if (r) {
        streak = 0;
      }
    }
    return { got, close, missed, bestStreak: best };
  }, [ratings, items.length]);

  // ====== SETUP ======
  if (phase === "setup") {
    const modeCards: { id: DrillMode; icon: string; title: string; desc: string }[] = [
      { id: "differentials", icon: "🧠", title: "Differentials Drill", desc: "Name 5 DDx for a chief complaint" },
      { id: "first-step", icon: "💉", title: "First-Step Drill", desc: "First management step for a diagnosis" },
      { id: "fatal-flaw", icon: "⚠️", title: "Fatal-Flaw Drill", desc: "Killer diagnoses you must rule out" },
      { id: "mixed", icon: "🎯", title: "Mixed", desc: "Random mix of all three" },
    ];
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
            <h1 className="text-lg font-bold text-white">Rapid-Fire Drill</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                ⚡
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Rapid-Fire Drill</h2>
              <p className="text-slate-400 text-sm">30 seconds per question. Verbalize out loud before revealing.</p>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Drill Mode</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {modeCards.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      mode === m.id
                        ? "bg-rose-500/15 border-rose-500/40 text-white"
                        : "bg-slate-800/50 border-slate-700/40 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-sm font-semibold">{m.title}</span>
                    </div>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Question Count</label>
              <div className="flex gap-2">
                {[10, 20, 30, 0].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      questionCount === n
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    {n === 0 ? "∞" : n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Subspecialties</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {database.subspecialties.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSpec(s.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                      selectedSpecs.includes(s.id)
                        ? "bg-rose-500/15 text-rose-200 border border-rose-500/30"
                        : "bg-slate-800/50 text-slate-500 border border-slate-700/30"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startDrill}
              disabled={selectedSpecs.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold text-lg transition-all shadow-lg"
            >
              Start Drill
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====== DRILL ======
  if (phase === "drill") {
    const item = items[currentIdx];
    if (!item) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">No items to drill</h2>
            <p className="text-sm text-slate-400 mb-4">
              Try a different mode or select more subspecialties.
            </p>
            <button
              onClick={() => setPhase("setup")}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium"
            >
              Back to Setup
            </button>
          </div>
        </div>
      );
    }

    const ratingValues = Object.values(ratings);
    const got = ratingValues.filter((r) => r === "got-it").length;
    const missed = ratingValues.filter((r) => r === "missed").length;
    const isUrgent = timeLeft <= 10;
    const isCritical = timeLeft <= 5;
    const pct = timeLeft / QUESTION_SECONDS;
    const ringCirc = 2 * Math.PI * 52;
    const ringOffset = ringCirc * (1 - pct);
    const ringColor = isCritical ? "#f43f5e" : isUrgent ? "#f59e0b" : "#22d3ee";

    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm hidden sm:inline">Exit</span>
            </button>
            <div className="text-xs text-slate-400">
              Question <span className="text-white font-semibold">{currentIdx + 1}</span> of{" "}
              <span className="text-white">{items.length}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-emerald-400">{got} right</span>
              <span className="mx-1 text-slate-600">/</span>
              <span className="text-rose-400">{missed} missed</span>
            </div>
            <div className="w-12" />
          </div>
          <div className="h-1 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 progress-bar"
              style={{ width: `${((currentIdx + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>

        {showTimeUp && (
          <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="bg-rose-500/95 text-white text-4xl sm:text-6xl font-black tracking-widest px-8 py-6 rounded-2xl shadow-2xl animate-fade-in">
              ⏱ TIME!
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Timer ring */}
          <div className="flex justify-center mb-6">
            <div className={`relative w-32 h-32 ${isCritical && !revealed ? "animate-pulse" : ""}`}>
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={revealed ? ringCirc : ringOffset}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-4xl font-black font-mono ${
                    isCritical ? "text-rose-400" : isUrgent ? "text-amber-400" : "text-white"
                  }`}
                  role="timer"
                  aria-live="polite"
                >
                  {revealed ? "—" : timeLeft}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">
                  {revealed ? "revealed" : "seconds"}
                </span>
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold ${
                  item.kind === "differentials"
                    ? "bg-violet-500/15 text-violet-300"
                    : item.kind === "first-step"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {item.kind === "differentials"
                  ? "Differentials"
                  : item.kind === "first-step"
                  ? "First Step"
                  : "Fatal Flaw"}
              </span>
              <span className="text-[10px] text-slate-500">{item.subspecialty}</span>
            </div>
            <p
              className="text-xl sm:text-2xl font-semibold text-white leading-snug cursor-pointer"
              onClick={() => !revealed && handleReveal()}
            >
              {item.prompt}
            </p>

            {!revealed && (
              <div className="mt-6">
                <input
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Optional — say it out loud instead"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-600 text-sm focus:border-rose-500 outline-none transition-colors"
                  aria-label="Your answer (optional)"
                />
                <button
                  onClick={handleReveal}
                  className="w-full mt-3 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors shadow-lg"
                >
                  Show Answer  <span className="opacity-60 text-xs ml-2">(Space)</span>
                </button>
              </div>
            )}

            {revealed && (
              <div className="mt-6 animate-fade-in">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Answer
                </p>
                <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4 mb-5">
                  <p className="text-slate-100 text-sm sm:text-base whitespace-pre-line leading-relaxed">
                    {item.answer}
                  </p>
                </div>

                <p className="text-xs text-slate-500 text-center mb-2">
                  How did you do? <span className="text-slate-600">(1/2/3)</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { r: "missed" as Rating, label: "Missed", key: "1", color: "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30" },
                    { r: "close" as Rating, label: "Close", key: "2", color: "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30" },
                    { r: "got-it" as Rating, label: "Got It", key: "3", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30" },
                  ]).map((btn) => (
                    <button
                      key={btn.r}
                      onClick={() => handleRate(btn.r)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${btn.color} ${
                        ratings[currentIdx] === btn.r ? "ring-2 ring-white/40" : ""
                      }`}
                    >
                      {btn.label}
                      <span className="block text-[10px] opacity-60 font-normal mt-0.5">{btn.key}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => currentIdx > 0 && goToQuestion(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="text-xs text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={advance}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {currentIdx >= items.length - 1 ? "Finish" : "Next"} <span className="opacity-60">(→)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest">
            Space / → reveal or advance  ·  ← previous  ·  1 / 2 / 3 rate
          </p>
        </div>
      </div>
    );
  }

  // ====== RESULTS ======
  const answered = Object.keys(ratings).length;
  const gotPct = answered > 0 ? Math.round((stats.got / answered) * 100) : 0;
  const missedItems = items
    .map((item, idx) => ({ item, idx, rating: ratings[idx] }))
    .filter((x) => x.rating === "missed" || x.rating === "close");

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
          <h1 className="text-lg font-bold text-white">Drill Complete</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
        <div className="glass-card rounded-2xl p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
            ⚡
          </div>
          <p className="text-5xl font-black text-white mb-1">{gotPct}%</p>
          <p className="text-sm text-slate-400">got it on first pass</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { label: "Got It", value: stats.got, color: "text-emerald-400" },
            { label: "Close", value: stats.close, color: "text-amber-400" },
            { label: "Missed", value: stats.missed, color: "text-rose-400" },
            { label: "Best Streak", value: stats.bestStreak, color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold stat-number ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {missedItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-white mb-3">
              Review Items <span className="text-slate-500">({missedItems.length})</span>
            </h3>
            <div className="space-y-3">
              {missedItems.map(({ item, idx, rating }) => {
                const isBookmarked = item.sourceCaseId ? bookmarks.includes(item.sourceCaseId) : false;
                return (
                  <div key={idx} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-white flex-1">{item.prompt}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          rating === "missed" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {rating === "missed" ? "Missed" : "Close"}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3 mb-2">
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{item.answer}</p>
                    </div>
                    {item.sourceCaseId && (
                      <button
                        onClick={() => handleBookmark(item.sourceCaseId!)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
                      >
                        {isBookmarked ? "★ Bookmarked" : "☆ Bookmark case"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => setPhase("setup")}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-medium transition-colors"
          >
            Another Drill
          </button>
        </div>
      </div>
    </div>
  );
}
