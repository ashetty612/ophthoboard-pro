"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CasesDatabase, CaseData, CaseAttempt } from "@/lib/types";
import { scoreAnswer, scorePhotoDescription } from "@/lib/scoring";
import { saveAttempt } from "@/lib/storage";
import {
  ROOMS,
  buildRoomCases,
  computeVerdict,
  pctToAxis,
  weakestAxis,
  weakestRoom,
  type RoomCases,
  type RoomId,
  type RoomPairing,
  type RoomScore,
} from "@/lib/paired-exam";

interface PairedTopicExamProps {
  database: CasesDatabase;
  onBack: () => void;
  onSelectCase: (c: CaseData) => void;
}

type Phase = "setup" | "handoff" | "active" | "break" | "results";
type ExamMode = "single" | "full";

const AXIS_LABELS: Record<"data" | "diagnosis" | "management", string> = {
  data: "Data Acquisition",
  diagnosis: "Diagnosis",
  management: "Management",
};

const AXIS_QUESTIONS: Record<"data" | "diagnosis" | "management", number[]> = {
  data: [2, 3, 4],
  diagnosis: [1],
  management: [5, 6],
};

function formatClock(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function scoreRoom(
  roomId: RoomId,
  label: string,
  attempts: CaseAttempt[]
): RoomScore {
  // Average % per axis across all cases in this room, then map to 0-3.
  const axisPct = (axisKey: "data" | "diagnosis" | "management") => {
    const qs = AXIS_QUESTIONS[axisKey];
    let earned = 0;
    let possible = 0;
    attempts.forEach((a) => {
      a.answers
        .filter((ua) => qs.includes(ua.questionNumber))
        .forEach((ua) => {
          earned += ua.score;
          possible += ua.maxScore;
        });
    });
    return possible > 0 ? (earned / possible) * 100 : 0;
  };

  const axis = {
    data: pctToAxis(axisPct("data")),
    diagnosis: pctToAxis(axisPct("diagnosis")),
    management: pctToAxis(axisPct("management")),
  };
  return {
    roomId,
    label,
    axis,
    total: axis.data + axis.diagnosis + axis.management,
  };
}

export default function PairedTopicExam({
  database,
  onBack,
  onSelectCase,
}: PairedTopicExamProps) {
  // ---- All hooks declared at the top (Rules of Hooks) ----
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<ExamMode>("single");
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId>("room1");
  const [customA, setCustomA] = useState<string>("Anterior Segment");
  const [customB, setCustomB] = useState<string>("Optics");
  const [minutesPerCase, setMinutesPerCase] = useState<number>(3.5);

  // Queue of rooms for this session (1 room or all 3 for "full")
  const [roomQueue, setRoomQueue] = useState<RoomCases[]>([]);
  const [roomIdx, setRoomIdx] = useState(0);
  const [caseIdx, setCaseIdx] = useState(0); // 0..13 within current room (phaseA 0-6, phaseB 7-13)

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [photoAnswers, setPhotoAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(-1);

  const [caseTimeRemaining, setCaseTimeRemaining] = useState<number>(0);
  const [breakRemaining, setBreakRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  // Completed attempts, grouped by room index
  const [attemptsByRoom, setAttemptsByRoom] = useState<CaseAttempt[][]>([]);
  const [handoffShown, setHandoffShown] = useState(false);

  const caseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const perCaseSeconds = Math.round(minutesPerCase * 60);

  // Available subspecialty names for Custom option
  const subspecialtyNames = useMemo(
    () => database.subspecialties.map((s) => s.name),
    [database]
  );

  // Current room / case helpers
  const currentRoom: RoomCases | null = roomQueue[roomIdx] ?? null;
  const allCases: CaseData[] = useMemo(
    () => (currentRoom ? [...currentRoom.phaseA, ...currentRoom.phaseB] : []),
    [currentRoom]
  );
  const currentCase: CaseData | null = allCases[caseIdx] ?? null;
  const inPhaseB = currentRoom ? caseIdx >= currentRoom.phaseA.length : false;
  const currentExaminerLabel = currentRoom
    ? inPhaseB
      ? currentRoom.room.subspecialtyB
      : currentRoom.room.subspecialtyA
    : "";

  // Per-case timer
  useEffect(() => {
    if (phase !== "active" || isPaused) return;
    caseTimerRef.current = setInterval(() => {
      setCaseTimeRemaining((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => {
      if (caseTimerRef.current) clearInterval(caseTimerRef.current);
    };
  }, [phase, isPaused, caseIdx, roomIdx]);

  // Break timer
  useEffect(() => {
    if (phase !== "break") return;
    breakTimerRef.current = setInterval(() => {
      setBreakRemaining((t) => {
        if (t <= 1) {
          if (breakTimerRef.current) clearInterval(breakTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, [phase]);

  // Focus textarea on case/question transition
  useEffect(() => {
    if (phase === "active" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase, caseIdx, currentQuestionIdx]);

  // Hand-off: pause the exam briefly when moving from examiner A → B
  useEffect(() => {
    if (phase !== "active" || !currentRoom) return;
    const phaseALen = currentRoom.phaseA.length;
    if (caseIdx === phaseALen && !handoffShown) {
      setHandoffShown(true);
      setPhase("handoff");
    }
  }, [phase, caseIdx, currentRoom, handoffShown]);

  const scoreCurrentCase = useCallback(
    (c: CaseData): CaseAttempt => {
      const caseAnswers = answers[c.id] || new Array(c.questions.length).fill("");
      const photoAnswer = photoAnswers[c.id] || "";
      const scored = c.questions.map((q, i) => scoreAnswer(q, caseAnswers[i] || ""));
      const photoResult = c.photoDescription
        ? scorePhotoDescription(photoAnswer, c.photoDescription)
        : null;
      const total =
        scored.reduce((s, a) => s + a.score, 0) + (photoResult?.score || 0);
      const max =
        scored.reduce((s, a) => s + a.maxScore, 0) + (photoResult?.maxScore || 0);
      const pct = max > 0 ? Math.round((total / max) * 100) : 0;
      const timeSpent = Math.max(0, perCaseSeconds - caseTimeRemaining);
      const attempt: CaseAttempt = {
        caseId: c.id,
        timestamp: new Date().toISOString(),
        photoDescriptionAnswer: photoAnswer,
        photoDescriptionScore: photoResult?.score || 0,
        answers: scored,
        totalScore: total,
        maxPossibleScore: max,
        percentageScore: pct,
        grade:
          pct >= 85
            ? "Above Expected"
            : pct >= 70
            ? "Expected"
            : pct >= 55
            ? "Borderline"
            : "Below Expected",
        timeSpentSeconds: timeSpent,
      };
      saveAttempt(attempt);
      return attempt;
    },
    [answers, photoAnswers, perCaseSeconds, caseTimeRemaining]
  );

  const finishRoomAndAdvance = useCallback(
    (roomAttempts: CaseAttempt[]) => {
      setAttemptsByRoom((prev) => {
        const copy = [...prev];
        copy[roomIdx] = roomAttempts;
        return copy;
      });
      const isLastRoom = roomIdx === roomQueue.length - 1;
      if (isLastRoom) {
        setPhase("results");
      } else {
        setBreakRemaining(5 * 60); // 5-min between-room break
        setPhase("break");
      }
    },
    [roomIdx, roomQueue.length]
  );

  const advanceCase = useCallback(
    (currentAttempts: CaseAttempt[]) => {
      if (!currentRoom) return;
      if (caseIdx < allCases.length - 1) {
        const nextIdx = caseIdx + 1;
        setCaseIdx(nextIdx);
        const nextCase = allCases[nextIdx];
        setCurrentQuestionIdx(nextCase?.imageFile ? -1 : 0);
        setCaseTimeRemaining(perCaseSeconds);
      } else {
        finishRoomAndAdvance(currentAttempts);
      }
    },
    [caseIdx, allCases, currentRoom, perCaseSeconds, finishRoomAndAdvance]
  );

  const handleNextQuestion = useCallback(() => {
    if (!currentCase || !currentRoom) return;
    if (currentQuestionIdx < currentCase.questions.length - 1) {
      setCurrentQuestionIdx((i) => i + 1);
      return;
    }
    // Last question — score this case and advance
    const attempt = scoreCurrentCase(currentCase);
    const roomIdxLocal = roomIdx;
    const next = [...(attemptsByRoom[roomIdxLocal] || []), attempt];
    setAttemptsByRoom((prev) => {
      const copy = [...prev];
      copy[roomIdxLocal] = next;
      return copy;
    });
    advanceCase(next);
  }, [
    currentCase,
    currentRoom,
    currentQuestionIdx,
    scoreCurrentCase,
    roomIdx,
    attemptsByRoom,
    advanceCase,
  ]);

  // Auto-advance when per-case timer hits 0 (ABO is strict on pace)
  useEffect(() => {
    if (phase !== "active") return;
    if (caseTimeRemaining === 0 && currentCase) {
      handleNextQuestion();
    }
  }, [caseTimeRemaining, phase, currentCase, handleNextQuestion]);

  // ---------- Setup helpers ----------
  const startExam = useCallback(() => {
    let queue: RoomCases[];
    if (mode === "full") {
      queue = ROOMS.map((r) => buildRoomCases(database, r));
    } else if (selectedRoomId === "custom") {
      const customRoom: RoomPairing = {
        id: "custom",
        label: "Custom Room",
        description: `${customA} + ${customB}`,
        subspecialtyA: customA,
        subspecialtyB: customB,
        casesPerExaminer: 7,
        durationMinutes: 50,
      };
      queue = [buildRoomCases(database, customRoom)];
    } else {
      const room = ROOMS.find((r) => r.id === selectedRoomId)!;
      queue = [buildRoomCases(database, room)];
    }

    setRoomQueue(queue);
    setRoomIdx(0);
    setCaseIdx(0);
    const firstCase = queue[0]?.phaseA[0] || queue[0]?.phaseB[0] || null;
    setCurrentQuestionIdx(firstCase?.imageFile ? -1 : 0);
    setCaseTimeRemaining(perCaseSeconds);
    setAnswers({});
    setPhotoAnswers({});
    setAttemptsByRoom(new Array(queue.length).fill(null).map(() => []));
    setHandoffShown(false);
    setPhase("active");
  }, [
    database,
    mode,
    selectedRoomId,
    customA,
    customB,
    perCaseSeconds,
  ]);

  const resumeFromHandoff = useCallback(() => {
    setPhase("active");
    const c = allCases[caseIdx];
    setCurrentQuestionIdx(c?.imageFile ? -1 : 0);
    setCaseTimeRemaining(perCaseSeconds);
  }, [allCases, caseIdx, perCaseSeconds]);

  const startNextRoom = useCallback(() => {
    const nextRoomIdx = roomIdx + 1;
    if (nextRoomIdx >= roomQueue.length) {
      setPhase("results");
      return;
    }
    const nextRoom = roomQueue[nextRoomIdx];
    const firstCase = nextRoom.phaseA[0] || nextRoom.phaseB[0] || null;
    setRoomIdx(nextRoomIdx);
    setCaseIdx(0);
    setCurrentQuestionIdx(firstCase?.imageFile ? -1 : 0);
    setCaseTimeRemaining(perCaseSeconds);
    setHandoffShown(false);
    setPhase("active");
  }, [roomIdx, roomQueue, perCaseSeconds]);

  const skipCase = () => {
    if (!currentCase) return;
    const attempt = scoreCurrentCase(currentCase);
    const next = [...(attemptsByRoom[roomIdx] || []), attempt];
    setAttemptsByRoom((prev) => {
      const copy = [...prev];
      copy[roomIdx] = next;
      return copy;
    });
    advanceCase(next);
  };

  const getAnswerText = () => {
    if (!currentCase) return "";
    if (currentQuestionIdx === -1) return photoAnswers[currentCase.id] || "";
    return (answers[currentCase.id] || [])[currentQuestionIdx] || "";
  };

  const setAnswerText = (v: string) => {
    if (!currentCase) return;
    if (currentQuestionIdx === -1) {
      setPhotoAnswers((prev) => ({ ...prev, [currentCase.id]: v }));
    } else {
      setAnswers((prev) => {
        const existing =
          prev[currentCase.id] || new Array(currentCase.questions.length).fill("");
        const updated = [...existing];
        updated[currentQuestionIdx] = v;
        return { ...prev, [currentCase.id]: updated };
      });
    }
  };

  // =================== RENDER ===================

  if (phase === "setup") {
    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Home</span>
            </button>
            <h1 className="text-lg font-bold text-white">Paired-Topic Mock Exam</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                🏛️
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Authentic ABO Room Simulation</h2>
              <p className="text-slate-400 text-sm">
                2 examiners per room · 14 cases · 50 minutes · 3.5 min per case
              </p>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Session length</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("single")}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    mode === "single"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:text-white"
                  }`}
                >
                  Single Room (50 min)
                </button>
                <button
                  onClick={() => setMode("full")}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    mode === "full"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:text-white"
                  }`}
                >
                  Full Exam · 3 Rooms (~150 min)
                </button>
              </div>
            </div>

            {mode === "single" && (
              <div className="mb-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Choose a room</label>
                <div className="grid gap-2">
                  {ROOMS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoomId(r.id)}
                      className={`px-4 py-3 rounded-xl text-left transition-colors ${
                        selectedRoomId === r.id
                          ? "bg-emerald-600/20 text-emerald-200 border border-emerald-500/40"
                          : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white"
                      }`}
                    >
                      <div className="text-sm font-semibold">{r.label}</div>
                      <div className="text-xs opacity-80">{r.description}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedRoomId("custom")}
                    className={`px-4 py-3 rounded-xl text-left transition-colors ${
                      selectedRoomId === "custom"
                        ? "bg-emerald-600/20 text-emerald-200 border border-emerald-500/40"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-white"
                    }`}
                  >
                    <div className="text-sm font-semibold">Custom Pairing</div>
                    <div className="text-xs opacity-80">Pick any two subspecialties</div>
                  </button>
                </div>
              </div>
            )}

            {mode === "single" && selectedRoomId === "custom" && (
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Examiner A</label>
                  <select
                    value={customA}
                    onChange={(e) => setCustomA(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    {subspecialtyNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Examiner B</label>
                  <select
                    value={customB}
                    onChange={(e) => setCustomB(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    {subspecialtyNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Pace (min per case)</label>
              <div className="flex gap-2">
                {[3, 3.5, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMinutesPerCase(n)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                      minutesPerCase === n
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    {n} min
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Real ABO exam runs ~3.5 min per case. Adjust for practice mode.
              </p>
            </div>

            <button
              onClick={startExam}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-lg transition-all shadow-lg"
            >
              Enter the Exam Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "handoff" && currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-10 max-w-lg text-center animate-fade-in-up">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-[11px] text-emerald-400 uppercase tracking-[0.2em] mb-2">
            Examiner Hand-off
          </p>
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentRoom.room.subspecialtyA} → {currentRoom.room.subspecialtyB}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            The first examiner has finished. A new examiner is stepping in to continue
            the room with a fresh subspecialty focus.
          </p>
          <button
            onClick={resumeFromHandoff}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            Continue with {currentRoom.room.subspecialtyB}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "break") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-10 max-w-lg text-center animate-fade-in-up">
          <div className="text-5xl mb-4">☕</div>
          <p className="text-[11px] text-amber-400 uppercase tracking-[0.2em] mb-2">
            Between-room break
          </p>
          <h2 className="text-2xl font-bold text-white mb-2">
            Examiner is rotating. Take a breath.
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Next room: <span className="text-white">{roomQueue[roomIdx + 1]?.room.description}</span>
          </p>
          <div className="text-4xl font-mono font-bold text-white mb-6" role="timer" aria-live="polite">
            {formatClock(breakRemaining)}
          </div>
          <button
            onClick={startNextRoom}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
          >
            Skip break & continue
          </button>
        </div>
      </div>
    );
  }

  if (phase === "active" && currentRoom && currentCase) {
    const isPhoto = currentQuestionIdx === -1;
    const question =
      !isPhoto && currentQuestionIdx >= 0 ? currentCase.questions[currentQuestionIdx] : null;
    const urgent = caseTimeRemaining < 30;
    const totalCasesInRoom = currentRoom.phaseA.length + currentRoom.phaseB.length;

    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-emerald-400 uppercase tracking-wider truncate">
                  {currentRoom.room.label} · Examiner: {currentExaminerLabel}
                </p>
                <p className="text-xs text-slate-300 truncate">
                  Case {caseIdx + 1}/{totalCasesInRoom}: {currentCase.title}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsPaused((p) => !p)}
                  className={`text-xs px-3 py-2 min-h-[36px] rounded-md transition-colors ${
                    isPaused
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                  aria-label={isPaused ? "Resume timer" : "Pause timer"}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <span
                  className={`text-sm font-mono font-bold ${
                    urgent ? "text-rose-400 animate-pulse" : isPaused ? "text-amber-400" : "text-white"
                  }`}
                  role="timer"
                  aria-live="polite"
                >
                  {isPaused ? "PAUSED" : formatClock(caseTimeRemaining)}
                </span>
              </div>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full progress-bar ${urgent ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${(caseTimeRemaining / perCaseSeconds) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {(currentCase.imageFile || currentCase.externalImageUrl) && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black/50 max-w-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  currentCase.imageFile
                    ? `/images/${currentCase.imageFile}`
                    : currentCase.externalImageUrl || ""
                }
                alt="Clinical photograph"
                className="w-full h-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
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
                  Imaging modality, laterality, anatomy, findings.
                </p>
              </>
            ) : question ? (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-sm font-bold">{question.number}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{question.question}</h3>
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              value={getAnswerText()}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNextQuestion();
              }}
              placeholder="Type your answer... (Cmd+Enter to advance)"
              rows={5}
              className="w-full mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 resize-none focus:border-emerald-500 transition-colors"
            />

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
                >
                  Skip case
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  {caseIdx === allCases.length - 1 &&
                  currentQuestionIdx === currentCase.questions.length - 1
                    ? "Finish room"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const roomScores: RoomScore[] = roomQueue.map((rc, i) => {
      const attempts = attemptsByRoom[i] || [];
      return scoreRoom(rc.room.id, rc.room.description, attempts);
    });
    const verdict = computeVerdict(roomScores);
    const weakest = weakestRoom(roomScores);
    const weakAxis = weakestAxis(roomScores);
    const missedCases: CaseData[] = [];
    attemptsByRoom.forEach((arr, i) => {
      arr.forEach((a) => {
        if (a.percentageScore < 70) {
          const rc = roomQueue[i];
          const all = [...rc.phaseA, ...rc.phaseB];
          const c = all.find((x) => x.id === a.caseId);
          if (c) missedCases.push(c);
        }
      });
    });

    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Home</span>
            </button>
            <h1 className="text-lg font-bold text-white">ABO Exam Results</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8 text-center mb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Compensatory Verdict
            </p>
            <h2
              className={`text-4xl font-bold mb-3 ${
                verdict.passed ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {verdict.passed ? "PASS" : "DID NOT PASS"}
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{verdict.reason}</p>
          </div>

          <div className="space-y-4 mb-8">
            {roomScores.map((rs) => (
              <div key={rs.roomId} className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{rs.roomId}</p>
                    <p className="text-sm font-semibold text-white">{rs.label}</p>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      rs.total >= 6 ? "text-emerald-400" : rs.total >= 4 ? "text-amber-400" : "text-rose-400"
                    }`}
                  >
                    {rs.total}/9
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["data", "diagnosis", "management"] as const).map((k) => {
                    const v = rs.axis[k];
                    const pct = (v / 3) * 100;
                    return (
                      <div key={k}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {AXIS_LABELS[k]}
                          </span>
                          <span className="text-[11px] font-mono text-slate-300">{v}/3</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              v >= 2 ? "bg-emerald-500" : v >= 1 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {(weakest || weakAxis) && (
            <div className="glass-card rounded-xl p-5 mb-8">
              <h3 className="text-sm font-semibold text-white mb-2">Where to focus next</h3>
              {weakest && (
                <p className="text-xs text-slate-400 mb-1">
                  Weakest room:{" "}
                  <span className="text-amber-300 font-medium">{weakest.label}</span> ({weakest.total}/9)
                </p>
              )}
              {weakAxis && (
                <p className="text-xs text-slate-400">
                  Weakest axis:{" "}
                  <span className="text-amber-300 font-medium">{AXIS_LABELS[weakAxis]}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {weakest && (
              <button
                onClick={() => {
                  // Re-do weakest room
                  const targetRoom = roomQueue.find((rc) => rc.room.id === weakest.roomId);
                  if (!targetRoom) return;
                  const rebuilt = buildRoomCases(database, targetRoom.room);
                  setRoomQueue([rebuilt]);
                  setRoomIdx(0);
                  setCaseIdx(0);
                  const first = rebuilt.phaseA[0] || rebuilt.phaseB[0];
                  setCurrentQuestionIdx(first?.imageFile ? -1 : 0);
                  setCaseTimeRemaining(perCaseSeconds);
                  setAnswers({});
                  setPhotoAnswers({});
                  setAttemptsByRoom([[]]);
                  setHandoffShown(false);
                  setPhase("active");
                }}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
              >
                Re-do weakest room
              </button>
            )}
            {missedCases.length > 0 && (
              <button
                onClick={() => onSelectCase(missedCases[0])}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
              >
                Review missed cases ({missedCases.length})
              </button>
            )}
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback — no room/case ready
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 max-w-md text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Exam state lost</h2>
        <p className="text-sm text-slate-400 mb-4">Let&apos;s start over.</p>
        <button
          onClick={() => setPhase("setup")}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
        >
          Back to Setup
        </button>
      </div>
    </div>
  );
}
