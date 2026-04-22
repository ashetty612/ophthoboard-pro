"use client";

import { useState, useEffect, useCallback } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";
import { getAttemptsForCase } from "@/lib/storage";

interface FlashcardModeProps {
  database: CasesDatabase;
  onBack: () => void;
  onPractice: (caseData: CaseData) => void;
}

type CardSide = "front" | "back";
type FlashcardType = "diagnosis" | "treatment" | "workup" | "mixed";

export default function FlashcardMode({ database, onBack, onPractice }: FlashcardModeProps) {
  const [cardType, setCardType] = useState<FlashcardType>("mixed");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    database.subspecialties.map((s) => s.id)
  );
  const [cards, setCards] = useState<{ caseData: CaseData; qIdx: number }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [side, setSide] = useState<CardSide>("front");
  const [confidence, setConfidence] = useState<{ [key: number]: "knew" | "partial" | "missed" }>({});
  const [started, setStarted] = useState(false);
  const [prioritizeWeak, setPrioritizeWeak] = useState(true);

  const generateCards = useCallback(() => {
    const eligibleCases = database.subspecialties
      .filter((s) => selectedSpecs.includes(s.id))
      .flatMap((s) => s.cases.filter((c) => c.questions.length > 0));

    const newCards: typeof cards = [];
    for (const c of eligibleCases) {
      for (let i = 0; i < c.questions.length; i++) {
        const q = c.questions[i];
        if (cardType === "diagnosis" && q.number !== 1) continue;
        if (cardType === "treatment" && q.number !== 5) continue;
        if (cardType === "workup" && q.number !== 3 && q.number !== 4) continue;
        newCards.push({ caseData: c, qIdx: i });
      }
    }

    // Shuffle, prioritizing weak areas if enabled
    if (prioritizeWeak) {
      newCards.sort((a, b) => {
        const aAttempts = getAttemptsForCase(a.caseData.id);
        const bAttempts = getAttemptsForCase(b.caseData.id);
        const aScore = aAttempts.length > 0 ? Math.max(...aAttempts.map(x => x.percentageScore)) : 50;
        const bScore = bAttempts.length > 0 ? Math.max(...bAttempts.map(x => x.percentageScore)) : 50;
        return aScore - bScore; // Weak first
      });
    } else {
      newCards.sort(() => Math.random() - 0.5);
    }

    setCards(newCards);
    setCurrentIdx(0);
    setSide("front");
    setConfidence({});
  }, [database, selectedSpecs, cardType, prioritizeWeak]);

  const handleFlip = () => setSide(side === "front" ? "back" : "front");

  const handleRate = (rating: "knew" | "partial" | "missed") => {
    setConfidence(prev => ({ ...prev, [currentIdx]: rating }));
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSide("front");
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!started || cards.length === 0) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); handleFlip(); }
    if (side === "back") {
      if (e.key === "1") handleRate("knew");
      if (e.key === "2") handleRate("partial");
      if (e.key === "3") handleRate("missed");
    }
    if (e.key === "ArrowRight" && currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1); setSide("front");
    }
    if (e.key === "ArrowLeft" && currentIdx > 0) {
      setCurrentIdx(currentIdx - 1); setSide("front");
    }
  }, [started, cards.length, side, currentIdx]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const knewCount = Object.values(confidence).filter(v => v === "knew").length;
  const partialCount = Object.values(confidence).filter(v => v === "partial").length;
  const missedCount = Object.values(confidence).filter(v => v === "missed").length;

  // SETUP
  if (!started) {
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
            <h1 className="text-lg font-bold text-white">Flashcard Study</h1>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                🃏
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Flashcard Mode</h2>
              <p className="text-slate-400">Quick-fire review of key concepts</p>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Card Focus</label>
              <div className="grid grid-cols-2 gap-2">
                {([["mixed", "All Questions"], ["diagnosis", "Diagnosis Only"], ["treatment", "Treatment Only"], ["workup", "Workup & Exam"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setCardType(key)}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${cardType === key ? "bg-primary-600 text-white" : "bg-slate-800/50 text-slate-400 hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={prioritizeWeak} onChange={() => setPrioritizeWeak(!prioritizeWeak)}
                  className="w-4 h-4 rounded accent-primary-500" />
                <span className="text-sm text-slate-300">Prioritize weak areas first</span>
              </label>
            </div>

            <div className="mb-8">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Subspecialties</label>
              <div className="space-y-2">
                {database.subspecialties.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedSpecs.includes(s.id)}
                      onChange={() => setSelectedSpecs(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                      className="w-4 h-4 rounded accent-primary-500" />
                    <span className="text-sm text-slate-300">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={() => { generateCards(); setStarted(true); }}
              disabled={selectedSpecs.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold text-lg transition-all shadow-lg">
              Start Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FINISHED
  if (currentIdx >= cards.length - 1 && confidence[currentIdx]) {
    const total = Object.keys(confidence).length;
    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-4 text-center">
            <h1 className="text-lg font-bold text-white">Session Complete</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in-up">
          <div className="glass-card rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Flashcard Review Complete</h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-400">{knewCount}</p>
                <p className="text-xs text-slate-400">Knew It</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-400">{partialCount}</p>
                <p className="text-xs text-slate-400">Partial</p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-rose-400">{missedCount}</p>
                <p className="text-xs text-slate-400">Missed</p>
              </div>
            </div>
            <p className="text-slate-400 mb-6">
              {knewCount}/{total} confident ({Math.round((knewCount / total) * 100)}%)
            </p>
            <div className="flex gap-4">
              <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">Home</button>
              <button onClick={() => { generateCards(); setCurrentIdx(0); setSide("front"); setConfidence({}); }}
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors">Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE CARD
  const card = cards[currentIdx];
  const question = card.caseData.questions[card.qIdx];

  return (
    <div className="min-h-screen">
      <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} aria-label="Exit flashcards" className="text-slate-400 hover:text-white text-sm px-3 py-2 min-h-[44px] -ml-3 rounded-lg">Exit</button>
          <span className="text-sm text-slate-400" aria-label={`Card ${currentIdx + 1} of ${cards.length}`}>{currentIdx + 1} / {cards.length}</span>
          <div className="flex gap-2 text-xs" aria-label="Score tally">
            <span className="text-emerald-400" aria-label={`${knewCount} knew`}>{knewCount}</span>
            <span className="text-amber-400" aria-label={`${partialCount} partial`}>{partialCount}</span>
            <span className="text-rose-400" aria-label={`${missedCount} missed`}>{missedCount}</span>
          </div>
        </div>
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-violet-500 progress-bar" style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 3D Flip Card */}
        <div className="perspective-1000 min-h-[320px]" onClick={handleFlip}>
          <div className={`relative w-full min-h-[320px] preserve-3d flip-transition cursor-pointer ${side === "back" ? "rotate-y-180" : ""}`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden glass-card rounded-2xl p-8 flex flex-col justify-center">
              <div className="text-center">
                <span className="text-[10px] text-primary-400/80 font-medium uppercase tracking-[0.2em]">{card.caseData.subspecialty}</span>
                <h2 className="text-xl font-bold text-white mt-2 mb-3">{card.caseData.title}</h2>
                <p className="text-sm text-slate-400 mb-4">{card.caseData.presentation}</p>
                {card.caseData.imageFile && (
                  <div className="rounded-xl overflow-hidden bg-black/50 max-w-sm mx-auto mb-4">
                    <img src={`/images/${card.caseData.imageFile}`} alt={`Clinical photograph for ${card.caseData.title}`} className="w-full h-auto" />
                  </div>
                )}
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mt-3">
                  <p className="text-sm font-medium text-primary-300">{question.question}</p>
                </div>
                <p className="text-[10px] text-slate-600 mt-4 uppercase tracking-wider">Tap to reveal</p>
              </div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 glass-card rounded-2xl p-8 flex flex-col justify-center overflow-y-auto">
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-[0.2em]">Answer</span>
              <div className="text-sm text-slate-200 whitespace-pre-line mt-3 mb-4 leading-relaxed">{question.answer}</div>
              {question.keyPoints.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {question.keyPoints.slice(0, 8).map((kp, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{kp}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rating buttons */}
        {side === "back" && (
          <div className="flex gap-3 mt-6 animate-fade-in">
            <button onClick={() => handleRate("missed")}
              className="flex-1 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium hover:bg-rose-500/30 transition-colors">
              Missed (3)
            </button>
            <button onClick={() => handleRate("partial")}
              className="flex-1 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium hover:bg-amber-500/30 transition-colors">
              Partial (2)
            </button>
            <button onClick={() => handleRate("knew")}
              className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium hover:bg-emerald-500/30 transition-colors">
              Knew It (1)
            </button>
          </div>
        )}

        {/* Practice button */}
        {side === "back" && (
          <button onClick={() => onPractice(card.caseData)}
            className="w-full mt-3 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white text-sm transition-colors">
            Practice Full Case
          </button>
        )}

        <p className="text-center text-xs text-slate-500 mt-4">
          Space/Enter to flip &bull; 1/2/3 to rate &bull; Arrow keys to navigate
        </p>
      </div>
    </div>
  );
}
