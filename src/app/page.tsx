"use client";

import { useState, useEffect, useCallback } from "react";
import { CasesDatabase, CaseData, Subspecialty } from "@/lib/types";
import { getProgress, getBookmarks, getStudyStreak } from "@/lib/storage";
import CaseViewer from "@/components/CaseViewer";
import Dashboard from "@/components/Dashboard";
import SubspecialtyBrowser from "@/components/SubspecialtyBrowser";
import ReviewMode from "@/components/ReviewMode";
import ExamMode from "@/components/ExamMode";
import PairedTopicExam from "@/components/PairedTopicExam";
import FlashcardMode from "@/components/FlashcardMode";
import AIExaminer from "@/components/AIExaminer";
import PPPBrowser from "@/components/PPPBrowser";
import AuthButton from "@/components/AuthButton";
import Hero from "@/components/Hero";
import AuroraBackground from "@/components/AuroraBackground";
import CVBLogo from "@/components/CVBLogo";
import LensleyAvatar from "@/components/brand/LensleyAvatar";
import EyesaacAvatar from "@/components/brand/EyesaacAvatar";
import CVELogo from "@/components/brand/CVELogo";
import CramSheet from "@/components/CramSheet";
import DueTodayView from "@/components/DueTodayView";
import RapidFireDrill from "@/components/RapidFireDrill";
import WeaknessQuizView from "@/components/WeaknessQuizView";
import KeyboardShortcutsOverlay from "@/components/KeyboardShortcutsOverlay";
import DataManagement from "@/components/DataManagement";
import UserFlashcards from "@/components/UserFlashcards";
import QBankView from "@/components/QBankView";
import OnboardingTour from "@/components/OnboardingTour";
import EmphHeading from "@/components/EmphHeading";
import { getDueCards, getOverdueCount } from "@/lib/srs";
import { analyzeWeaknesses } from "@/lib/weakness-quiz";
import { getAttempts } from "@/lib/storage";
import { useGlobalKeyboard, type GlobalView } from "@/lib/use-global-keyboard";
import HeatmapView from "@/components/HeatmapView";
import StudyModeCard, { type StudyModeSize } from "@/components/StudyModeCard";
import FeatureMarquee from "@/components/FeatureMarquee";
import { motion } from "framer-motion";
import { staggerFast } from "@/lib/motion";
import { computeHeatmap, axisLabel, type HeatmapCell } from "@/lib/heatmap";

type View = "home" | "subspecialty" | "case" | "dashboard" | "review" | "exam" | "paired-exam" | "flashcards" | "ai-examiner" | "ppp" | "cram" | "due-today" | "rapid-fire" | "weakness-quiz" | "heatmap" | "settings" | "user-flashcards" | "qbank";

// Custom SVG eye logo
function EyeLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="irisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M20 8C12 8 5.5 14 3 20c2.5 6 9 12 17 12s14.5-6 17-12c-2.5-6-9-12-17-12z" stroke="url(#eyeGrad)" strokeWidth="2" fill="none" />
      <circle cx="20" cy="20" r="7" fill="url(#irisGrad)" opacity="0.9" />
      <circle cx="20" cy="20" r="3" fill="#020a13" />
      <circle cx="17.5" cy="17.5" r="1.5" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

import type { StudyProgress } from "@/lib/types";

function getDefaultProgressFn(): StudyProgress {
  return { totalCasesAttempted: 0, totalCasesAvailable: 350, averageScore: 0, bestScore: 0, worstScore: 0, bySubspecialty: {}, recentAttempts: [], weakAreas: [], strongAreas: [] };
}

export default function Home() {
  // All hooks MUST be declared at the top, before any conditional returns (React Rules of Hooks).
  // Moving any hook below an `if (...) return ...` causes React error #310.
  const [database, setDatabase] = useState<CasesDatabase | null>(null);
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedSubspecialty, setSelectedSubspecialty] = useState<Subspecialty | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cameFromHome, setCameFromHome] = useState(false);
  const [progress, setProgressState] = useState<StudyProgress>(getDefaultProgressFn);
  const [bookmarks, setBookmarksState] = useState<string[]>([]);
  const [streak, setStreakState] = useState({ current: 0, lastDate: "" });
  const [dueCount, setDueCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [weaknessQuizQueue, setWeaknessQuizQueue] = useState<CaseData[]>([]);
  const [weaknessQuizIndex, setWeaknessQuizIndex] = useState(0);
  const [weakestHint, setWeakestHint] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  // Exam-week mode: hides low-yield modes, shows countdown. Persisted in localStorage.
  const [examWeekMode, setExamWeekMode] = useState(false);
  const [examDate, setExamDate] = useState<string>(""); // YYYY-MM-DD
  const [lastCaseId, setLastCaseId] = useState<string | null>(null);

  useGlobalKeyboard({
    onShowHelp: () => setShowHelp(true),
    onNavigate: (view: GlobalView) => {
      setCurrentView(view as View);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/data/cases_database.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CasesDatabase) => {
        if (cancelled) return;
        // Defensive validation: shape must match expected schema
        if (!data || !Array.isArray(data.subspecialties)) {
          throw new Error("Invalid case database shape");
        }
        setDatabase(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load cases:", err);
        setLoadError(err?.message || "Failed to load cases");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Read localStorage-backed state only on the client (avoids hydration mismatch).
  useEffect(() => {
    try {
      setProgressState(getProgress());
      setBookmarksState(getBookmarks());
      setStreakState(getStudyStreak());
      setDueCount(getDueCards().length);
      setOverdueCount(getOverdueCount());
      const prog = getProgress();
      const attempts = getAttempts();
      const report = analyzeWeaknesses(prog, attempts);
      setWeakestHint(report.weakestSubspecialty);
      // Last-studied case from most recent attempt
      if (attempts.length > 0) {
        const sorted = [...attempts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setLastCaseId(sorted[0].caseId);
      }
      // Restore exam-week mode & date from localStorage
      if (typeof window !== "undefined") {
        setExamWeekMode(localStorage.getItem("ophthoboard.examWeekMode") === "1");
        setExamDate(localStorage.getItem("ophthoboard.examDate") || "");
      }
    } catch (err) {
      console.error("Failed to load local progress:", err);
    }
  }, [currentView]);

  // Persist exam-week settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("ophthoboard.examWeekMode", examWeekMode ? "1" : "0");
      if (examDate) localStorage.setItem("ophthoboard.examDate", examDate);
    } catch { /* ignore quota errors */ }
  }, [examWeekMode, examDate]);

  // Days until exam (null if no date set)
  const daysUntilExam: number | null = (() => {
    if (!examDate) return null;
    const target = new Date(examDate + "T00:00:00");
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Silence unused-var warning while keeping bookmarks state available for future features
  void bookmarks;

  const handleSelectSubspecialty = (spec: Subspecialty) => {
    setSelectedSubspecialty(spec);
    setCurrentView("subspecialty");
    setCameFromHome(false);
    scrollToTop();
  };

  const handleSelectCase = (caseData: CaseData) => {
    setSelectedCase(caseData);
    if (currentView === "home") setCameFromHome(true);
    setCurrentView("case");
    scrollToTop();
  };

  const handleBack = () => {
    if (currentView === "case") {
      // If a weakness quiz is in progress, advance the queue and return to the
      // quiz view (which shows "Case N of M" and a Start Next button).
      if (weaknessQuizQueue.length > 0) {
        setWeaknessQuizIndex((i) => i + 1);
        setCurrentView("weakness-quiz");
        setSelectedCase(null);
      } else if (cameFromHome || !selectedSubspecialty) {
        setCurrentView("home");
        setSelectedCase(null);
        setCameFromHome(false);
      } else {
        setCurrentView("subspecialty");
        setSelectedCase(null);
      }
    } else {
      setCurrentView("home");
      setSelectedSubspecialty(null);
    }
    scrollToTop();
  };

  const resetWeaknessQuiz = useCallback(() => {
    setWeaknessQuizQueue([]);
    setWeaknessQuizIndex(0);
  }, []);

  const filteredCases = database
    ? database.subspecialties.flatMap((s) =>
        s.cases.filter(
          (c) =>
            c.questions.length > 0 &&
            (c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.presentation.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.subspecialty.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-float mb-4">
            <EyeLogo size={56} />
          </div>
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full w-1/2 bg-primary-500 rounded-full animate-pulse" />
          </div>
          <p className="text-slate-500 text-sm mt-4 tracking-wide">Loading cases...</p>
        </div>
      </div>
    );
  }

  if (!database) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to load cases</h2>
          <p className="text-sm text-slate-400 mb-4">
            {loadError || "The case database could not be loaded. Check your connection and try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (currentView === "case" && selectedCase) {
    return <CaseViewer caseData={selectedCase} onBack={handleBack} />;
  }

  if (currentView === "subspecialty" && selectedSubspecialty) {
    return (
      <SubspecialtyBrowser
        subspecialty={selectedSubspecialty}
        onSelectCase={handleSelectCase}
        onBack={handleBack}
      />
    );
  }

  if (currentView === "dashboard") {
    return (
      <Dashboard
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "review") {
    return (
      <ReviewMode
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "exam") {
    return (
      <ExamMode
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "paired-exam") {
    return (
      <PairedTopicExam
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "flashcards") {
    return (
      <FlashcardMode
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onPractice={handleSelectCase}
      />
    );
  }

  if (currentView === "ai-examiner") {
    return (
      <AIExaminer
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "ppp") {
    return (
      <PPPBrowser
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "cram") {
    return (
      <CramSheet
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "due-today") {
    return (
      <DueTodayView
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onStudyCase={handleSelectCase}
      />
    );
  }

  if (currentView === "rapid-fire") {
    return (
      <RapidFireDrill
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "settings") {
    return (
      <DataManagement
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "user-flashcards") {
    return (
      <UserFlashcards
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "qbank") {
    return (
      <QBankView
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "weakness-quiz") {
    return (
      <WeaknessQuizView
        database={database}
        onBack={() => {
          resetWeaknessQuiz();
          setCurrentView("home");
          scrollToTop();
        }}
        onStartCase={handleSelectCase}
        quizQueue={weaknessQuizQueue}
        quizIndex={weaknessQuizIndex}
        setQuizQueue={(q) => {
          setWeaknessQuizQueue(q);
          setWeaknessQuizIndex(0);
        }}
        resetQuiz={resetWeaknessQuiz}
      />
    );
  }

  if (currentView === "heatmap") {
    return (
      <HeatmapView
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onStartCase={handleSelectCase}
      />
    );
  }

  // Home View
  const totalActiveCases = database.subspecialties.reduce(
    (sum, s) => sum + s.cases.filter((c) => c.questions.length > 0).length,
    0
  );

  const subspecialtyMeta: { [key: string]: { icon: string; color: string; accent: string } } = {
    "anterior-segment": { icon: "🔬", color: "from-cyan-500 to-blue-600", accent: "border-l-cyan-500" },
    "posterior-segment": { icon: "👁️", color: "from-violet-500 to-purple-600", accent: "border-l-violet-500" },
    "neuro-ophthalmology-and-orbit": { icon: "🧠", color: "from-amber-500 to-orange-600", accent: "border-l-amber-500" },
    "pediatric-ophthalmology": { icon: "👶", color: "from-emerald-500 to-teal-600", accent: "border-l-emerald-500" },
    optics: { icon: "🔍", color: "from-rose-500 to-pink-600", accent: "border-l-rose-500" },
  };

  const completionPct = totalActiveCases > 0 ? Math.round((progress.totalCasesAttempted / totalActiveCases) * 100) : 0;

  // Find the last-studied case object (if still present in database)
  const lastCase = lastCaseId
    ? database.subspecialties.flatMap((s) => s.cases).find((c) => c.id === lastCaseId) || null
    : null;

  // Actionable recommended case from weakest subspecialty
  const weakestCase = (() => {
    if (!weakestHint) return null;
    const spec = database.subspecialties.find((s) => s.name === weakestHint);
    if (!spec) return null;
    const eligible = spec.cases.filter((c) => c.questions.length > 0);
    return eligible[Math.floor(Math.random() * eligible.length)] || null;
  })();

  // Heatmap teaser: surface the single weakest (subspecialty × axis) cell so the
  // user can click straight into a targeted drill from home.
  const heatmapWeakestCell: HeatmapCell | null = (() => {
    if (typeof window === "undefined") return null;
    try {
      return computeHeatmap().weakestCell;
    } catch {
      return null;
    }
  })();

  const isFirstTime = progress.totalCasesAttempted === 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/80 glass-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* Brand — wordmark hidden on xs so the nav has room to fit
              all 5 items + the auth chip without horizontal scroll. */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <CVBLogo size={36} />
            <div className="min-w-0 hidden xs:block">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                Clear Vision <span className="font-[family-name:var(--font-fraunces)] italic text-primary-300">Boards</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] hidden sm:block mt-0.5">
                by Clear Vision Education
              </p>
            </div>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1 min-w-0">
            {[
              { label: "Review", short: "Rev", view: "review" as View, style: "text-slate-300 hover:text-white" },
              { label: "Exam", short: "Exam", view: "exam" as View, style: "text-amber-400/90 hover:text-amber-300" },
              { label: "AI Tutor", short: "AI", view: "ai-examiner" as View, style: "text-primary-400/90 hover:text-primary-300" },
              { label: "Progress", short: "•", view: "dashboard" as View, style: "text-white bg-slate-800 hover:bg-slate-700" },
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-lg text-[12px] sm:text-sm font-medium transition-colors whitespace-nowrap ${item.style}`}
                aria-label={item.label}
                title={item.label}
              >
                {/* Short label on xs, full label on sm+ */}
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
            <AuthButton />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Exam-Week Mode Banner */}
        {examWeekMode && (
          <div className="mb-6 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 to-amber-500/10 p-4 animate-fade-in-up" role="status">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>🔥</span>
                <div>
                  <p className="text-sm font-bold text-rose-200 uppercase tracking-wider">Exam-Week Mode Active</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {daysUntilExam === null
                      ? "Set your exam date below to show a countdown."
                      : daysUntilExam > 0
                      ? `${daysUntilExam} day${daysUntilExam === 1 ? "" : "s"} until exam — focused on high-yield modes only.`
                      : daysUntilExam === 0
                      ? "Exam is TODAY. Deep breath — you've prepared. Go crush it."
                      : "Exam date has passed — turn off Exam-Week Mode in Settings when ready."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  aria-label="Exam date"
                  className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200"
                />
                <button
                  onClick={() => setExamWeekMode(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* First-Time User Getting-Started Card */}
        {isFirstTime && !examWeekMode && (
          <div className="mb-8 rounded-2xl border border-primary-500/30 bg-gradient-to-br from-primary-500/10 to-violet-500/10 p-6 animate-fade-in-up">
            <p className="text-[11px] text-primary-300 uppercase tracking-[0.2em] font-semibold mb-2">New here? Start in 30 seconds</p>
            <h2 className="text-lg font-bold text-white mb-3">Pick a workflow below to see how this works.</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const all = database.subspecialties.flatMap((s) => s.cases.filter((c) => c.questions.length > 0));
                  if (all.length === 0) return;
                  handleSelectCase(all[Math.floor(Math.random() * all.length)]);
                }}
                className="text-left rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-primary-500/50 transition-colors"
              >
                <p className="text-sm font-semibold text-white mb-0.5">1. Try a random case</p>
                <p className="text-xs text-slate-400">6 questions, ABO-style scoring, ~5 min</p>
              </button>
              <button
                onClick={() => setCurrentView("ai-examiner")}
                className="text-left rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-primary-500/50 transition-colors"
              >
                <p className="text-sm font-semibold text-white mb-0.5">2. Meet the AI Examiner</p>
                <p className="text-xs text-slate-400">Simulates real oral-exam pressure</p>
              </button>
              <button
                onClick={() => setCurrentView("cram")}
                className="text-left rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-primary-500/50 transition-colors"
              >
                <p className="text-sm font-semibold text-white mb-0.5">3. Skim the Cram Sheet</p>
                <p className="text-xs text-slate-400">High-yield facts across all subspecialties</p>
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="text-left rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-primary-500/50 transition-colors"
              >
                <p className="text-sm font-semibold text-white mb-0.5">4. See keyboard shortcuts</p>
                <p className="text-xs text-slate-400">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px]">?</kbd> anytime</p>
              </button>
            </div>
          </div>
        )}

        {/* Quick-Study Shortcut Bar (returning users) */}
        {!isFirstTime && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in-up">
            <button
              onClick={() => lastCase && handleSelectCase(lastCase)}
              disabled={!lastCase}
              className="rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-primary-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
              aria-label="Continue last case"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Continue</p>
              <p className="text-xs text-white font-medium truncate mt-0.5">{lastCase ? lastCase.title : "No recent case"}</p>
            </button>
            <button
              onClick={() => setCurrentView("due-today")}
              className={`rounded-xl p-3 border transition-colors text-left ${dueCount > 0 ? "bg-primary-500/10 border-primary-500/40 hover:border-primary-400" : "bg-slate-900/60 border-slate-700/50"}`}
              aria-label="Study cards due today"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Due today</p>
              <p className="text-xs text-white font-medium mt-0.5">
                {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? "" : "s"}${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}` : "All caught up"}
              </p>
            </button>
            <button
              onClick={() => weakestCase && handleSelectCase(weakestCase)}
              disabled={!weakestCase}
              className="rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-rose-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
              aria-label="Study a case from your weakest area"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Weakest</p>
              <p className="text-xs text-white font-medium truncate mt-0.5">{weakestHint || "Keep going to surface"}</p>
            </button>
            <button
              onClick={() => setCurrentView("rapid-fire")}
              className="rounded-xl p-3 bg-slate-900/60 border border-slate-700/50 hover:border-amber-500/50 transition-colors text-left"
              aria-label="Start rapid-fire drill"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rapid-fire</p>
              <p className="text-xs text-white font-medium mt-0.5">30s per question</p>
            </button>
          </div>
        )}

        {/* Hero — Clear Vision Boards */}
        <Hero
          stats={{
            cases: totalActiveCases,
            images: 404,
            modes: 19,
            trials: 46,
          }}
          daysUntilExam={daysUntilExam}
          onStartRandom={() => {
            const all = database.subspecialties.flatMap((s) =>
              s.cases.filter((c) => c.questions.length > 0)
            );
            if (all.length === 0) return;
            handleSelectCase(all[Math.floor(Math.random() * all.length)]);
          }}
          onOpenAI={() => setCurrentView("ai-examiner")}
        />

        {/* Infinite feature marquee — pauses on hover */}
        {!searchQuery && <FeatureMarquee />}

        {/* User progress row — kept but visually subordinate to the hero */}
        {progress.totalCasesAttempted > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Completed", value: progress.totalCasesAttempted, suffix: `/${totalActiveCases}`, color: "text-primary-400" },
              { label: "Average", value: `${progress.averageScore}`, suffix: "%", color: progress.averageScore >= 70 ? "text-emerald-400" : "text-amber-400" },
              { label: "Best Score", value: `${progress.bestScore}`, suffix: "%", color: "text-emerald-400" },
              { label: "Streak", value: streak.current, suffix: streak.current === 1 ? " day" : " days", color: "text-violet-400" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <p className={`stat-number text-2xl font-bold ${stat.color}`}>
                  {stat.value}<span className="text-sm text-slate-400">{stat.suffix}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Overall Progress Bar */}
        {progress.totalCasesAttempted > 0 && (
          <div className="mb-10 glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Overall Progress</span>
              <span className="text-xs font-medium text-primary-400">{completionPct}% complete</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 progress-bar"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Actionable Insight Card */}
        {!isFirstTime && weakestHint && weakestCase && !searchQuery && (
          <div className="mb-10 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-rose-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5" aria-hidden>🎯</span>
              <div>
                <p className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold">Today&apos;s Focus</p>
                <p className="text-sm text-white font-medium mt-0.5">
                  You&apos;re weakest in <span className="text-amber-300">{weakestHint}</span> — spend 20–30 min here today.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelectCase(weakestCase)}
              className="btn-pill btn-pill-primary text-sm shrink-0"
            >
              Start a {weakestHint} case →
            </button>
          </div>
        )}

        {/* Heatmap Teaser */}
        {!isFirstTime && heatmapWeakestCell && !searchQuery && (
          <button
            onClick={() => setCurrentView("heatmap")}
            className="mb-10 w-full rounded-xl border border-[color:var(--color-primary-500)]/30 bg-gradient-to-r from-[color:var(--color-primary-500)]/10 to-[color:var(--color-steel-500)]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left hover-lift animate-fade-in-up"
            aria-label="Open Performance Heatmap"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5" aria-hidden>📊</span>
              <div>
                <p className="text-[11px] text-primary-300 uppercase tracking-wider font-semibold">Performance Heatmap</p>
                <p className="text-sm text-white font-medium mt-0.5">
                  Your weakest axis: <span className="text-primary-300">{axisLabel(heatmapWeakestCell.axis).toUpperCase()}</span> in {heatmapWeakestCell.subspecialty} — <span className="text-rose-300">{heatmapWeakestCell.averagePercent}%</span>
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs text-primary-300 uppercase tracking-wider font-semibold">Open heatmap →</span>
          </button>
        )}

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Search cases by topic, diagnosis, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 pl-11 rounded-xl bg-slate-900/80 border border-slate-700/50 text-white placeholder-slate-500 text-sm transition-all"
            />
            <svg className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-10 animate-fade-in">
            <h2 className="text-sm font-semibold text-white mb-4">
              <span className="text-slate-500">{filteredCases.length} results for</span> &quot;{searchQuery}&quot;
            </h2>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {filteredCases.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className="glass-card-light rounded-lg p-3.5 text-left hover:bg-slate-700/40 transition-colors flex items-center gap-4"
                >
                  {c.imageFile && (
                    <img src={`/images/${c.imageFile}`} alt="" aria-hidden="true" className="w-14 h-10 object-cover rounded-md opacity-80" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.title}</p>
                    <p className="text-xs text-slate-400 truncate">{c.subspecialty}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 shrink-0">
                    {c.questions.length} Qs
                  </span>
                </button>
              ))}
              {filteredCases.length === 0 && (
                <p className="text-slate-500 text-center py-8 text-sm">No cases found.</p>
              )}
            </div>
          </div>
        )}

        {/* Subspecialty Cards */}
        {!searchQuery && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs text-slate-400 uppercase tracking-[0.2em] font-medium">Subspecialties</h2>
              <span className="text-xs text-slate-400">{totalActiveCases} total cases</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14" data-tour="subspecialties">
              {database.subspecialties.map((spec, i) => {
                const activeCases = spec.cases.filter((c) => c.questions.length > 0).length;
                const meta = subspecialtyMeta[spec.id] || { icon: "📚", color: "from-slate-500 to-slate-700", accent: "border-l-slate-500" };
                const specProgress = progress.bySubspecialty[spec.name];
                const pct = specProgress ? Math.round((specProgress.attempted / activeCases) * 100) : 0;
                return (
                  <button
                    key={spec.id}
                    onClick={() => handleSelectSubspecialty(spec)}
                    className={`accent-card ${meta.accent} rounded-xl p-5 text-left hover-lift transition-all group animate-fade-in-up`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl shadow-lg`}>
                        {meta.icon}
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full font-medium">
                        {activeCases} cases
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Clinical cases with ABO-style questions and scoring
                    </p>

                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.color} progress-bar`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] text-slate-400">
                        {specProgress ? specProgress.attempted : 0}/{activeCases}
                      </span>
                      {specProgress && specProgress.averageScore > 0 && (
                        <span className={`text-[11px] font-medium ${specProgress.averageScore >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
                          {specProgress.averageScore}% avg
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Study Modes */}
        {!searchQuery && (
          <>
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">
                {examWeekMode ? "Exam-Week Modes (High-Yield Only)" : "Study Modes"}
              </h2>
              <button
                onClick={() => setExamWeekMode(!examWeekMode)}
                data-tour="exam-week"
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${examWeekMode ? "bg-rose-500/20 border-rose-500/40 text-rose-200" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white"}`}
                aria-pressed={examWeekMode}
                aria-label="Toggle Exam-Week Mode"
              >
                {examWeekMode ? "🔥 Exam-Week Mode ON" : "Exam-Week Mode"}
              </button>
            </div>
            {(() => {
              type Mode = {
                label: string;
                desc: string;
                icon: string;
                gradient: string;
                size: StudyModeSize;
                badge?: "new" | "popular" | "hot";
                action: () => void;
                highYield: boolean;
                tour?: string;
                status?: string;
              };

              const modes: Mode[] = [
                {
                  label: "Paired-Topic Mock Exam",
                  desc: "Authentic ABO room format — 2 examiners, 14 cases, 50 min. The closest thing to the real deal.",
                  icon: "🏛️",
                  gradient: "from-primary-500 to-emerald-600",
                  size: "xl",
                  badge: "popular",
                  action: () => setCurrentView("paired-exam"),
                  highYield: true,
                  status: "50 min · 14 cases",
                },
                {
                  label: "AI Examiner",
                  desc: "Real-time AI tutor & mock examiner. 10 modes, Gemini-powered.",
                  icon: "🤖",
                  gradient: "from-steel-400 to-primary-500",
                  size: "lg",
                  badge: "hot",
                  action: () => setCurrentView("ai-examiner"),
                  highYield: true,
                  tour: "ai-examiner",
                  status: "Live AI · voice-ready",
                },
                {
                  label: "Cram Sheet",
                  desc: "Printable high-yield reference across all subspecialties.",
                  icon: "📝",
                  gradient: "from-amber-400 to-amber-600",
                  size: "md",
                  action: () => setCurrentView("cram"),
                  highYield: true,
                  tour: "cram",
                },
                {
                  label: "Due Today",
                  desc: dueCount > 0
                    ? `${dueCount} due${overdueCount > 0 ? `, ${overdueCount} overdue` : ""}`
                    : progress.totalCasesAttempted === 0
                    ? "Study a case to build your review queue."
                    : "All caught up — come back tomorrow.",
                  icon: "📅",
                  gradient: overdueCount > 0 ? "from-rose-500 to-amber-500" : "from-primary-500 to-steel-500",
                  size: "md",
                  action: () => setCurrentView("due-today"),
                  highYield: true,
                  status: "SRS queue",
                },
                {
                  label: "Performance Heatmap",
                  desc: heatmapWeakestCell
                    ? `Weakest: ${axisLabel(heatmapWeakestCell.axis)} in ${heatmapWeakestCell.subspecialty} — ${heatmapWeakestCell.averagePercent}%`
                    : "Subspecialty × ABO-axis breakdown.",
                  icon: "📊",
                  gradient: "from-primary-500 to-steel-400",
                  size: "md",
                  badge: "new",
                  action: () => setCurrentView("heatmap"),
                  highYield: true,
                },
                {
                  label: "Weakness Drill",
                  desc: weakestHint
                    ? `Next recommended: ${weakestHint}`
                    : progress.totalCasesAttempted === 0
                    ? "Complete cases to unlock weakness targeting."
                    : "Target your lowest-scoring areas.",
                  icon: "🎯",
                  gradient: "from-steel-500 to-primary-600",
                  size: "md",
                  action: () => setCurrentView("weakness-quiz"),
                  highYield: true,
                },
                {
                  label: "Rapid-Fire Drill",
                  desc: "30s per question — exam pressure simulator.",
                  icon: "⚡",
                  gradient: "from-rose-500 to-amber-500",
                  size: "sm",
                  action: () => setCurrentView("rapid-fire"),
                  highYield: true,
                  status: "30s · per Q",
                },
                {
                  label: "Q-Bank",
                  desc: "50 high-yield board-style questions & answers.",
                  icon: "🧠",
                  gradient: "from-primary-400 to-steel-500",
                  size: "sm",
                  action: () => setCurrentView("qbank"),
                  highYield: true,
                },
                {
                  label: "My Flashcards",
                  desc: "Your custom cards — SRS-scheduled.",
                  icon: "📇",
                  gradient: "from-steel-400 to-steel-600",
                  size: "sm",
                  action: () => setCurrentView("user-flashcards"),
                  highYield: true,
                },
                {
                  label: "Exam Simulation",
                  desc: "Timed mock exam with random cases.",
                  icon: "⏱️",
                  gradient: "from-amber-500 to-rose-500",
                  size: "sm",
                  action: () => setCurrentView("exam"),
                  highYield: false,
                  tour: "exam",
                },
                {
                  label: "Random Case",
                  desc: "Jump into a surprise case right now.",
                  icon: "🎲",
                  gradient: "from-emerald-400 to-primary-500",
                  size: "sm",
                  action: () => {
                    const allCases = database.subspecialties.flatMap((s) => s.cases.filter((c) => c.questions.length > 0));
                    if (allCases.length === 0) return;
                    handleSelectCase(allCases[Math.floor(Math.random() * allCases.length)]);
                  },
                  highYield: false,
                },
                {
                  label: "Flashcards",
                  desc: "Rapid concept review cards.",
                  icon: "🃏",
                  gradient: "from-steel-500 to-primary-500",
                  size: "sm",
                  action: () => setCurrentView("flashcards"),
                  highYield: false,
                },
                {
                  label: "Quick Review",
                  desc: "Browse answers without scoring.",
                  icon: "📋",
                  gradient: "from-primary-500 to-emerald-500",
                  size: "sm",
                  action: () => setCurrentView("review"),
                  highYield: false,
                },
                {
                  label: "Practice Patterns",
                  desc: "AAO PPP guidelines & quizzes.",
                  icon: "📖",
                  gradient: "from-steel-400 to-primary-500",
                  size: "sm",
                  action: () => setCurrentView("ppp"),
                  highYield: false,
                },
                {
                  label: "Analytics",
                  desc: "Performance analytics & insights.",
                  icon: "📈",
                  gradient: "from-primary-500 to-steel-600",
                  size: "sm",
                  action: () => setCurrentView("dashboard"),
                  highYield: false,
                },
                {
                  label: "Settings / Data",
                  desc: "Export, import, or reset your progress.",
                  icon: "⚙️",
                  gradient: "from-slate-500 to-slate-700",
                  size: "sm",
                  action: () => setCurrentView("settings"),
                  highYield: false,
                },
              ];

              const visible = modes.filter((m) => !examWeekMode || m.highYield);

              return (
                <motion.div
                  variants={staggerFast}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  className="mb-14 grid grid-cols-2 sm:grid-cols-6 auto-rows-[minmax(132px,auto)] gap-3"
                >
                  {visible.map((m) => (
                    <StudyModeCard
                      key={m.label}
                      label={m.label}
                      desc={m.desc}
                      icon={m.icon}
                      gradient={m.gradient}
                      size={m.size}
                      badge={m.badge}
                      highYield={m.highYield}
                      tourId={m.tour}
                      status={m.status}
                      onClick={m.action}
                    />
                  ))}
                </motion.div>
              );
            })()}
          </>
        )}

        {/* ABO Exam Info */}
        {!searchQuery && (
          <div className="glass-card rounded-xl p-6 mb-10">
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">About the ABO Oral Examination</h2>
            <div className="divider-glow mb-4" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm mb-5">
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Format</p>
                <p className="text-slate-400 text-xs leading-relaxed">42 Patient Management Problems across 3 virtual rooms (50 min each). 2 examiners per room, 7 cases each. ~3.5 minutes per case.</p>
              </div>
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Scoring</p>
                <p className="text-slate-400 text-xs leading-relaxed">3 domains scored 0-3: Data Acquisition, Diagnosis, Management. Compensatory model — strength offsets weakness. Pass/fail only.</p>
              </div>
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Pass Rates</p>
                <p className="text-slate-400 text-xs leading-relaxed">~79-87% for first-time takers. ~63% for repeat takers. Knowledge alone is insufficient — verbal fluency and structure are critical.</p>
              </div>
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Room Pairings</p>
                <p className="text-slate-400 text-xs leading-relaxed">Room 1: Anterior + Optics. Room 2: External + Pediatrics. Room 3: Neuro-Ophthalmology + Posterior Segment.</p>
              </div>
            </div>
            <div className="divider-glow mb-4" />
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-primary-400 uppercase tracking-wider font-medium mb-1">8-Element PMP Framework</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Image Description, History, Exam, DDx, Workup, Diagnosis, Management, Patient Education</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-1">Fatal Flaws</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Missing GCA in AION, retinoblastoma in leukocoria, open globe signs, or starting oral steroids alone in optic neuritis</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium mb-1">Key Trials</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">ONTT, CATT, DRCR.net, EVS, COMS, AREDS2, PEDIG, IIHTT, OHTS</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer — CVE logo + small mascot silhouettes for brand warmth */}
        <footer className="pt-14 pb-10">
          <div className="divider-glow mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CVELogo size={80} wordmark={false} className="opacity-90" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white tracking-tight">
                  Clear Vision <span className="font-[family-name:var(--font-fraunces)] italic text-primary-300">Boards</span>
                </span>
                <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                  by Clear Vision Education
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 opacity-70">
              <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-primary-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
                <LensleyAvatar size={40} />
              </div>
              <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-steel-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
                <EyesaacAvatar size={40} />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 max-w-md mt-6 text-center sm:text-left">
            For educational purposes only. Not affiliated with the American Board of Ophthalmology.
          </p>
          <p className="text-[10px] text-slate-600 mt-2 font-mono text-center sm:text-left">
            v{process.env.NEXT_PUBLIC_BUILD_VERSION || "0.0.0"}
            {" · "}
            {process.env.NEXT_PUBLIC_GIT_SHA || "dev"}
            {" · deployed "}
            {process.env.NEXT_PUBLIC_BUILD_DATE || "—"}
          </p>
        </footer>
      </main>

      {/* Floating help button (mouse users) */}
      <button
        onClick={() => setShowHelp(true)}
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        className="fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full glass-card border border-slate-700/60 flex items-center justify-center text-slate-300 opacity-50 hover:opacity-100 hover:text-white transition-opacity font-mono text-sm"
      >
        ?
      </button>

      <KeyboardShortcutsOverlay open={showHelp} onClose={() => setShowHelp(false)} />

      {/* First-time onboarding tour — renders only if localStorage flag unset. */}
      <OnboardingTour enabled={!loading && !!database} />
    </div>
  );
}
