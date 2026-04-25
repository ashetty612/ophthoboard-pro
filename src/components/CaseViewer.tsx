"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { CaseData, UserAnswer, CaseAttempt } from "@/lib/types";
import {
  scoreAnswer,
  scorePhotoDescription,
  calculateGrade,
  getGradeColor,
  getGradeBgColor,
} from "@/lib/scoring";
import { saveAttempt, toggleBookmark, isBookmarked, getAttemptsForCase, updateStudyStreak } from "@/lib/storage";
import { pushAttemptToCloud, pushBookmarkToggle, pushStreakToCloud } from "@/lib/supabase/sync";
import { getPearlsForCase, QUESTION_TYPE_INFO, getQuestionInfo } from "@/lib/pearls";
import AIPearlsCard from "./AIPearlsCard";
import { getFatalFlawsForCase } from "@/lib/fatal-flaws";
import { rateCase, type Rating } from "@/lib/srs";
import { easeOut, easeSpring, fadeUp, staggerMed } from "@/lib/motion";
import AudioNarrator from "@/components/AudioNarrator";

interface CaseViewerProps {
  caseData: CaseData;
  onBack: () => void;
}

type Phase = "intro" | "photo" | "questions" | "results";

// ---- Animated score ring (0 -> target) ----
function ScoreRing({ percent, color, reduce }: { percent: number; color: string; reduce: boolean }) {
  const CIRC = 327; // 2πr where r=52
  const target = (percent / 100) * CIRC;
  return (
    <motion.circle
      cx="60"
      cy="60"
      r="52"
      fill="none"
      stroke={color}
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray={`${target} ${CIRC}`}
      initial={reduce ? { strokeDasharray: `${target} ${CIRC}` } : { strokeDasharray: `0 ${CIRC}` }}
      animate={{ strokeDasharray: `${target} ${CIRC}` }}
      transition={{ duration: reduce ? 0 : 1.4, ease: easeOut, delay: reduce ? 0 : 0.2 }}
    />
  );
}

// ---- Segmented progress bar for questions phase ----
function QuestionProgress({ total, current, showAnswer }: { total: number; current: number; showAnswer: boolean }) {
  return (
    <div className="flex gap-1 px-4 py-2 max-w-4xl mx-auto">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current || (i === current && showAnswer);
        const active = i === current && !showAnswer;
        return (
          <div key={i} className="relative flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400"
              initial={false}
              animate={{ width: done ? "100%" : active ? "35%" : "0%" }}
              transition={{ duration: 0.5, ease: easeOut }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Auto-save key — keyed by case id so each case gets its own draft
// without colliding. Drafts live in localStorage and are restored on
// reopen so an accidental tab-close doesn't lose progress.
const draftKey = (caseId: string) => `cvb.case.draft.v1.${caseId}`;

interface CaseDraft {
  photoAnswer?: string;
  userAnswers?: string[];
  currentQuestion?: number;
  savedAt: string;
}

function loadDraft(caseId: string): CaseDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(caseId));
    if (!raw) return null;
    return JSON.parse(raw) as CaseDraft;
  } catch {
    return null;
  }
}

function clearDraft(caseId: string) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(draftKey(caseId)); } catch { /* ignore */ }
}

export default function CaseViewer({ caseData, onBack }: CaseViewerProps) {
  const reduce = useReducedMotion() ?? false;
  // Try to rehydrate any in-progress draft for this case so an accidental
  // tab-close / reload doesn't wipe what the candidate typed.
  const draft = useMemo(() => loadDraft(caseData.id), [caseData.id]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(draft?.currentQuestion ?? 0);
  const [userAnswers, setUserAnswers] = useState<string[]>(() => {
    const blank = new Array(caseData.questions.length).fill("");
    if (draft?.userAnswers && Array.isArray(draft.userAnswers)) {
      // Pad/truncate to match the current case length (defensive against
      // schema drift between when the draft was saved and now).
      for (let i = 0; i < blank.length; i++) blank[i] = draft.userAnswers[i] || "";
    }
    return blank;
  });
  const [photoAnswer, setPhotoAnswer] = useState(draft?.photoAnswer || "");
  const [scoredAnswers, setScoredAnswers] = useState<UserAnswer[]>([]);
  const [photoScore, setPhotoScore] = useState<{
    score: number;
    maxScore: number;
    feedback: string;
  } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkPulse, setBookmarkPulse] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [showImage, setShowImage] = useState(true);
  const [showTeaching, setShowTeaching] = useState(false);
  const [showPitfalls, setShowPitfalls] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [srsRated, setSrsRated] = useState<{ rating: Rating; intervalDays: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const previousAttempts = useMemo(() => getAttemptsForCase(caseData.id), [caseData.id]);
  // Don't pass casePearls into retrieval — they're rendered separately
  // in their own amber block below. We just want the smart-retrieved
  // pearls here (subspecialty knowledge + strategy tips).
  const pearls = useMemo(
    () =>
      getPearlsForCase({
        subspecialty: caseData.subspecialty,
        title: caseData.title,
        diagnosisTitle: caseData.diagnosisTitle,
        presentation: caseData.presentation,
        photoDescription: caseData.photoDescription,
      }),
    [
      caseData.subspecialty,
      caseData.title,
      caseData.diagnosisTitle,
      caseData.presentation,
      caseData.photoDescription,
    ]
  );
  const fatalFlaws = useMemo(
    () =>
      getFatalFlawsForCase(
        caseData.diagnosisTitle || "",
        caseData.title || "",
        caseData.questions?.flatMap((q) => q.scoringKeywords || []) ?? []
      ),
    [caseData.diagnosisTitle, caseData.title, caseData.questions]
  );

  useEffect(() => {
    setBookmarked(isBookmarked(caseData.id));
  }, [caseData.id]);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, [phase, currentQuestion]);

  // Autosave draft to localStorage as the user types. Throttled — saves
  // 350ms after the last keystroke. Skipped while showing the model
  // answer (no point auto-saving a completed question's text).
  useEffect(() => {
    if (phase === "results" || phase === "intro") return;
    const t = setTimeout(() => {
      const draft: CaseDraft = {
        photoAnswer,
        userAnswers,
        currentQuestion,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(draftKey(caseData.id), JSON.stringify(draft));
      } catch { /* quota exceeded — ignore */ }
    }, 350);
    return () => clearTimeout(t);
  }, [photoAnswer, userAnswers, currentQuestion, phase, caseData.id]);

  // Clear draft once the case is finished (results phase = case complete).
  useEffect(() => {
    if (phase === "results") clearDraft(caseData.id);
  }, [phase, caseData.id]);

  // Show a one-time toast when we restored a draft so the user knows
  // their previous progress was loaded back in.
  const [showRestoredHint, setShowRestoredHint] = useState(!!draft);
  useEffect(() => {
    if (!showRestoredHint) return;
    const t = setTimeout(() => setShowRestoredHint(false), 4000);
    return () => clearTimeout(t);
  }, [showRestoredHint]);

  const hasImage = !!(caseData.imageFile || caseData.externalImageUrl);
  const hasPhotoDescription = !!(caseData.photoDescription && caseData.photoDescription.trim());

  const handleStartCase = () => {
    if (hasImage && hasPhotoDescription) setPhase("photo");
    else setPhase("questions");
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

  const handleSubmitAnswer = () => setShowAnswer(true);

  /**
   * Go BACK to the previous question without exiting the case.
   * Preserves the user's typed answer + scoring state for that question.
   * If we're on Q1, it bounces back to the photo phase.
   */
  const handlePreviousQuestion = () => {
    setShowAnswer(false);
    setShowTeaching(false);
    setShowPitfalls(false);
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      // Bounce back to the photo phase so the user can re-read the
      // image / re-edit their description without restarting.
      setPhase("photo");
    }
  };

  const handleNextQuestion = () => {
    setShowAnswer(false);
    setShowTeaching(false);
    setShowPitfalls(false);
    if (currentQuestion < caseData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSubmitting(true);
      // Brief pulse before results slide in
      window.setTimeout(() => {
        const scored = caseData.questions.map((q, i) => scoreAnswer(q, userAnswers[i]));
        setScoredAnswers(scored);
        const totalScore =
          scored.reduce((sum, a) => sum + a.score, 0) + (photoScore?.score || 0);
        const maxPossible =
          scored.reduce((sum, a) => sum + a.maxScore, 0) + (photoScore?.maxScore || 0);
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
        // Fire-and-forget cloud sync. No-op when not signed in.
        void pushAttemptToCloud(attempt);
        updateStudyStreak();
        void pushStreakToCloud();
        setPhase("results");
        setSubmitting(false);
      }, reduce ? 0 : 450);
    }
  };

  const handleToggleBookmark = () => {
    const newState = toggleBookmark(caseData.id);
    setBookmarked(newState);
    setBookmarkPulse((n) => n + 1);
    void pushBookmarkToggle(caseData.id, newState);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Clinical image with cinematic materialization, vignette, and zoom-on-click
  const renderClinicalImage = (
    maxWidth?: string,
    opts?: { float?: boolean; cinematic?: boolean; layoutId?: string }
  ) => {
    const src = caseData.imageFile
      ? `/images/${caseData.imageFile}`
      : caseData.externalImageUrl;
    if (!src) return null;

    const isExternal = !caseData.imageFile;
    if (isExternal && imageLoadError) {
      return (
        <div className={`relative rounded-xl overflow-hidden bg-black/50 ${maxWidth || "max-w-lg"} mx-auto`}>
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
        </div>
      );
    }

    const float = opts?.float && !reduce;
    const cinematic = opts?.cinematic;
    const layoutId = opts?.layoutId;

    return (
      <motion.div
        layoutId={layoutId}
        className={`relative rounded-xl overflow-hidden bg-black/60 ${maxWidth || "max-w-lg"} mx-auto cursor-zoom-in group`}
        onClick={() => setImageZoomed(true)}
        initial={cinematic ? { opacity: 0, scale: 0.92 } : false}
        animate={
          float
            ? { opacity: 1, scale: 1, y: [0, -4, 0] }
            : cinematic
            ? { opacity: 1, scale: 1 }
            : undefined
        }
        transition={
          float
            ? { opacity: { duration: 0.4 }, scale: { duration: 0.4 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
            : cinematic
            ? { duration: reduce ? 0 : 0.8, ease: easeOut, delay: reduce ? 0 : 0.35 }
            : undefined
        }
        whileHover={reduce ? undefined : { scale: 1.01 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Clinical photograph"
          className="w-full h-auto"
          onError={isExternal ? () => setImageLoadError(true) : undefined}
        />
        {cinematic && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(4,121,98,0.18) 85%, rgba(2,30,30,0.55) 100%)",
              boxShadow: "inset 0 0 60px rgba(4,121,98,0.25)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.55 }}
          />
        )}
        {isExternal && caseData.imageAttribution && (
          <p className="text-[10px] text-slate-500 text-center mt-1 italic">{caseData.imageAttribution}</p>
        )}
      </motion.div>
    );
  };

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

        <motion.button
          onClick={handleToggleBookmark}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark this case"}
          aria-pressed={bookmarked}
          whileTap={reduce ? undefined : { scale: 0.85 }}
          className={`p-2.5 min-h-[44px] min-w-[44px] rounded-lg transition-colors flex items-center justify-center ${
            bookmarked ? "text-amber-400 bg-amber-400/10" : "text-slate-400 hover:text-amber-400"
          }`}
        >
          <motion.svg
            key={bookmarkPulse}
            initial={reduce ? false : { scale: 1 }}
            animate={reduce ? undefined : { scale: [1, 1.35, 1] }}
            transition={{ duration: 0.35, ease: easeSpring }}
            className="w-5 h-5"
            fill={bookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </motion.svg>
        </motion.button>
      </div>

      {phase === "questions" && (
        <QuestionProgress
          total={caseData.questions.length}
          current={currentQuestion}
          showAnswer={showAnswer}
        />
      )}
    </div>
  );

  // INTRO PHASE — cinematic slit-lamp opening
  if (phase === "intro") {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <motion.div
          className="max-w-4xl mx-auto px-4 py-8"
          initial="hidden"
          animate="show"
          variants={staggerMed}
        >
          {showRestoredHint && draft && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            >
              <span>
                <span className="font-semibold">Draft restored.</span> Picked up where you left off
                {draft.savedAt
                  ? ` (saved ${new Date(draft.savedAt).toLocaleString()})`
                  : ""}.
              </span>
              <button
                onClick={() => {
                  clearDraft(caseData.id);
                  setUserAnswers(new Array(caseData.questions.length).fill(""));
                  setPhotoAnswer("");
                  setCurrentQuestion(0);
                  setShowRestoredHint(false);
                }}
                className="text-xs underline text-amber-200 hover:text-white"
              >
                Start fresh
              </button>
            </motion.div>
          )}
          <div className="glass-card rounded-2xl p-8">
            {/* Subspecialty ribbon — drops in from top */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={reduce ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeOut }}
            >
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
            </motion.div>

            {/* Title — fade + rise */}
            <motion.h2
              className="text-3xl font-bold text-white mb-4"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: reduce ? 0 : 0.15 }}
            >
              {caseData.title}
            </motion.h2>

            {/* Presentation */}
            <motion.div
              className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: easeOut, delay: reduce ? 0 : 0.25 }}
            >
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Patient Presentation
              </h3>
              <p className="text-lg text-white">{caseData.presentation}</p>
            </motion.div>

            {/* Clinical image — the star, materializes with vignette */}
            {hasImage && (
              <div className="mb-6">
                <motion.h3
                  className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: reduce ? 0 : 0.35 }}
                >
                  Clinical Image
                </motion.h3>
                {renderClinicalImage(undefined, { cinematic: true, layoutId: "clinical-image" })}
              </div>
            )}

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 mb-6">
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
            </motion.div>

            {caseData.casePearls && caseData.casePearls.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4"
              >
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
              </motion.div>
            )}

            {caseData.highYieldFacts && caseData.highYieldFacts.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-4"
              >
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
              </motion.div>
            )}

            {caseData.relatedConditions && caseData.relatedConditions.length > 0 && (
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs text-slate-500 mr-1">Related:</span>
                {caseData.relatedConditions.map((cond, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                    {cond}
                  </span>
                ))}
              </motion.div>
            )}

            {pearls.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Topic Pearls (retrieved)
                  </p>
                  <span className="text-[10px] text-slate-600">{pearls.length} matched</span>
                </div>
                <ul className="space-y-2">
                  {pearls.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <span className="text-primary-400/70 mt-1 shrink-0" aria-hidden>◇</span>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-0.5">
                          {p.category}
                        </p>
                        <p className="leading-relaxed">{p.pearl}</p>
                        {p.examTip && (
                          <p className="text-xs text-slate-500 italic mt-1">Exam tip: {p.examTip}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* AI-pearls — generate fresh pearls live for this exact case
                using Lensley. Shown only after the static topic pearls so
                the user always sees the curated set first. */}
            <motion.div variants={fadeUp} className="mb-6">
              <AIPearlsCard
                caseTitle={caseData.title}
                diagnosis={caseData.diagnosisTitle || caseData.title}
                presentation={caseData.presentation}
                subspecialty={caseData.subspecialty}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="mb-6">
              <AudioNarrator
                title={caseData.title}
                presentation={caseData.presentation}
                photoDescription={caseData.photoDescription}
              />
            </motion.div>

            {/* CTA — gentle pulse glow */}
            <motion.button
              onClick={handleStartCase}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-lg transition-colors relative overflow-hidden"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={
                reduce
                  ? { opacity: 1, y: 0 }
                  : {
                      opacity: 1,
                      y: 0,
                      boxShadow: [
                        "0 10px 25px -5px rgba(4,121,98,0.25)",
                        "0 10px 35px -5px rgba(4,121,98,0.55)",
                        "0 10px 25px -5px rgba(4,121,98,0.25)",
                      ],
                    }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.5, delay: 0.7 },
                      y: { duration: 0.5, delay: 0.7 },
                      boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                    }
              }
              whileHover={reduce ? undefined : { scale: 1.015 }}
              whileTap={reduce ? undefined : { scale: 0.985 }}
            >
              Begin Case
            </motion.button>
          </div>
        </motion.div>

        {/* Zoom dialog for the clinical image */}
        <ImageZoomOverlay
          open={imageZoomed}
          onClose={() => setImageZoomed(false)}
          layoutId="clinical-image"
          src={caseData.imageFile ? `/images/${caseData.imageFile}` : caseData.externalImageUrl || ""}
          reduce={reduce}
        />
      </div>
    );
  }

  // PHOTO DESCRIPTION PHASE
  if (phase === "photo") {
    return (
      <div className="min-h-screen">
        {renderHeader()}
        <motion.div
          className="max-w-4xl mx-auto px-4 py-8"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <motion.div
                className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center"
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.35, ease: easeSpring }}
              >
                <span className="text-primary-400 text-sm font-bold">0</span>
              </motion.div>
              <h3 className="text-xl font-bold text-white">Describe this clinical photograph</h3>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              As in the oral exam, start by systematically describing the clinical image. Include: imaging modality, laterality, anatomical structures, and all abnormal findings.
            </p>

            <div className="mb-6">
              {renderClinicalImage("max-w-2xl", { float: true, layoutId: "clinical-image" })}
            </div>

            <textarea
              ref={textareaRef}
              value={photoAnswer}
              onChange={(e) => setPhotoAnswer(e.target.value)}
              placeholder="Describe what you see in this image..."
              rows={5}
              disabled={showAnswer}
              className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 focus:shadow-[0_0_0_4px_rgba(4,121,98,0.15)] transition-all outline-none"
            />

            {!showAnswer ? (
              <motion.button
                onClick={handleSubmitPhotoDescription}
                disabled={!photoAnswer.trim()}
                whileHover={reduce ? undefined : { scale: 1.01 }}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                className="mt-4 w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors relative overflow-hidden group"
              >
                <span className="relative z-10">Submit Description</span>
                {!reduce && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  />
                )}
              </motion.button>
            ) : (
              <motion.div
                className="mt-6"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easeOut }}
              >
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
              </motion.div>
            )}
          </div>
        </motion.div>

        <ImageZoomOverlay
          open={imageZoomed}
          onClose={() => setImageZoomed(false)}
          layoutId="clinical-image"
          src={caseData.imageFile ? `/images/${caseData.imageFile}` : caseData.externalImageUrl || ""}
          reduce={reduce}
        />
      </div>
    );
  }

  // QUESTIONS PHASE
  if (phase === "questions") {
    const question = caseData.questions[currentQuestion];
    // Infer question type from the actual question text (not its slot
    // number). Many cases have a "Describe what you see" stem at slot 1
    // rather than the canonical Q1=differential — using the inferred
    // category gives the right name/description/tip per question.
    const questionInfo = getQuestionInfo(question.question);
    const teaching = question.teaching;
    const currentLen = userAnswers[currentQuestion].length;

    return (
      <LayoutGroup>
        <div className="min-h-screen">
          {renderHeader()}
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Sticky case context — pinned at the top of every question
                so the candidate can re-read the presentation, the photo
                description, and toggle the image without losing place.
                Collapsible (click to fold) to reclaim screen space. */}
            <div className="mb-4 rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
              <button
                onClick={() => setShowImage(!showImage)}
                className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-800/40 transition-colors"
                aria-expanded={showImage}
                aria-controls="case-context-body"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-300/70">
                    Case context
                  </p>
                  <p className="text-sm text-slate-200 truncate">
                    {caseData.diagnosisTitle || caseData.title}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showImage ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence initial={false}>
                {showImage && (
                  <motion.div
                    id="case-context-body"
                    initial={reduce ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: easeOut }}
                    className="overflow-hidden border-t border-slate-700/40"
                  >
                    <div className="px-4 py-3 space-y-3">
                      {caseData.presentation && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1">
                            Presentation
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">{caseData.presentation}</p>
                        </div>
                      )}
                      {caseData.photoDescription && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-1">
                            Photo findings
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">{caseData.photoDescription}</p>
                        </div>
                      )}
                      {hasImage && (
                        <div>{renderClinicalImage("max-w-md", { layoutId: "clinical-image" })}</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                className="glass-card rounded-2xl p-8"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0"
                    initial={reduce ? false : { scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  >
                    <span className="text-primary-400 font-bold">{question.number}</span>
                  </motion.div>
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
                  className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 focus:shadow-[0_0_0_4px_rgba(4,121,98,0.15)] transition-all outline-none"
                />

                <div className="flex items-center justify-between mt-2 mb-4">
                  <p className="text-xs text-slate-500">
                    Question {currentQuestion + 1} of {caseData.questions.length}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-500 tabular-nums">{currentLen} chars</p>
                    <p className="text-xs text-slate-500">
                      {formatTime(Math.round((Date.now() - startTime) / 1000))} elapsed
                    </p>
                  </div>
                </div>

                {!showAnswer ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handlePreviousQuestion}
                      className="py-3 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-2"
                      title={currentQuestion === 0 ? "Back to image" : "Previous question (no progress lost)"}
                      aria-label="Go to previous question"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-sm">{currentQuestion === 0 ? "Image" : "Back"}</span>
                    </button>
                    <motion.button
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswers[currentQuestion].trim() || submitting}
                      whileHover={reduce ? undefined : { scale: 1.01 }}
                      whileTap={reduce ? undefined : { scale: 0.99 }}
                      className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors"
                    >
                      {submitting ? (
                        <motion.span
                          animate={reduce ? undefined : { opacity: [1, 0.5, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          Scoring...
                        </motion.span>
                      ) : (
                        "Submit Answer"
                      )}
                    </motion.button>
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="py-3 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
                    >
                      Skip / Show Answer
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                  >
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

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mb-4">
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Model Answer</p>
                      <div className="text-sm text-emerald-200/90 whitespace-pre-line">{question.answer}</div>
                    </div>

                    {teaching?.perfectAnswer && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">What a Perfect Answer Looks Like</p>
                        <p className="text-sm text-emerald-200/70">{teaching.perfectAnswer}</p>
                      </div>
                    )}

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
                        <AnimatePresence initial={false}>
                          {showPitfalls && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: easeOut }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                                <ul className="space-y-2">
                                  {teaching.commonPitfalls.map((pitfall, i) => (
                                    <li key={i} className="text-xs text-amber-200/70 flex items-start gap-2">
                                      <span className="text-amber-400 mt-0.5">&#x26A0;</span>
                                      <span>{pitfall}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

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
                        <AnimatePresence initial={false}>
                          {showTeaching && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: easeOut }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
                                <ul className="space-y-2">
                                  {teaching.learningPoints.map((point, i) => (
                                    <li key={i} className="text-xs text-violet-200/70 flex items-start gap-2">
                                      <span className="text-violet-400 mt-0.5">&#x2022;</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {pearls.length > 0 && (
                      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Teaching Pearl</p>
                        <p className="text-sm text-slate-400">{pearls[currentQuestion % pearls.length].pearl}</p>
                        {pearls[currentQuestion % pearls.length].examTip && (
                          <p className="text-xs text-slate-500 mt-2 italic">Exam Tip: {pearls[currentQuestion % pearls.length].examTip}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handlePreviousQuestion}
                        className="py-3 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-2"
                        title={currentQuestion === 0 ? "Back to image" : "Previous question (no progress lost)"}
                        aria-label="Go to previous question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm">{currentQuestion === 0 ? "Image" : "Back"}</span>
                      </button>
                      <motion.button
                        onClick={handleNextQuestion}
                        whileHover={reduce ? undefined : { scale: 1.01 }}
                        whileTap={reduce ? undefined : { scale: 0.99 }}
                        className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
                      >
                        {submitting
                          ? "Scoring..."
                          : currentQuestion < caseData.questions.length - 1
                          ? "Next Question"
                          : "See Results"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <ImageZoomOverlay
            open={imageZoomed}
            onClose={() => setImageZoomed(false)}
            layoutId="clinical-image"
            src={caseData.imageFile ? `/images/${caseData.imageFile}` : caseData.externalImageUrl || ""}
            reduce={reduce}
          />
        </div>
      </LayoutGroup>
    );
  }

  // RESULTS PHASE
  if (phase === "results") {
    const totalScore = scoredAnswers.reduce((sum, a) => sum + a.score, 0) + (photoScore?.score || 0);
    const maxPossible = scoredAnswers.reduce((sum, a) => sum + a.maxScore, 0) + (photoScore?.maxScore || 0);
    const percentageScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    const grade = calculateGrade(percentageScore);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const ringColor = percentageScore >= 70 ? "#10b981" : percentageScore >= 50 ? "#f59e0b" : "#f43f5e";

    const resultsStagger: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: reduce ? 0 : 0.15 } },
    };

    return (
      <div className="min-h-screen">
        {renderHeader()}
        <motion.div
          className="max-w-4xl mx-auto px-4 py-8"
          initial="hidden"
          animate="show"
          variants={resultsStagger}
        >
          <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8 text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Case Complete</h2>
            {caseData.diagnosisTitle && (
              <p className="text-lg text-primary-400 font-medium mb-4">Diagnosis: {caseData.diagnosisTitle}</p>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8 text-center mb-8">
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#334155" strokeWidth="8" />
                <ScoreRing percent={percentageScore} color={ringColor} reduce={reduce} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold text-white"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: reduce ? 0 : 1.3 }}
                >
                  {percentageScore}%
                </motion.span>
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
                    <p className={`text-lg font-bold ${domain.color}`}>{dPct}%</p>
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
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-white">Question Breakdown</h3>

            {photoScore && (
              <motion.div variants={fadeUp} className="glass-card rounded-xl p-5">
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
              </motion.div>
            )}

            {scoredAnswers.map((answer, i) => {
              const pct = Math.round((answer.score / answer.maxScore) * 100);
              const q = caseData.questions[i];
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="glass-card rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pct >= 70 ? "bg-emerald-500/20" : pct >= 50 ? "bg-amber-500/20" : "bg-rose-500/20"}`}>
                        <span className={`text-sm font-bold ${pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>{q.number}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{getQuestionInfo(q.question).name}</p>
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
                    <motion.div
                      className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                      initial={reduce ? { width: `${pct}%` } : { width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: reduce ? 0 : 0.9, ease: easeOut, delay: reduce ? 0 : 0.3 + i * 0.05 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Fatal flaws — dramatic rose-tinted slide-in, arrives LAST */}
          {fatalFlaws.length > 0 && (
            <motion.div
              className="mb-8 space-y-3"
              initial={reduce ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: easeOut, delay: reduce ? 0 : 0.6 + scoredAnswers.length * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <motion.span
                  className="text-rose-400 text-lg"
                  aria-hidden
                  animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  ⚠
                </motion.span>
                <h3 className="text-sm font-bold text-rose-300 uppercase tracking-[0.18em]">
                  Fatal Flaws — Must Not Miss
                </h3>
              </div>
              {fatalFlaws.map((flaw, i) => (
                <motion.div
                  key={flaw.id}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5 text-left shadow-[0_0_30px_-10px_rgba(244,63,94,0.4)]"
                  initial={reduce ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: easeOut, delay: reduce ? 0 : 0.75 + i * 0.12 }}
                >
                  <p className="text-xs uppercase tracking-wider text-rose-300/80 mb-1">{flaw.subspecialty}</p>
                  <p className="text-base font-semibold text-rose-100 mb-2">{flaw.mustNotMiss}</p>
                  <p className="text-sm text-slate-300 mb-3"><span className="text-slate-400">Scenario: </span>{flaw.scenario}</p>
                  <p className="text-sm text-slate-300 mb-3"><span className="text-slate-400">Why: </span>{flaw.whyCritical}</p>
                  <div className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-3 mb-3">
                    <p className="text-[11px] text-amber-400 uppercase tracking-wider mb-1 font-semibold">Say exactly</p>
                    <p className="text-sm text-amber-100 italic leading-relaxed">{flaw.safetyNetPhrase}</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-300 font-semibold">Immediate action: </span>{flaw.immediateAction}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {caseData.casePearls && caseData.casePearls.length > 0 && (
            <motion.div variants={fadeUp} className="glass-card rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-amber-400 mb-3">Key Takeaways for This Case</p>
              <ul className="space-y-2">
                {caseData.casePearls.map((pearl, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 shrink-0">&#x25C6;</span>
                    <span>{pearl}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="glass-card rounded-xl p-5 mb-4">
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
                <motion.button
                  key={btn.r}
                  disabled={srsRated !== null}
                  whileHover={reduce || srsRated !== null ? undefined : { y: -2 }}
                  whileTap={reduce || srsRated !== null ? undefined : { scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  onClick={() => {
                    const updated = rateCase(caseData.id, btn.r);
                    setSrsRated({ rating: btn.r, intervalDays: updated.interval });
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btn.cls}`}
                >
                  <div>{btn.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{btn.sub}</div>
                </motion.button>
              ))}
            </div>
            {srsRated && (
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-400 mt-3 text-center"
              >
                Scheduled for review in {srsRated.intervalDays} day{srsRated.intervalDays === 1 ? "" : "s"}.
              </motion.p>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-4">
            <motion.button
              onClick={onBack}
              whileHover={reduce ? undefined : { scale: 1.01 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Back to Cases
            </motion.button>
            <motion.button
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
              whileHover={reduce ? undefined : { scale: 1.01 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
            >
              Retry Case
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return null;
}

// ---- Click-to-zoom overlay (uses framer-motion LayoutGroup shared id) ----
function ImageZoomOverlay({
  open,
  onClose,
  layoutId,
  src,
  reduce,
}: {
  open: boolean;
  onClose: () => void;
  layoutId: string;
  src: string;
  reduce: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Clinical image enlarged"
        >
          <motion.img
            layoutId={layoutId}
            src={src}
            alt="Clinical photograph enlarged"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            transition={{ duration: reduce ? 0 : 0.4, ease: easeOut }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
