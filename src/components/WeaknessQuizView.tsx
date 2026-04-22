"use client";

import { useEffect, useMemo, useState } from "react";
import { CasesDatabase, CaseData, CaseAttempt, StudyProgress } from "@/lib/types";
import { getProgress, getAttempts } from "@/lib/storage";
import {
  analyzeWeaknesses,
  buildAttemptedMap,
  generateWeaknessQuizWithAttempts,
  WeaknessReport,
} from "@/lib/weakness-quiz";

interface WeaknessQuizViewProps {
  database: CasesDatabase;
  onBack: () => void;
  onStartCase: (c: CaseData) => void;
  // Parent-managed queue state — the parent owns the queue so it can advance
  // after each CaseViewer session. See page.tsx.
  quizQueue: CaseData[];
  quizIndex: number;
  setQuizQueue: (q: CaseData[]) => void;
  resetQuiz: () => void;
}

export default function WeaknessQuizView({
  database,
  onBack,
  onStartCase,
  quizQueue,
  quizIndex,
  setQuizQueue,
  resetQuiz,
}: WeaknessQuizViewProps) {
  // All hooks MUST be at the top — Rules of Hooks.
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [attempts, setAttempts] = useState<CaseAttempt[]>([]);
  const [ready, setReady] = useState(false);
  const [customN, setCustomN] = useState(10);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    try {
      setProgress(getProgress());
      setAttempts(getAttempts());
    } catch {
      setProgress(null);
      setAttempts([]);
    } finally {
      setReady(true);
    }
  }, []);

  const report: WeaknessReport | null = useMemo(() => {
    if (!progress) return null;
    return analyzeWeaknesses(progress, attempts);
  }, [progress, attempts]);

  const attemptedMap = useMemo(() => buildAttemptedMap(attempts), [attempts]);

  const startQuiz = (count: number) => {
    if (!report) return;
    const n = Math.max(1, Math.min(50, Math.floor(count)));
    const quiz = generateWeaknessQuizWithAttempts(database, report, n, attemptedMap);
    if (quiz.length === 0) return;
    setQuizQueue(quiz);
    onStartCase(quiz[0]);
  };

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm tracking-wide">Analyzing your progress...</p>
      </div>
    );
  }

  // Quiz in progress (queue active but the parent will have navigated to case
  // view — this branch is shown when the user returns and we're between cases).
  const inProgress = quizQueue.length > 0 && quizIndex < quizQueue.length;
  const quizComplete = quizQueue.length > 0 && quizIndex >= quizQueue.length;

  // Results summary: average score across cases attempted during this quiz.
  const quizResultSummary = (() => {
    if (!quizComplete) return null;
    const ids = new Set(quizQueue.map((c) => c.id));
    // Pull attempts from after we started — best-effort: we use the most-recent
    // attempt per caseId that is in the quiz set.
    const byCase = new Map<string, CaseAttempt>();
    for (const a of attempts) {
      if (ids.has(a.caseId)) {
        const prev = byCase.get(a.caseId);
        if (!prev || a.timestamp > prev.timestamp) byCase.set(a.caseId, a);
      }
    }
    const scored = Array.from(byCase.values());
    if (scored.length === 0) {
      return { attempted: 0, avg: 0 };
    }
    const avg = Math.round(
      scored.reduce((s, a) => s + (a.percentageScore || 0), 0) / scored.length
    );
    return { attempted: scored.length, avg };
  })();

  // --- Render paths ---

  if (inProgress) {
    const nextCase = quizQueue[quizIndex];
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-[11px] text-primary-400/80 uppercase tracking-[0.3em] font-medium mb-4">
            Weakness Drill
          </p>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Case {quizIndex + 1} of {quizQueue.length}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {nextCase.title} <span className="text-slate-600">— {nextCase.subspecialty}</span>
          </p>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 progress-bar"
              style={{ width: `${(quizIndex / quizQueue.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onStartCase(nextCase)}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
            >
              Start Next Case
            </button>
            <button
              onClick={() => {
                resetQuiz();
                onBack();
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              End Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizComplete && quizResultSummary) {
    const passed = quizResultSummary.avg >= 70;
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-[11px] text-primary-400/80 uppercase tracking-[0.3em] font-medium mb-4">
            Quiz Complete
          </p>
          <div className={`text-6xl font-bold mb-3 ${passed ? "text-emerald-400" : "text-amber-400"}`}>
            {quizResultSummary.avg}%
          </div>
          <p className="text-slate-400 text-sm mb-8">
            Average across {quizResultSummary.attempted} case{quizResultSummary.attempted === 1 ? "" : "s"} in this drill.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                resetQuiz();
              }}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
            >
              New Drill
            </button>
            <button
              onClick={() => {
                resetQuiz();
                onBack();
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen
  const hasAnyProgress = !!(progress && progress.totalCasesAttempted > 0);
  const hasActionableReport =
    !!report && (report.weakestSubspecialty || report.weakestPmpElement);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 glass-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">
            ← Back
          </button>
          <h1 className="text-sm font-semibold text-white uppercase tracking-[0.2em]">Weakness Drill</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {!hasAnyProgress || !hasActionableReport ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Study some cases first to get recommendations
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Once you&apos;ve completed a few cases we can pinpoint your weakest
              subspecialty and PMP element, then generate a targeted drill.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <>
            <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in-up">
              <p className="text-[11px] text-primary-400/80 uppercase tracking-[0.3em] font-medium mb-3">
                Your weakness profile
              </p>
              {report!.weakestSubspecialty && (
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight leading-tight">
                  Weakest area:{" "}
                  <span className="gradient-text">{report!.weakestSubspecialty}</span>
                  <span className="text-slate-500 font-medium text-lg ml-2">
                    ({report!.weakestSubspecialtyAvg}% avg)
                  </span>
                </h2>
              )}
              {report!.weakestPmpElement && (
                <p className="text-slate-400 text-sm mt-2">
                  Tough spot:{" "}
                  <span className="text-amber-400 font-medium">
                    Q{report!.weakestPmpElement.number} — {report!.weakestPmpElement.name}
                  </span>{" "}
                  <span className="text-slate-600">
                    ({report!.weakestPmpElement.avgScore}% avg)
                  </span>
                </p>
              )}
              {report!.leastAttempted.length > 0 && (
                <p className="text-xs text-slate-500 mt-3">
                  Under-studied: {report!.leastAttempted.join(", ")}
                </p>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Pick a drill length
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => startQuiz(10)}
                  className="p-4 rounded-xl bg-slate-800/60 hover:bg-primary-600 border border-slate-700/50 hover:border-primary-500 text-white transition-colors"
                >
                  <div className="text-2xl font-bold">10</div>
                  <div className="text-[11px] text-slate-400 group-hover:text-white">cases</div>
                </button>
                <button
                  onClick={() => startQuiz(20)}
                  className="p-4 rounded-xl bg-slate-800/60 hover:bg-primary-600 border border-slate-700/50 hover:border-primary-500 text-white transition-colors"
                >
                  <div className="text-2xl font-bold">20</div>
                  <div className="text-[11px] text-slate-400">cases</div>
                </button>
                <button
                  onClick={() => setShowCustom((v) => !v)}
                  className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 text-white transition-colors"
                >
                  <div className="text-2xl font-bold">Custom</div>
                  <div className="text-[11px] text-slate-400">1–50</div>
                </button>
              </div>

              {showCustom && (
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customN}
                    onChange={(e) => setCustomN(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white text-sm"
                  />
                  <button
                    onClick={() => startQuiz(customN)}
                    className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
                  >
                    Start {Math.max(1, Math.min(50, customN))}-case drill
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                Cases are selected from your weakest subspecialty, prioritizing
                cases you haven&apos;t seen or scored below 70%. The selection is
                stable within a day so you can resume.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
