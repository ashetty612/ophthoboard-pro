"use client";

import { useState, useEffect, useRef } from "react";
import { CaseData, UserAnswer, CaseAttempt } from "@/lib/types";
import {
  scoreAnswer,
  scorePhotoDescription,
  calculateGrade,
  getGradeColor,
  getGradeBgColor,
} from "@/lib/scoring";
import { saveAttempt, toggleBookmark, isBookmarked, getAttemptsForCase } from "@/lib/storage";
import { getPearlsForCase, QUESTION_TYPE_INFO } from "@/lib/pearls";

interface CaseViewerProps {
  caseData: CaseData;
  onBack: () => void;
}

type Phase = "intro" | "photo" | "questions" | "results";

export default function CaseViewer({ caseData, onBack }: CaseViewerProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(
    new Array(caseData.questions.length).fill("")
  );
  const [photoAnswer, setPhotoAnswer] = useState("");
  const [scoredAnswers, setScoredAnswers] = useState<UserAnswer[]>([]);
  const [photoScore, setPhotoScore] = useState<{
    score: number;
    maxScore: number;
    feedback: string;
  } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [startTime] = useState(Date.now());
  const [showImage, setShowImage] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousAttempts = getAttemptsForCase(caseData.id);
  const pearls = getPearlsForCase(caseData.subspecialty, caseData.title);

  useEffect(() => {
    setBookmarked(isBookmarked(caseData.id));
  }, [caseData.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, currentQuestion]);

  const handleStartCase = () => {
    if (caseData.imageFile && caseData.photoDescription) {
      setPhase("photo");
    } else {
      setPhase("questions");
    }
  };

  const handleSubmitPhotoDescription = () => {
    const result = scorePhotoDescription(photoAnswer, caseData.photoDescription);
    setPhotoScore(result);
    setShowAnswer(true);
  };

  const handleMoveToQuestions = () => {
    setShowAnswer(false);
    setPhase("questions");
  };

  const handleSubmitAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    setShowAnswer(false);
    if (currentQuestion < caseData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Score all answers and show results
      const scored = caseData.questions.map((q, i) => scoreAnswer(q, userAnswers[i]));
      setScoredAnswers(scored);

      const totalScore =
        scored.reduce((sum, a) => sum + a.score, 0) +
        (photoScore?.score || 0);
      const maxPossible =
        scored.reduce((sum, a) => sum + a.maxScore, 0) +
        (photoScore?.maxScore || 0);
      const percentageScore = Math.round((totalScore / maxPossible) * 100);

      const attempt: CaseAttempt = {
        caseId: caseData.id,
        timestamp: new Date().toISOString(),
        photoDescriptionAnswer: photoAnswer,
        photoDescriptionScore: photoScore?.score || 0,
        answers: scored,
        totalScore,
        maxPossibleScore: maxPossible,
        percentageScore,
        grade: calculateGrade(percentageScore),
        timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),
      };

      saveAttempt(attempt);
      setPhase("results");
    }
  };

  const handleToggleBookmark = () => {
    const newState = toggleBookmark(caseData.id);
    setBookmarked(newState);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Header with navigation
  const renderHeader = () => (
    <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <div className="text-center">
          <p className="text-sm font-medium text-white">{caseData.title}</p>
          <p className="text-xs text-slate-400">{caseData.subspecialty}</p>
        </div>

        <button
          onClick={handleToggleBookmark}
          className={`p-2 rounded-lg transition-colors ${
            bookmarked ? "text-amber-400 bg-amber-400/10" : "text-slate-400 hover:text-amber-400"
          }`}
        >
          <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {phase === "questions" && (
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 progress-bar"
            style={{
              width: `${((currentQuestion + (showAnswer ? 1 : 0)) / caseData.questions.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );

  // INTRO PHASE
  if (phase === "intro") {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8">
            {/* Case badge */}
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-medium">
                {caseData.subspecialty}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                Case {caseData.caseNumber}
              </span>
              {previousAttempts.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                  Attempted {previousAttempts.length}x
                </span>
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">{caseData.title}</h2>

            {/* Patient Presentation */}
            <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Patient Presentation
              </h3>
              <p className="text-lg text-white">{caseData.presentation}</p>
            </div>

            {/* Clinical Image Preview */}
            {caseData.imageFile && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Clinical Image
                </h3>
                <div className="relative rounded-xl overflow-hidden bg-black/50 max-w-lg mx-auto">
                  <img
                    src={`/images/${caseData.imageFile}`}
                    alt="Clinical photograph"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* Case Info */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Questions</p>
                <p className="text-lg font-bold text-white">{caseData.questions.length}</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-1">Best Score</p>
                <p className="text-lg font-bold text-white">
                  {previousAttempts.length > 0
                    ? `${Math.max(...previousAttempts.map((a) => a.percentageScore))}%`
                    : "---"}
                </p>
              </div>
            </div>

            {/* Teaching Pearl Preview */}
            {pearls.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Study Tip
                </p>
                <p className="text-sm text-amber-200/80">{pearls[0].pearl}</p>
              </div>
            )}

            <button
              onClick={handleStartCase}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-lg transition-all shadow-lg shadow-primary-500/25 animate-pulse-glow"
            >
              Begin Case
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PHOTO DESCRIPTION PHASE
  if (phase === "photo") {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <span className="text-primary-400 text-sm font-bold">0</span>
              </div>
              <h3 className="text-xl font-bold text-white">Describe this clinical photograph</h3>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              As in the oral exam, start by systematically describing the clinical image. Include: imaging modality, laterality, anatomical structures, and all abnormal findings.
            </p>

            {/* Image */}
            {caseData.imageFile && (
              <div className="relative rounded-xl overflow-hidden bg-black/50 max-w-2xl mx-auto mb-6">
                <img
                  src={`/images/${caseData.imageFile}`}
                  alt="Clinical photograph"
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Answer Input */}
            <textarea
              ref={textareaRef}
              value={photoAnswer}
              onChange={(e) => setPhotoAnswer(e.target.value)}
              placeholder="Describe what you see in this image..."
              rows={5}
              disabled={showAnswer}
              className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-primary-500 transition-colors"
            />

            {!showAnswer ? (
              <button
                onClick={handleSubmitPhotoDescription}
                disabled={!photoAnswer.trim()}
                className="mt-4 w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors"
              >
                Submit Description
              </button>
            ) : (
              <div className="mt-6 animate-fade-in">
                {/* Score */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary-400">
                      {photoScore?.score}
                    </span>
                    <span className="text-sm text-slate-400">/ {photoScore?.maxScore}</span>
                  </div>
                  <p className="text-sm text-slate-300">{photoScore?.feedback}</p>
                </div>

                {/* Correct Description */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Model Description
                  </p>
                  <p className="text-sm text-emerald-200/90">{caseData.photoDescription}</p>
                </div>

                <button
                  onClick={handleMoveToQuestions}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
                >
                  Continue to Questions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // QUESTIONS PHASE
  if (phase === "questions") {
    const question = caseData.questions[currentQuestion];
    const questionInfo = QUESTION_TYPE_INFO[question.number] || {
      name: `Question ${question.number}`,
      description: "",
      tips: "",
    };

    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          {/* Image toggle (mini) */}
          {caseData.imageFile && (
            <button
              onClick={() => setShowImage(!showImage)}
              className="mb-4 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={showImage ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}
                />
              </svg>
              {showImage ? "Hide Image" : "Show Image"}
            </button>
          )}

          {showImage && caseData.imageFile && (
            <div className="mb-6 rounded-xl overflow-hidden bg-black/50 max-w-md">
              <img
                src={`/images/${caseData.imageFile}`}
                alt="Clinical photograph"
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="glass-card rounded-2xl p-8">
            {/* Question header */}
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                <span className="text-primary-400 font-bold">{question.number}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary-400 font-medium uppercase tracking-wider mb-1">
                  {questionInfo.name}
                </p>
                <h3 className="text-xl font-bold text-white">{question.question}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 ml-13 mb-1 pl-13">{questionInfo.description}</p>

            {/* Tip */}
            <div className="mt-3 mb-6 bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-500">
                <span className="text-amber-400/70 font-medium">Tip: </span>
                {questionInfo.tips}
              </p>
            </div>

            {/* Answer textarea */}
            <textarea
              ref={textareaRef}
              value={userAnswers[currentQuestion]}
              onChange={(e) => {
                const newAnswers = [...userAnswers];
                newAnswers[currentQuestion] = e.target.value;
                setUserAnswers(newAnswers);
              }}
              placeholder="Type your answer here... (Cmd+Enter to submit)"
              rows={6}
              disabled={showAnswer}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !showAnswer && userAnswers[currentQuestion].trim()) {
                  handleSubmitAnswer();
                }
              }}
              className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-primary-500 transition-colors"
            />

            <div className="flex items-center justify-between mt-2 mb-4">
              <p className="text-xs text-slate-500">
                Question {currentQuestion + 1} of {caseData.questions.length}
              </p>
              <p className="text-xs text-slate-500">
                {formatTime(Math.round((Date.now() - startTime) / 1000))} elapsed
              </p>
            </div>

            {!showAnswer ? (
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswers[currentQuestion].trim()}
                  className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors"
                >
                  Submit Answer
                </button>
                <button
                  onClick={() => {
                    setShowAnswer(true);
                  }}
                  className="py-3 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
                >
                  Skip / Show Answer
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Instant Score */}
                {userAnswers[currentQuestion].trim() && (
                  <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    {(() => {
                      const instantScore = scoreAnswer(question, userAnswers[currentQuestion]);
                      const pct = Math.round((instantScore.score / instantScore.maxScore) * 100);
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Your Score</span>
                            <span
                              className={`text-lg font-bold ${
                                pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"
                              }`}
                            >
                              {instantScore.score}/{instantScore.maxScore} ({pct}%)
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{instantScore.feedback}</p>

                          {instantScore.matchedKeywords.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-emerald-400 font-medium mb-1">Matched:</p>
                              <div className="flex flex-wrap gap-1">
                                {instantScore.matchedKeywords.map((k, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300"
                                  >
                                    {k}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {instantScore.missedKeywords.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-rose-400 font-medium mb-1">Missed:</p>
                              <div className="flex flex-wrap gap-1">
                                {instantScore.missedKeywords.map((k, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300"
                                  >
                                    {k}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Model Answer */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mb-4">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                    Model Answer
                  </p>
                  <div className="text-sm text-emerald-200/90 whitespace-pre-line">{question.answer}</div>
                </div>

                {/* Teaching Pearl */}
                {pearls.length > 0 && currentQuestion < pearls.length && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                      Teaching Pearl
                    </p>
                    <p className="text-sm text-amber-200/80">{pearls[currentQuestion % pearls.length].pearl}</p>
                    {pearls[currentQuestion % pearls.length].examTip && (
                      <p className="text-xs text-amber-300/60 mt-2 italic">
                        Exam Tip: {pearls[currentQuestion % pearls.length].examTip}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
                >
                  {currentQuestion < caseData.questions.length - 1 ? "Next Question" : "See Results"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === "results") {
    const totalScore = scoredAnswers.reduce((sum, a) => sum + a.score, 0) + (photoScore?.score || 0);
    const maxPossible =
      scoredAnswers.reduce((sum, a) => sum + a.maxScore, 0) + (photoScore?.maxScore || 0);
    const percentageScore = Math.round((totalScore / maxPossible) * 100);
    const grade = calculateGrade(percentageScore);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Score Hero */}
          <div className="glass-card rounded-2xl p-8 text-center mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-2">Case Complete</h2>
            {caseData.diagnosisTitle && (
              <p className="text-lg text-primary-400 font-medium mb-4">Diagnosis: {caseData.diagnosisTitle}</p>
            )}

            {/* Score Ring */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40 score-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#334155" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={percentageScore >= 70 ? "#10b981" : percentageScore >= 50 ? "#f59e0b" : "#f43f5e"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(percentageScore / 100) * 327} 327`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{percentageScore}%</span>
                <span className={`text-sm font-medium ${getGradeColor(grade)}`}>{grade}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-lg font-bold text-white">
                  {totalScore}/{maxPossible}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Time</p>
                <p className="text-lg font-bold text-white">{formatTime(timeSpent)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Grade</p>
                <p className={`text-lg font-bold ${getGradeColor(grade)}`}>{grade}</p>
              </div>
            </div>

            {/* Grade Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getGradeBgColor(grade)}`}
            >
              <span className={`text-sm font-medium ${getGradeColor(grade)}`}>
                {percentageScore >= 70
                  ? "You would PASS this section"
                  : "Needs more review to pass"}
              </span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-white">Question Breakdown</h3>

            {/* Photo description score */}
            {photoScore && (
              <div className="glass-card rounded-xl p-5 animate-slide-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-primary-400 text-sm font-bold">P</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Photo Description</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      (photoScore.score / photoScore.maxScore) >= 0.7
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {photoScore.score}/{photoScore.maxScore}
                  </span>
                </div>
              </div>
            )}

            {scoredAnswers.map((answer, i) => {
              const pct = Math.round((answer.score / answer.maxScore) * 100);
              const q = caseData.questions[i];
              return (
                <div
                  key={i}
                  className="glass-card rounded-xl p-5 animate-slide-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          pct >= 70
                            ? "bg-emerald-500/20"
                            : pct >= 50
                            ? "bg-amber-500/20"
                            : "bg-rose-500/20"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            pct >= 70
                              ? "text-emerald-400"
                              : pct >= 50
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {q.number}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {QUESTION_TYPE_INFO[q.number]?.name || `Question ${q.number}`}
                        </p>
                        <p className="text-xs text-slate-400">{answer.feedback}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold ${
                          pct >= 70
                            ? "text-emerald-400"
                            : pct >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {answer.score}/{answer.maxScore}
                      </span>
                      <p className="text-xs text-slate-500">{pct}%</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-bar ${
                        pct >= 70
                          ? "bg-emerald-500"
                          : pct >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Back to Cases
            </button>
            <button
              onClick={() => {
                setPhase("intro");
                setCurrentQuestion(0);
                setUserAnswers(new Array(caseData.questions.length).fill(""));
                setPhotoAnswer("");
                setScoredAnswers([]);
                setPhotoScore(null);
                setShowAnswer(false);
              }}
              className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
            >
              Retry Case
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
