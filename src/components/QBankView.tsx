"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  HIGH_YIELD_QBANK,
  QBANK_SUBSPECIALTIES,
  QBankItem,
  QBankSubspecialty,
  QBankDifficulty,
} from "@/lib/high-yield-qbank";
import { saveSrsCard, getSrsCard } from "@/lib/srs";

interface QBankViewProps {
  onBack: () => void;
}

type Filter = QBankSubspecialty | "All";
type DifficultyFilter = QBankDifficulty | "All";

const SUBSPECIALTY_ACCENT: Record<QBankSubspecialty, string> = {
  "Anterior Segment": "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  "Posterior Segment": "text-violet-300 bg-violet-500/10 border-violet-500/20",
  "Neuro-Ophthalmology and Orbit": "text-amber-300 bg-amber-500/10 border-amber-500/20",
  "Pediatric Ophthalmology": "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Optics: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  General: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20",
};

const DIFFICULTY_BADGE: Record<QBankDifficulty, string> = {
  core: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

export default function QBankView({ onBack }: QBankViewProps) {
  // ---- All hooks at top (Rules of Hooks) ----
  const [subspecialtyFilter, setSubspecialtyFilter] = useState<Filter>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, "right" | "wrong">>({});
  const [savedToSrs, setSavedToSrs] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [startTime, setStartTime] = useState<number>(() =>
    typeof window !== "undefined" ? Date.now() : 0
  );
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<number | null>(null);

  // Filtered items — stable memo
  const items = useMemo<QBankItem[]>(() => {
    return HIGH_YIELD_QBANK.filter(
      (it) =>
        (subspecialtyFilter === "All" || it.subspecialty === subspecialtyFilter) &&
        (difficultyFilter === "All" || it.difficulty === difficultyFilter)
    );
  }, [subspecialtyFilter, difficultyFilter]);

  // Reset index when filter changes
  useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setShowSummary(false);
  }, [subspecialtyFilter, difficultyFilter]);

  // Timer
  useEffect(() => {
    if (typeof window === "undefined") return;
    setStartTime(Date.now());
    const tick = () => {
      setElapsed(Date.now() - startTime);
    };
    tickRef.current = window.setInterval(tick, 1000) as unknown as number;
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
    // startTime intentionally re-initialized once per mount; timer reads latest via closure via interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = items[idx];

  const handleFlip = useCallback(() => {
    if (!current) return;
    setFlipped((f) => !f);
  }, [current]);

  const handleNext = useCallback(() => {
    if (!items.length) return;
    if (idx >= items.length - 1) {
      setShowSummary(true);
      return;
    }
    setIdx((i) => Math.min(items.length - 1, i + 1));
    setFlipped(false);
  }, [idx, items.length]);

  const handlePrev = useCallback(() => {
    if (!items.length) return;
    setIdx((i) => Math.max(0, i - 1));
    setFlipped(false);
  }, [items.length]);

  const handleMark = useCallback(
    (verdict: "right" | "wrong") => {
      if (!current) return;
      setResults((prev) => ({ ...prev, [current.id]: verdict }));
      // Auto-advance after marking
      handleNext();
    },
    [current, handleNext]
  );

  const handleShipToSrs = useCallback(() => {
    if (!current) return;
    if (typeof window === "undefined") return;
    const srsId = `qb:${current.id}`;
    try {
      const existing = getSrsCard(srsId);
      if (existing) {
        setSavedToSrs((p) => ({ ...p, [current.id]: true }));
        return;
      }
      saveSrsCard({
        caseId: srsId,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: new Date().toISOString(),
        lastReview: new Date().toISOString(),
        lapses: 0,
      });
      setSavedToSrs((p) => ({ ...p, [current.id]: true }));
    } catch (err) {
      console.error("Failed to save to SRS:", err);
    }
  }, [current]);

  const [savedToFc, setSavedToFc] = useState<Record<string, boolean>>({});
  const handleSaveToFlashcards = useCallback(async () => {
    if (!current) return;
    // Integrate with user-flashcards module if present; no-op if unavailable.
    try {
      const mod = await import("@/lib/user-flashcards").catch(() => null);
      if (mod && typeof (mod as { createFlashcard?: unknown }).createFlashcard === "function") {
        (mod as unknown as {
          createFlashcard: (c: {
            front: string;
            back: string;
            tags: string[];
          }) => unknown;
        }).createFlashcard({
          front: current.question,
          back:
            current.answer +
            (current.pearl ? `\n\nPearl: ${current.pearl}` : "") +
            (current.mnemonic ? `\n\nMnemonic: ${current.mnemonic}` : ""),
          tags: [current.subspecialty, current.topic, "qbank"],
        });
        setSavedToFc((p) => ({ ...p, [current.id]: true }));
      }
    } catch {
      /* module not available — no-op */
    }
  }, [current]);

  // Keyboard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (showSummary) return;
      if (e.target && (e.target as HTMLElement).tagName === "SELECT") return;
      if (e.key === " ") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "1") {
        handleMark("wrong");
      } else if (e.key === "2") {
        handleMark("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFlip, handleNext, handlePrev, handleMark, showSummary]);

  // ---- Derived values ----
  const totalAnswered = Object.keys(results).length;
  const rightCount = Object.values(results).filter((v) => v === "right").length;
  const wrongCount = totalAnswered - rightCount;
  const scorePct = totalAnswered > 0 ? Math.round((rightCount / totalAnswered) * 100) : 0;

  // Weakest topic across attempted items (only among wrongs)
  const weakestTopic = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [id, verdict] of Object.entries(results)) {
      if (verdict !== "wrong") continue;
      const item = HIGH_YIELD_QBANK.find((q) => q.id === id);
      if (!item) continue;
      counts[item.topic] = (counts[item.topic] || 0) + 1;
    }
    let top: string | null = null;
    let topN = 0;
    for (const [topic, n] of Object.entries(counts)) {
      if (n > topN) {
        top = topic;
        topN = n;
      }
    }
    return top;
  }, [results]);

  // ---- Render ----
  if (showSummary) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white mb-6"
        >
          &larr; Back
        </button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Session complete</h2>
          <p className="text-slate-400 mb-6">
            {items.length} card{items.length === 1 ? "" : "s"} &middot; {formatElapsed(elapsed)}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-400">{rightCount}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Right</p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-rose-400">{wrongCount}</p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Wrong</p>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4">
              <p
                className={`text-3xl font-bold ${
                  scorePct >= 70 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {scorePct}%
              </p>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">Score</p>
            </div>
          </div>

          {weakestTopic && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1 font-medium">
                Weakest topic
              </p>
              <p className="text-sm text-white">{weakestTopic}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                setResults({});
                setIdx(0);
                setFlipped(false);
                setShowSummary(false);
                setStartTime(Date.now());
              }}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium"
            >
              Restart deck
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white mb-6"
        >
          &larr; Back
        </button>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-300">No questions match your filters.</p>
          <button
            onClick={() => {
              setSubspecialtyFilter("All");
              setDifficultyFilter("All");
            }}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium"
          >
            Reset filters
          </button>
        </div>
      </div>
    );
  }

  const verdict = results[current.id];
  const isSaved = !!savedToSrs[current.id];

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white"
        >
          &larr; Back
        </button>
        <div className="text-xs text-slate-500 font-mono">{formatElapsed(elapsed)}</div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Q-Bank</h2>
        <p className="text-xs text-slate-400">
          {HIGH_YIELD_QBANK.length} high-yield board-style Q&amp;A items
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          value={subspecialtyFilter}
          onChange={(e) => setSubspecialtyFilter(e.target.value as Filter)}
          className="bg-slate-900/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2"
        >
          <option value="All">All subspecialties</option>
          {QBANK_SUBSPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
          className="bg-slate-900/80 border border-slate-700/50 text-white text-xs rounded-lg px-3 py-2"
        >
          <option value="All">All difficulties</option>
          <option value="core">Core</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <span className="ml-auto text-xs text-slate-400 self-center">
          {idx + 1} / {items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-primary-600 to-primary-400"
          style={{ width: `${items.length > 0 ? ((idx + 1) / items.length) * 100 : 0}%` }}
        />
      </div>

      {/* Card */}
      <button
        onClick={handleFlip}
        className="w-full text-left glass-card rounded-2xl p-6 sm:p-8 min-h-[320px] transition-all hover:border-primary-500/30 cursor-pointer"
        aria-label={flipped ? "Show question" : "Show answer"}
      >
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${SUBSPECIALTY_ACCENT[current.subspecialty]}`}
          >
            {current.subspecialty}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFFICULTY_BADGE[current.difficulty]}`}
          >
            {current.difficulty}
          </span>
          <span className="text-[10px] text-slate-500 ml-auto">{current.topic}</span>
        </div>

        {!flipped ? (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-primary-400 font-medium mb-2">
              Question
            </p>
            <p className="text-base sm:text-lg text-white leading-relaxed">
              {current.question}
            </p>
            <p className="text-[11px] text-slate-500 mt-6">
              Tap card or press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Space</kbd> to reveal answer
            </p>
          </div>
        ) : (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium mb-2">
              Answer
            </p>
            <p className="text-sm sm:text-base text-white leading-relaxed whitespace-pre-line">
              {current.answer}
            </p>
            {current.pearl && (
              <div className="mt-4 border-l-2 border-amber-400/50 pl-3">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium mb-1">
                  Pearl
                </p>
                <p className="text-sm text-slate-300 italic">{current.pearl}</p>
              </div>
            )}
            {current.mnemonic && (
              <div className="mt-3 border-l-2 border-violet-400/50 pl-3">
                <p className="text-[10px] uppercase tracking-wider text-violet-400 font-medium mb-1">
                  Mnemonic
                </p>
                <p className="text-sm text-slate-300 font-mono">{current.mnemonic}</p>
              </div>
            )}
          </div>
        )}
      </button>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={() => handleMark("wrong")}
          className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
            verdict === "wrong"
              ? "bg-rose-500/20 border-rose-500/40 text-rose-200"
              : "bg-slate-900/80 border-slate-700/50 text-slate-300 hover:border-rose-500/40"
          }`}
        >
          <span className="font-mono text-[10px] mr-1 opacity-60">1</span> Got it wrong
        </button>
        <button
          onClick={() => handleMark("right")}
          className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
            verdict === "right"
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
              : "bg-slate-900/80 border-slate-700/50 text-slate-300 hover:border-emerald-500/40"
          }`}
        >
          <span className="font-mono text-[10px] mr-1 opacity-60">2</span> Got it right
        </button>
      </div>

      {/* Nav + save */}
      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={idx === 0}
            className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 text-xs disabled:opacity-30"
          >
            &larr; Prev
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 text-xs"
          >
            Next &rarr;
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveToFlashcards}
            disabled={!!savedToFc[current.id]}
            className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
              savedToFc[current.id]
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900/60 border-slate-700/50 text-slate-300 hover:border-primary-500/40"
            }`}
            title="Save to your personal flashcard deck"
          >
            {savedToFc[current.id] ? "Saved to flashcards" : "Save to flashcards"}
          </button>
          <button
            onClick={handleShipToSrs}
            disabled={isSaved}
            className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
              isSaved
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900/60 border-slate-700/50 text-slate-300 hover:border-primary-500/40"
            }`}
          >
            {isSaved ? "Added to SRS" : "Ship as SRS card"}
          </button>
        </div>
      </div>

      {/* Score strip */}
      {totalAnswered > 0 && (
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>
            <span className="text-emerald-400 font-medium">{rightCount}</span> right
          </span>
          <span>&middot;</span>
          <span>
            <span className="text-rose-400 font-medium">{wrongCount}</span> wrong
          </span>
          <span>&middot;</span>
          <span>
            <span className="text-white font-medium">{scorePct}%</span> score
          </span>
        </div>
      )}

      {/* Keyboard legend */}
      <div className="mt-8 text-center text-[10px] text-slate-600 font-mono">
        Space flip &middot; &larr;/&rarr; prev/next &middot; 1 wrong &middot; 2 right
      </div>
    </div>
  );
}
