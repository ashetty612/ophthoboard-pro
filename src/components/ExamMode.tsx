"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";
import { scoreAnswer, scorePhotoDescription, calculateGrade, getGradeColor, getGradeBgColor } from "@/lib/scoring";
import { saveAttempt } from "@/lib/storage";
import { QUESTION_TYPE_INFO } from "@/lib/pearls";
import { CaseAttempt, UserAnswer } from "@/lib/types";

interface ExamModeProps {
  database: CasesDatabase;
  onBack: () => void;
  onSelectCase: (caseData: CaseData) => void;
}

type ExamPhase = "setup" | "active" | "results" | "review";

export default function ExamMode({ database, onBack }: ExamModeProps) {
  const [phase, setPhase] = useState<ExamPhase>("setup");
  const [numCases, setNumCases] = useState(5);
  const [timePerCase, setTimePerCase] = useState(8); // minutes
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    database.subspecialties.map((s) => s.id)
  );
  const [examCases, setExamCases] = useState<CaseData[]>([]);
  const [currentCaseIdx, setCurrentCaseIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(-1); // -1 = photo description
  const [answers, setAnswers] = useState<{ [key: string]: string[] }>({});
  const [photoAnswers, setPhotoAnswers] = useState<{ [key: string]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [examResults, setExamResults] = useState<CaseAttempt[]>([]);
  const [caseTimeSpent, setCaseTimeSpent] = useState<number[]>([]); // seconds per case
  const [questionElapsed, setQuestionElapsed] = useState(0); // seconds on current question
  const [reviewIdx, setReviewIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalExamTime = numCases * timePerCase * 60;

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentCaseIdx, currentQuestionIdx]);

  const [timeUp, setTimeUp] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  // Reset per-question elapsed counter whenever the question or case changes.
  useEffect(() => {
    setQuestionElapsed(0);
  }, [currentCaseIdx, currentQuestionIdx]);

  // Per-question elapsed timer (tracks time on current question for budget hint)
  useEffect(() => {
    if (phase !== "active" || isPaused) return;
    const t = setInterval(() => setQuestionElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, isPaused, currentCaseIdx, currentQuestionIdx]);

  useEffect(() => {
    if (phase === "active" && !isPaused) {
      timerRef.current = setInterval(() => {
        setTotalTimeRemaining((prev) => {
          // Show warning at 30 seconds
          if (prev === 31) setShowTimeWarning(true);
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (isPaused && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [phase, isPaused]);

  const toggleSpec = (specId: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(specId)
        ? prev.filter((s) => s !== specId)
        : [...prev, specId]
    );
  };

  const startExam = () => {
    const eligibleCases = database.subspecialties
      .filter((s) => selectedSpecs.includes(s.id))
      .flatMap((s) => s.cases.filter((c) => c.questions.length > 0));

    // Shuffle and pick
    const shuffled = eligibleCases.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numCases);

    setExamCases(selected);
    setCurrentCaseIdx(0);
    setCurrentQuestionIdx(selected[0]?.imageFile ? -1 : 0);
    setTimeRemaining(timePerCase * 60);
    setTotalTimeRemaining(totalExamTime);
    setAnswers({});
    setPhotoAnswers({});
    setCaseTimeSpent(new Array(selected.length).fill(0));
    setPhase("active");
  };

  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const results: CaseAttempt[] = examCases.map((c, idx) => {
      const caseAnswers = answers[c.id] || new Array(c.questions.length).fill("");
      const photoAnswer = photoAnswers[c.id] || "";
      const scored = c.questions.map((q, i) => scoreAnswer(q, caseAnswers[i] || ""));
      const photoResult = c.photoDescription
        ? scorePhotoDescription(photoAnswer, c.photoDescription)
        : null;

      const totalScore = scored.reduce((s, a) => s + a.score, 0) + (photoResult?.score || 0);
      const maxPossible = scored.reduce((s, a) => s + a.maxScore, 0) + (photoResult?.maxScore || 0);
      const pct = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

      const attempt: CaseAttempt = {
        caseId: c.id,
        timestamp: new Date().toISOString(),
        photoDescriptionAnswer: photoAnswer,
        photoDescriptionScore: photoResult?.score || 0,
        answers: scored,
        totalScore,
        maxPossibleScore: maxPossible,
        percentageScore: pct,
        grade: calculateGrade(pct),
        timeSpentSeconds: caseTimeSpent[idx] ?? timePerCase * 60,
      };

      saveAttempt(attempt);
      return attempt;
    });

    setExamResults(results);
    setPhase("results");
  }, [examCases, answers, photoAnswers, timePerCase, caseTimeSpent]);

  useEffect(() => {
    if (timeUp) finishExam();
  }, [timeUp, finishExam]);

  // Dismiss time warning after 5 seconds
  useEffect(() => {
    if (showTimeWarning) {
      const t = setTimeout(() => setShowTimeWarning(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showTimeWarning]);

  const recordCurrentCaseTimeAndAdvance = (finish: boolean) => {
    // Record seconds used on the current case (per-case budget minus what's left).
    const spent = Math.max(0, timePerCase * 60 - timeRemaining);
    setCaseTimeSpent((prev) => {
      const next = [...prev];
      next[currentCaseIdx] = spent;
      return next;
    });
    if (finish) {
      finishExam();
      return;
    }
    const nextCase = examCases[currentCaseIdx + 1];
    setCurrentCaseIdx(currentCaseIdx + 1);
    setCurrentQuestionIdx(nextCase.imageFile ? -1 : 0);
    setTimeRemaining(timePerCase * 60);
  };

  const handleNextQuestion = () => {
    const currentCase = examCases[currentCaseIdx];
    if (currentQuestionIdx < currentCase.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentCaseIdx < examCases.length - 1) {
      recordCurrentCaseTimeAndAdvance(false);
    } else {
      recordCurrentCaseTimeAndAdvance(true);
    }
  };

  const skipCase = () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Skip this case? Your current answers will be saved but you'll advance immediately to the next case."
      );
      if (!ok) return;
    }
    if (currentCaseIdx < examCases.length - 1) {
      recordCurrentCaseTimeAndAdvance(false);
    } else {
      recordCurrentCaseTimeAndAdvance(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCurrentAnswer = () => {
    const c = examCases[currentCaseIdx];
    if (currentQuestionIdx === -1) return photoAnswers[c.id] || "";
    return (answers[c.id] || [])[currentQuestionIdx] || "";
  };

  const setCurrentAnswer = (value: string) => {
    const c = examCases[currentCaseIdx];
    if (currentQuestionIdx === -1) {
      setPhotoAnswers((prev) => ({ ...prev, [c.id]: value }));
    } else {
      setAnswers((prev) => {
        const existing = prev[c.id] || new Array(c.questions.length).fill("");
        const updated = [...existing];
        updated[currentQuestionIdx] = value;
        return { ...prev, [c.id]: updated };
      });
    }
  };

  // SETUP
  if (phase === "setup") {
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
            <h1 className="text-lg font-bold text-white">Exam Simulation Setup</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                ⏱️
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Mock Oral Board Exam</h2>
              <p className="text-slate-400 text-sm">42 PMPs, 3 rooms, 50 min each. ~3.5 min/case target.</p>
            </div>

            {/* Number of cases */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Number of Cases
              </label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumCases(n)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      numCases === n
                        ? "bg-primary-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    {n} cases
                  </button>
                ))}
              </div>
            </div>

            {/* Time per case */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Time Per Case (minutes)
              </label>
              <div className="flex gap-2">
                {[5, 8, 10, 15].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimePerCase(t)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      timePerCase === t
                        ? "bg-primary-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            {/* Subspecialties */}
            <div className="mb-8">
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Include Subspecialties
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {database.subspecialties.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSpec(s.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                      selectedSpecs.includes(s.id)
                        ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                        : "bg-slate-800/50 text-slate-500 border border-slate-700/30"
                    }`}
                  >
                    {s.name}
                    <span className="ml-2 text-xs opacity-60">
                      ({s.cases.filter((c) => c.questions.length > 0).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/30">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total exam time</span>
                <span className="text-white font-medium">
                  {numCases * timePerCase} minutes
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-400">Available cases</span>
                <span className="text-white font-medium">
                  {database.subspecialties
                    .filter((s) => selectedSpecs.includes(s.id))
                    .reduce(
                      (sum, s) =>
                        sum + s.cases.filter((c) => c.questions.length > 0).length,
                      0
                    )}
                </span>
              </div>
            </div>

            <button
              onClick={startExam}
              disabled={selectedSpecs.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold text-lg transition-all shadow-lg"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE EXAM
  if (phase === "active") {
    const currentCase = examCases[currentCaseIdx];
    // Defensive guard: should never happen (startExam populates examCases before
    // setting phase), but if state ever ends up inconsistent we render a recovery
    // screen instead of crashing.
    if (!currentCase) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Exam state lost</h2>
            <p className="text-sm text-slate-400 mb-4">
              We couldn&apos;t find the current case. Let&apos;s start over.
            </p>
            <button
              onClick={() => setPhase("setup")}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium"
            >
              Back to Setup
            </button>
          </div>
        </div>
      );
    }
    const isPhoto = currentQuestionIdx === -1;
    const question = !isPhoto ? currentCase.questions[currentQuestionIdx] : null;
    const questionInfo = question ? QUESTION_TYPE_INFO[question.number] : null;
    const isUrgent = timeRemaining < 60;

    // --- Pace coach ---
    // expected progress = fraction of cases complete based on index
    // actual progress = fraction of total exam time elapsed
    // paceDelta > 0 means behind (used more time than expected for progress)
    const expectedProgress = examCases.length > 0 ? currentCaseIdx / examCases.length : 0;
    const actualProgress = totalExamTime > 0 ? (totalExamTime - totalTimeRemaining) / totalExamTime : 0;
    const paceDelta = (actualProgress - expectedProgress) * totalExamTime; // seconds
    let paceLabel = "On pace";
    let paceIcon = "✓";
    let paceClass = "text-emerald-400";
    if (paceDelta >= 90) {
      paceIcon = "⚠";
      paceLabel = "Running behind — consider skipping forward";
      paceClass = "text-rose-400";
    } else if (paceDelta >= 30) {
      paceIcon = "⏱";
      paceLabel = `${Math.round(paceDelta)}s over — speed up`;
      paceClass = "text-amber-400";
    } else if (paceDelta <= -30) {
      paceIcon = "🚀";
      paceLabel = "Ahead of pace — quality over speed";
      paceClass = "text-primary-400";
    }

    // --- Question budget hint ---
    // Each question gets ~1/nQuestions of the per-case budget. Flag at 2x expected.
    const nQuestions = currentCase.questions.length + (currentCase.photoDescription ? 1 : 0);
    const perQuestionBudget = nQuestions > 0 ? (timePerCase * 60) / nQuestions : timePerCase * 60;
    const questionBudgetExceeded = questionElapsed > perQuestionBudget * 2;

    return (
      <div className="min-h-screen">
        {/* Timer header */}
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">
                Case {currentCaseIdx + 1}/{examCases.length}: {currentCase.title}
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`text-xs px-3 py-2 min-h-[36px] rounded-md ${isPaused ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'} hover:opacity-80 transition-colors`}
                  aria-label={isPaused ? "Resume exam timer" : "Pause exam timer"}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <span className={`text-sm font-mono font-bold ${isUrgent ? "text-rose-400 animate-pulse" : isPaused ? "text-amber-400" : "text-white"}`} role="timer" aria-live="polite">
                  {isPaused ? "PAUSED" : formatTime(timeRemaining)}
                </span>
                <span className="text-xs text-slate-500">
                  Total: {formatTime(totalTimeRemaining)}
                </span>
              </div>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full progress-bar ${isUrgent ? "bg-rose-500" : "bg-amber-500"}`}
                style={{
                  width: `${(timeRemaining / (timePerCase * 60)) * 100}%`,
                }}
              />
            </div>
            {/* Pace coach */}
            <div className={`mt-1.5 text-[11px] font-medium ${paceClass}`} aria-live="polite">
              <span className="mr-1">{paceIcon}</span>
              {paceLabel}
            </div>
          </div>
        </div>

        {/* Time warning banner */}
        {showTimeWarning && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="bg-rose-500/20 border border-rose-500/40 rounded-xl p-3 text-center animate-fade-in">
              <p className="text-rose-300 text-sm font-medium">30 seconds remaining! Finish your current answer.</p>
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {isPaused && (
          <div className="max-w-4xl mx-auto px-4 pt-8">
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-2xl font-bold text-amber-400 mb-2">Exam Paused</p>
              <p className="text-sm text-slate-400 mb-4">Take a moment. Click Resume when ready.</p>
              <button onClick={() => setIsPaused(false)} className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors">
                Resume Exam
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-6" style={{ display: isPaused ? 'none' : undefined }}>
          {/* Image — supports both local and external URLs */}
          {(currentCase.imageFile || currentCase.externalImageUrl) && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black/50 max-w-md">
              <img
                src={currentCase.imageFile ? `/images/${currentCase.imageFile}` : (currentCase.externalImageUrl || '')}
                alt="Clinical photograph"
                className="w-full h-auto"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div className="glass-card rounded-2xl p-6">
            {isPhoto ? (
              <>
                <h3 className="text-lg font-bold text-white mb-2">
                  Describe this clinical photograph
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Include imaging modality, laterality, anatomy, and all findings.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-primary-400 text-sm font-bold">{question!.number}</span>
                  </div>
                  <div>
                    <p className="text-xs text-primary-400 font-medium">{questionInfo?.name}</p>
                    <h3 className="text-lg font-bold text-white">{question!.question}</h3>
                  </div>
                </div>
              </>
            )}

            <textarea
              ref={textareaRef}
              value={getCurrentAnswer()}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleNextQuestion();
                }
              }}
              placeholder="Type your answer... (Cmd+Enter to advance)"
              rows={5}
              className="w-full mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-primary-500 transition-colors"
            />
            {questionBudgetExceeded && (
              <p className="mt-1.5 text-[11px] text-amber-400/90 animate-pulse">
                ⏱ budget exceeded on this question
              </p>
            )}

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-500">
                {isPhoto
                  ? "Photo Description"
                  : `Q${currentQuestionIdx + 1}/${currentCase.questions.length}`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={skipCase}
                  className="px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 text-sm font-medium transition-colors"
                  aria-label="Skip this case and advance"
                >
                  Skip case
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
                >
                  {currentCaseIdx === examCases.length - 1 &&
                  currentQuestionIdx === currentCase.questions.length - 1
                    ? "Finish Exam"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REVIEW MISSED CASES
  if (phase === "review") {
    const missed = examResults
      .map((r, i) => ({ r, c: examCases[i] }))
      .filter((x) => x.c && x.r.percentageScore < 70);

    if (missed.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card rounded-2xl p-8 max-w-md text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Nothing to review</h2>
            <p className="text-sm text-slate-400 mb-4">
              You scored 70% or higher on every case.
            </p>
            <button
              onClick={() => setPhase("results")}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium"
            >
              Back to Results
            </button>
          </div>
        </div>
      );
    }

    const idx = Math.min(reviewIdx, missed.length - 1);
    const { r: result, c: reviewCase } = missed[idx];

    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setPhase("results")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Results</span>
            </button>
            <h1 className="text-lg font-bold text-white">
              Review {idx + 1}/{missed.length}
            </h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-6 mb-4">
            <p className="text-xs text-slate-400">{reviewCase.subspecialty}</p>
            <h2 className="text-xl font-bold text-white mt-1">{reviewCase.title}</h2>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30">
              <span className="text-xs text-rose-300">Scored {result.percentageScore}%</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{reviewCase.presentation}</p>
          </div>

          {reviewCase.questions.map((q, qi) => {
            const ua = result.answers[qi];
            return (
              <div key={qi} className="glass-card rounded-xl p-5 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-primary-400 text-xs font-bold">{q.number}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{q.question}</p>
                </div>
                {ua && (
                  <div className="mb-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Your answer</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {ua.answer || <span className="italic text-slate-500">(blank)</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Score: {ua.score}/{ua.maxScore}
                    </p>
                  </div>
                )}
                <div className="mb-2">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-400 mb-1">Correct answer</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{q.answer}</p>
                </div>
                {q.keyPoints && q.keyPoints.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Key points</p>
                    <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
                      {q.keyPoints.map((kp, ki) => (
                        <li key={ki}>{kp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {q.teaching?.perfectAnswer && (
                  <div className="mt-2 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                    <p className="text-[11px] uppercase tracking-wide text-primary-300 mb-1">Perfect answer</p>
                    <p className="text-sm text-slate-200">{q.teaching.perfectAnswer}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setReviewIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              Previous
            </button>
            {idx < missed.length - 1 ? (
              <button
                onClick={() => setReviewIdx(idx + 1)}
                className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
              >
                Next missed case
              </button>
            ) : (
              <button
                onClick={() => setPhase("results")}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                Done reviewing
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS
  const totalScore = examResults.reduce((s, r) => s + r.totalScore, 0);
  const totalMax = examResults.reduce((s, r) => s + r.maxPossibleScore, 0);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const overallGrade = calculateGrade(overallPct);

  // --- Pace analysis ---
  const totalUsedSeconds = examResults.reduce((s, r) => s + (r.timeSpentSeconds || 0), 0);
  const perCaseBudgetSec = timePerCase * 60;
  const casesOnTime = examResults.filter((r) => r.timeSpentSeconds <= perCaseBudgetSec).length;
  const casesOver = examResults.length - casesOnTime;
  let slowestIdx = -1;
  let slowestSec = -1;
  examResults.forEach((r, i) => {
    if (r.timeSpentSeconds > slowestSec) {
      slowestSec = r.timeSpentSeconds;
      slowestIdx = i;
    }
  });
  const sortedByTime = [...examResults]
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.timeSpentSeconds - a.r.timeSpentSeconds);
  const top2Sec = sortedByTime.slice(0, 2).reduce((s, x) => s + x.r.timeSpentSeconds, 0);
  const top2Share = totalUsedSeconds > 0 ? top2Sec / totalUsedSeconds : 0;
  const missedCount = examResults.filter((r) => r.percentageScore < 70).length;

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
          <h1 className="text-lg font-bold text-white">Exam Results</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
        {/* Overall Score */}
        <div className="glass-card rounded-2xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Mock Exam Complete</h2>
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-40 h-40 score-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#334155" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={overallPct >= 70 ? "#10b981" : overallPct >= 50 ? "#f59e0b" : "#f43f5e"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(overallPct / 100) * 327} 327`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{overallPct}%</span>
              <span className={`text-sm font-medium ${getGradeColor(overallGrade)}`}>
                {overallGrade}
              </span>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getGradeBgColor(overallGrade)}`}>
            <span className={`text-sm font-medium ${getGradeColor(overallGrade)}`}>
              {overallPct >= 70 ? "PASS" : "Needs more preparation"}
            </span>
          </div>
        </div>

        {/* ABO 3-Domain Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Data Acquisition", desc: "History, Exam, Tests", color: "text-primary-400", questions: [2, 3, 4] },
            { label: "Diagnosis", desc: "DDx & Working Dx", color: "text-violet-400", questions: [1] },
            { label: "Management", desc: "Treatment & Counseling", color: "text-emerald-400", questions: [5, 6] },
          ].map((domain) => {
            const domainScore = examResults.reduce((sum, r) =>
              sum + r.answers.filter(a => domain.questions.includes(a.questionNumber)).reduce((s, a) => s + a.score, 0), 0);
            const domainMax = examResults.reduce((sum, r) =>
              sum + r.answers.filter(a => domain.questions.includes(a.questionNumber)).reduce((s, a) => s + a.maxScore, 0), 0);
            const domainPct = domainMax > 0 ? Math.round((domainScore / domainMax) * 100) : 0;
            return (
              <div key={domain.label} className="glass-card rounded-xl p-4 text-center">
                <p className={`text-lg font-bold stat-number ${domain.color}`}>{domainPct}%</p>
                <p className="text-xs font-medium text-white mt-1">{domain.label}</p>
                <p className="text-[10px] text-slate-500">{domain.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Pace Analysis */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⏱️</span>
            <h3 className="text-lg font-bold text-white">Pace Analysis</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Time used</p>
              <p className="text-base font-semibold text-white mt-0.5">
                {formatTime(totalUsedSeconds)}
                <span className="text-xs font-normal text-slate-500"> / {formatTime(totalExamTime)}</span>
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">On time</p>
              <p className="text-base font-semibold text-emerald-400 mt-0.5">
                {casesOnTime}
                <span className="text-xs font-normal text-slate-500"> / {examResults.length} cases</span>
              </p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Over budget</p>
              <p className={`text-base font-semibold mt-0.5 ${casesOver === 0 ? "text-slate-300" : "text-amber-400"}`}>
                {casesOver}
                <span className="text-xs font-normal text-slate-500"> / {examResults.length} cases</span>
              </p>
            </div>
          </div>

          {/* Per-case time bars */}
          <div className="space-y-1.5 mb-4">
            {examResults.map((r, i) => {
              const c = examCases[i];
              const overBudget = r.timeSpentSeconds > perCaseBudgetSec;
              const pct = Math.min(100, (r.timeSpentSeconds / perCaseBudgetSec) * 100);
              return (
                <div key={c?.id || i} className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 w-14 shrink-0">Case {i + 1}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${overBudget ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-mono w-12 text-right ${overBudget ? "text-rose-400" : "text-slate-400"}`}>
                    {formatTime(r.timeSpentSeconds)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actionable feedback */}
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            {slowestIdx >= 0 && examCases[slowestIdx] && (
              <p className="text-xs text-slate-300 mb-1">
                <span className="text-slate-500">Most time spent:</span>{" "}
                Case {slowestIdx + 1} ({examCases[slowestIdx].title}) —{" "}
                <span className="font-mono">{formatTime(slowestSec)}</span>
              </p>
            )}
            <p className="text-xs text-slate-400">
              {examResults.length >= 2 && top2Share >= 0.4
                ? `You spent ${Math.round(top2Share * 100)}% of your time on 2 cases — practice committing on tough cases.`
                : casesOver > 0
                ? `${casesOver} case${casesOver === 1 ? "" : "s"} ran over budget. Try setting a hard per-case cap and moving on.`
                : "Great pacing — time was distributed evenly across cases."}
            </p>
          </div>
        </div>

        {/* Per-case results */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-white">Case Breakdown</h3>
          {examResults.map((result, i) => {
            const c = examCases[i];
            return (
              <div key={c.id} className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      Case {i + 1}: {c.title}
                    </p>
                    <p className="text-xs text-slate-400">{c.subspecialty}</p>
                  </div>
                  <div className={`text-lg font-bold ${
                    result.percentageScore >= 70 ? "text-emerald-400" :
                    result.percentageScore >= 50 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {result.percentageScore}%
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full progress-bar ${
                      result.percentageScore >= 70 ? "bg-emerald-500" :
                      result.percentageScore >= 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${result.percentageScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {missedCount > 0 && (
          <button
            onClick={() => {
              setReviewIdx(0);
              setPhase("review");
            }}
            className="w-full mb-4 py-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-medium transition-colors"
          >
            Review Missed Cases ({missedCount})
          </button>
        )}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => {
              setPhase("setup");
              setExamResults([]);
            }}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
          >
            Take Another Exam
          </button>
        </div>
      </div>
    </div>
  );
}
