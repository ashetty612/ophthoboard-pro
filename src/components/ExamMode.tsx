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

type ExamPhase = "setup" | "active" | "results";

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalExamTime = numCases * timePerCase * 60;

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentCaseIdx, currentQuestionIdx]);

  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        setTotalTimeRemaining((prev) => {
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
    }
  }, [phase]);

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
    setPhase("active");
  };

  const finishExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const results: CaseAttempt[] = examCases.map((c) => {
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
        timeSpentSeconds: timePerCase * 60,
      };

      saveAttempt(attempt);
      return attempt;
    });

    setExamResults(results);
    setPhase("results");
  }, [examCases, answers, photoAnswers, timePerCase]);

  useEffect(() => {
    if (timeUp) finishExam();
  }, [timeUp, finishExam]);

  const handleNextQuestion = () => {
    const currentCase = examCases[currentCaseIdx];
    if (currentQuestionIdx < currentCase.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentCaseIdx < examCases.length - 1) {
      const nextCase = examCases[currentCaseIdx + 1];
      setCurrentCaseIdx(currentCaseIdx + 1);
      setCurrentQuestionIdx(nextCase.imageFile ? -1 : 0);
      setTimeRemaining(timePerCase * 60);
    } else {
      finishExam();
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
    const isPhoto = currentQuestionIdx === -1;
    const question = !isPhoto ? currentCase.questions[currentQuestionIdx] : null;
    const questionInfo = question ? QUESTION_TYPE_INFO[question.number] : null;
    const isUrgent = timeRemaining < 60;

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
                <span className={`text-sm font-mono font-bold ${isUrgent ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {formatTime(timeRemaining)}
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
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
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

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-500">
                {isPhoto
                  ? "Photo Description"
                  : `Q${currentQuestionIdx + 1}/${currentCase.questions.length}`}
              </p>
              <div className="flex gap-3">
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

  // RESULTS
  const totalScore = examResults.reduce((s, r) => s + r.totalScore, 0);
  const totalMax = examResults.reduce((s, r) => s + r.maxPossibleScore, 0);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const overallGrade = calculateGrade(overallPct);

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
