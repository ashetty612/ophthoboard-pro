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
import { saveAttempt, toggleBookmark, isBookmarked, getAttemptsForCase, updateStudyStreak } from "@/lib/storage";
import { getPearlsForCase, QUESTION_TYPE_INFO } from "@/lib/pearls";
import { getFatalFlawsForCase } from "@/lib/fatal-flaws";
import { rateCase, type Rating } from "@/lib/srs";
import AudioNarrator from "@/components/AudioNarrator";

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
  const [startTime, setStartTime] = useState(Date.now());
  const [showImage, setShowImage] = useState(true);
  const [showTeaching, setShowTeaching] = useState(false);
  const [showPitfalls, setShowPitfalls] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [srsRated, setSrsRated] = useState<{ rating: Rating; intervalDays: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousAttempts = getAttemptsForCase(caseData.id);
  const pearls = getPearlsForCase(caseData.subspecialty, caseData.title);
  const fatalFlaws = getFatalFlawsForCase(
    caseData.diagnosisTitle || "",
    caseData.title || "",
    caseData.questions?.flatMap((q) => q.scoringKeywords || []) ?? []
  );

  useEffect(() => {
    setBookmarked(isBookmarked(caseData.id));
  }, [caseData.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, currentQuestion]);

  // Determine if case has any image (local or external)
  const hasImage = !!(caseData.imageFile || caseData.externalImageUrl);
  const hasPhotoDescription = !!(caseData.photoDescription && caseData.photoDescription.trim());

  const handleStartCase = () => {
    if (hasImage && hasPhotoDescription) {
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
    setShowTeaching(false);
    setShowPitfalls(false);
    if (currentQuestion < caseData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const scored = caseData.questions.map((q, i) => scoreAnswer(q, userAnswers[i]));
      setScoredAnswers(scored);

      const totalScore =
        scored.reduce((sum, a) => sum + a.score, 0) +
        (photoScore?.score || 0);
      const maxPossible =
        scored.reduce((sum, a) => sum + a.maxScore, 0) +
        (photoScore?.maxScore || 0);
      const percentageScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

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
      updateStudyStreak();
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

  // Render clinical image (local or external)
  const renderClinicalImage = (maxWidth?: string) => {
    if (caseData.imageFile) {
      return (
        <div className={`relative rounded-xl overflow-hidden bg-black/50 ${maxWidth || "max-w-lg"} mx-auto`}>
          <img
            src={`/images/${caseData.imageFile}`}
            alt="Clinical photograph"
            className="w-full h-auto"
          />
        </div>
      );
    }
    if (caseData.externalImageUrl) {
      return (
        <div className={`relative rounded-xl overflow-hidden bg-black/50 ${maxWidth || "max-w-lg"} mx-auto`}>
          {imageLoadError ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm mb-2">Clinical image unavailable</p>
              <a
                href={caseData.externalImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 text-sm underline"
              >
                Open image in new tab
              </a>
            </div>
          ) : (
            <img
              src={caseData.externalImageUrl}
              alt="Clinical photograph"
              className="w-full h-auto"
              onError={() => setImageLoadError(true)}
            />
          )}
          {caseData.imageAttribution && !imageLoadError && (
            <p className="text-[10px] text-slate-500 text-center mt-1 italic">{caseData.imageAttribution}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Header with navigation
  const renderHeader = () => (
    <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back to case list"
          className="flex items-center gap-2 min-h-[44px] px-2 -ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-sm font-medium text-white truncate">{caseData.title}</p>
          <p className="text-xs text-slate-400 truncate">{caseData.subspecialty}</p>
        </div>

        <button
          onClick={handleToggleBookmark}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark this case"}
          aria-pressed={bookmarked}
          className={`p-2.5 min-h-[44px] min-w-[44px] rounded-lg transition-colors flex items-center justify-center ${
            bookmarked ? "text-amber-400 bg-amber-400/10" : "text-slate-400 hover:text-amber-400"
          }`}
        >
          <svg className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

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

            <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Patient Presentation
              </h3>
              <p className="text-lg text-white">{caseData.presentation}</p>
            </div>

            {hasImage && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Clinical Image
                </h3>
                {renderClinicalImage()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
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

            {caseData.casePearls && caseData.casePearls.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  High-Yield Pearls for This Case
                </p>
                <ul className="space-y-1.5">
                  {caseData.casePearls.map((pearl, i) => (
                    <li key={i} className="text-sm text-amber-200/80 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 shrink-0">&#x25C6;</span>
                      <span>{pearl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {caseData.highYieldFacts && caseData.highYieldFacts.length > 0 && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                  Board-Relevant Facts
                </p>
                <ul className="space-y-1.5">
                  {caseData.highYieldFacts.map((fact, i) => (
                    <li key={i} className="text-sm text-violet-200/80 flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5 shrink-0">&#x2605;</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {caseData.relatedConditions && caseData.relatedConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs text-slate-500 mr-1">Related:</span>
                {caseData.relatedConditions.map((cond, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                    {cond}
                  </span>
                ))}
              </div>
            )}

            {pearls.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Study Tip
                </p>
                <p className="text-sm text-slate-400">{pearls[0].pearl}</p>
              </div>
            )}

            <div className="mb-6">
              <AudioNarrator
                title={caseData.title}
                presentation={caseData.presentation}
                photoDescription={caseData.photoDescription}
              />
            </div>

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

            <div className="mb-6">
              {renderClinicalImage("max-w-2xl")}
            </div>

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
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary-400">
                      {photoScore?.score}
                    </span>
                    <span className="text-sm text-slate-400">/ {photoScore?.maxScore}</span>
                  </div>
                  <p className="text-sm text-slate-300">{photoScore?.feedback}</p>
                </div>

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
    const teaching = question.teaching;

    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
          {hasImage && (
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

          {showImage && hasImage && (
            <div className="mb-6">
              {renderClinicalImage("max-w-md")}
            </div>
          )}

          <div className="glass-card rounded-2xl p-8">
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

            <div className="mt-3 mb-4 bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
              <p className="text-xs text-slate-500">
                <span className="text-amber-400/70 font-medium">Tip: </span>
                {questionInfo.tips}
              </p>
            </div>

            {teaching?.examinerExpectations && !showAnswer && (
              <div className="mb-4 bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
                <p className="text-xs text-blue-400 font-medium mb-1">What the Examiner is Looking For:</p>
                <p className="text-xs text-blue-200/70">{teaching.examinerExpectations}</p>
              </div>
            )}

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
                  onClick={() => setShowAnswer(true)}
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
                            <span className={`text-lg font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                              {instantScore.score}/{instantScore.maxScore} ({pct}%)
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{instantScore.feedback}</p>
                          {instantScore.matchedKeywords.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-emerald-400 font-medium mb-1">Matched:</p>
                              <div className="flex flex-wrap gap-1">
                                {instantScore.matchedKeywords.map((k, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {instantScore.missedKeywords.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-rose-400 font-medium mb-1">Missed:</p>
                              <div className="flex flex-wrap gap-1">
                                {instantScore.missedKeywords.map((k, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">{k}</span>
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
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Model Answer</p>
                  <div className="text-sm text-emerald-200/90 whitespace-pre-line">{question.answer}</div>
                </div>

                {/* Perfect Answer */}
                {teaching?.perfectAnswer && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">What a Perfect Answer Looks Like</p>
                    <p className="text-sm text-emerald-200/70">{teaching.perfectAnswer}</p>
                  </div>
                )}

                {/* Acceptable Answers */}
                {teaching?.acceptableAnswers && teaching.acceptableAnswers.length > 0 && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Acceptable Responses</p>
                    <ul className="space-y-1">
                      {teaching.acceptableAnswers.map((ans, i) => (
                        <li key={i} className="text-xs text-blue-200/70 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">&#x2713;</span>
                          <span>{ans}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Incorrect Responses */}
                {teaching?.incorrectResponses && teaching.incorrectResponses.length > 0 && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Incorrect / Penalized Responses</p>
                    <ul className="space-y-1">
                      {teaching.incorrectResponses.map((resp, i) => (
                        <li key={i} className="text-xs text-rose-200/70 flex items-start gap-2">
                          <span className="text-rose-400 mt-0.5">&#x2717;</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Common Pitfalls (expandable) */}
                {teaching?.commonPitfalls && teaching.commonPitfalls.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowPitfalls(!showPitfalls)}
                      className="w-full text-left bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 hover:bg-amber-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Common Pitfalls ({teaching.commonPitfalls.length})</p>
                        <svg className={`w-4 h-4 text-amber-400 transition-transform ${showPitfalls ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {showPitfalls && (
                      <div className="mt-2 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 animate-fade-in">
                        <ul className="space-y-2">
                          {teaching.commonPitfalls.map((pitfall, i) => (
                            <li key={i} className="text-xs text-amber-200/70 flex items-start gap-2">
                              <span className="text-amber-400 mt-0.5">&#x26A0;</span>
                              <span>{pitfall}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Learning Points (expandable) */}
                {teaching?.learningPoints && teaching.learningPoints.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowTeaching(!showTeaching)}
                      className="w-full text-left bg-violet-500/5 border border-violet-500/10 rounded-xl p-4 hover:bg-violet-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Learning Points ({teaching.learningPoints.length})</p>
                        <svg className={`w-4 h-4 text-violet-400 transition-transform ${showTeaching ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {showTeaching && (
                      <div className="mt-2 bg-violet-500/5 border border-violet-500/10 rounded-xl p-4 animate-fade-in">
                        <ul className="space-y-2">
                          {teaching.learningPoints.map((point, i) => (
                            <li key={i} className="text-xs text-violet-200/70 flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">&#x2022;</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Teaching Pearl */}
                {pearls.length > 0 && (
                  <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Teaching Pearl</p>
                    <p className="text-sm text-slate-400">{pearls[currentQuestion % pearls.length].pearl}</p>
                    {pearls[currentQuestion % pearls.length].examTip && (
                      <p className="text-xs text-slate-500 mt-2 italic">Exam Tip: {pearls[currentQuestion % pearls.length].examTip}</p>
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
    const maxPossible = scoredAnswers.reduce((sum, a) => sum + a.maxScore, 0) + (photoScore?.maxScore || 0);
    const percentageScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    const grade = calculateGrade(percentageScore);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    return (
      <div className="min-h-screen">
        {renderHeader()}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="glass-card rounded-2xl p-8 text-center mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-2">Case Complete</h2>
            {caseData.diagnosisTitle && (
              <p className="text-lg text-primary-400 font-medium mb-4">Diagnosis: {caseData.diagnosisTitle}</p>
            )}
          </div>

          {/* Fatal Flaws — what examiners specifically fail candidates for missing */}
          {fatalFlaws.length > 0 && (
            <div className="mb-8 space-y-3 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-rose-400 text-lg" aria-hidden>⚠</span>
                <h3 className="text-sm font-bold text-rose-300 uppercase tracking-[0.18em]">
                  Fatal Flaws — Must Not Miss
                </h3>
              </div>
              {fatalFlaws.map((flaw) => (
                <div
                  key={flaw.id}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 text-left"
                >
                  <p className="text-xs uppercase tracking-wider text-rose-300/80 mb-1">
                    {flaw.subspecialty}
                  </p>
                  <p className="text-base font-semibold text-rose-100 mb-2">
                    {flaw.mustNotMiss}
                  </p>
                  <p className="text-sm text-slate-300 mb-3">
                    <span className="text-slate-400">Scenario: </span>
                    {flaw.scenario}
                  </p>
                  <p className="text-sm text-slate-300 mb-3">
                    <span className="text-slate-400">Why: </span>
                    {flaw.whyCritical}
                  </p>
                  <div className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-3 mb-3">
                    <p className="text-[11px] text-amber-400 uppercase tracking-wider mb-1 font-semibold">
                      Say exactly
                    </p>
                    <p className="text-sm text-amber-100 italic leading-relaxed">
                      {flaw.safetyNetPhrase}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-semibold">Immediate action: </span>
                    {flaw.immediateAction}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="glass-card rounded-2xl p-8 text-center mb-8">

            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40 score-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#334155" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={percentageScore >= 70 ? "#10b981" : percentageScore >= 50 ? "#f59e0b" : "#f43f5e"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(percentageScore / 100) * 327} 327`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{percentageScore}%</span>
                <span className={`text-sm font-medium ${getGradeColor(grade)}`}>{grade}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-lg font-bold text-white">{totalScore}/{maxPossible}</p>
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

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Data Acquisition", questions: [2, 3, 4], color: "text-primary-400" },
                { label: "Diagnosis", questions: [1], color: "text-violet-400" },
                { label: "Management", questions: [5, 6], color: "text-emerald-400" },
              ].map((domain) => {
                const dAnswers = scoredAnswers.filter(a => domain.questions.includes(a.questionNumber));
                const dScore = dAnswers.reduce((s, a) => s + a.score, 0);
                const dMax = dAnswers.reduce((s, a) => s + a.maxScore, 0);
                const dPct = dMax > 0 ? Math.round((dScore / dMax) * 100) : 0;
                return (
                  <div key={domain.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className={`text-lg font-bold stat-number ${domain.color}`}>{dPct}%</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{domain.label}</p>
                  </div>
                );
              })}
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getGradeBgColor(grade)}`}>
              <span className={`text-sm font-medium ${getGradeColor(grade)}`}>
                {percentageScore >= 70 ? "PASS" : "Needs more review"}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-white">Question Breakdown</h3>

            {photoScore && (
              <div className="glass-card rounded-xl p-5 animate-slide-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-primary-400 text-sm font-bold">P</span>
                    </div>
                    <p className="text-sm font-medium text-white">Photo Description</p>
                  </div>
                  <span className={`text-sm font-bold ${(photoScore.score / photoScore.maxScore) >= 0.7 ? "text-emerald-400" : "text-amber-400"}`}>
                    {photoScore.score}/{photoScore.maxScore}
                  </span>
                </div>
              </div>
            )}

            {scoredAnswers.map((answer, i) => {
              const pct = Math.round((answer.score / answer.maxScore) * 100);
              const q = caseData.questions[i];
              return (
                <div key={i} className="glass-card rounded-xl p-5 animate-slide-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pct >= 70 ? "bg-emerald-500/20" : pct >= 50 ? "bg-amber-500/20" : "bg-rose-500/20"}`}>
                        <span className={`text-sm font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>{q.number}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{QUESTION_TYPE_INFO[q.number]?.name || `Question ${q.number}`}</p>
                        <p className="text-xs text-slate-400">{answer.feedback}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                        {answer.score}/{answer.maxScore}
                      </span>
                      <p className="text-xs text-slate-500">{pct}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full progress-bar ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {caseData.casePearls && caseData.casePearls.length > 0 && (
            <div className="glass-card rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-amber-400 mb-3">Key Takeaways for This Case</p>
              <ul className="space-y-2">
                {caseData.casePearls.map((pearl, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 shrink-0">&#x25C6;</span>
                    <span>{pearl}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass-card rounded-xl p-5 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              How well did you do? (Spaced Review)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {([
                { r: "again" as Rating, label: "Again", sub: "< 1 day", cls: "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30" },
                { r: "hard" as Rating, label: "Hard", sub: "soon", cls: "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30" },
                { r: "good" as Rating, label: "Good", sub: "normal", cls: "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30" },
                { r: "easy" as Rating, label: "Easy", sub: "later", cls: "bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30" },
              ] as const).map((btn) => (
                <button
                  key={btn.r}
                  disabled={srsRated !== null}
                  onClick={() => {
                    const updated = rateCase(caseData.id, btn.r);
                    setSrsRated({ rating: btn.r, intervalDays: updated.interval });
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btn.cls}`}
                >
                  <div>{btn.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{btn.sub}</div>
                </button>
              ))}
            </div>
            {srsRated && (
              <p className="text-xs text-emerald-400 mt-3 text-center">
                Scheduled for review in {srsRated.intervalDays} day{srsRated.intervalDays === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">
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
                setShowTeaching(false);
                setShowPitfalls(false);
                setImageLoadError(false);
                setSrsRated(null);
                setStartTime(Date.now());
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
