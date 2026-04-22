"use client";

import { useEffect, useMemo, useState } from "react";
import { CaseData, CasesDatabase, SrsCard } from "@/lib/types";
import { getDueCards } from "@/lib/srs";

interface DueTodayViewProps {
  database: CasesDatabase;
  onBack: () => void;
  onStudyCase: (c: CaseData) => void;
}

interface DueEntry {
  card: SrsCard;
  caseData: CaseData;
  daysOverdue: number;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function DueTodayView({ database, onBack, onStudyCase }: DueTodayViewProps) {
  const [dueCards, setDueCards] = useState<SrsCard[]>([]);
  const [sessionQueue, setSessionQueue] = useState<CaseData[] | null>(null);
  const [sessionIndex, setSessionIndex] = useState(0);

  useEffect(() => {
    setDueCards(getDueCards());
  }, []);

  const caseIndex = useMemo(() => {
    const map = new Map<string, CaseData>();
    for (const spec of database.subspecialties) {
      for (const c of spec.cases) map.set(c.id, c);
    }
    return map;
  }, [database]);

  const entries: DueEntry[] = useMemo(() => {
    const today = startOfDay(new Date());
    const out: DueEntry[] = [];
    for (const card of dueCards) {
      const caseData = caseIndex.get(card.caseId);
      if (!caseData) continue;
      const dueTs = startOfDay(new Date(card.dueDate));
      const daysOverdue = Math.floor((today - dueTs) / (24 * 60 * 60 * 1000));
      out.push({ card, caseData, daysOverdue });
    }
    out.sort((a, b) => b.daysOverdue - a.daysOverdue);
    return out;
  }, [dueCards, caseIndex]);

  const overdueCount = entries.filter((e) => e.daysOverdue > 0).length;

  // Session mode: when a user finishes a case in session, they come back here
  // via onBack; advance to the next queued card.
  useEffect(() => {
    if (!sessionQueue) return;
    if (sessionIndex >= sessionQueue.length) {
      setSessionQueue(null);
      setSessionIndex(0);
      setDueCards(getDueCards());
      return;
    }
    onStudyCase(sessionQueue[sessionIndex]);
    // Advance for when the user returns
    setSessionIndex((i) => i + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQueue]);

  const startSession = () => {
    const queue = entries.map((e) => e.caseData);
    if (queue.length === 0) return;
    setSessionIndex(0);
    setSessionQueue(queue);
  };

  const formatSubspecialty = (s: string) => s.replace(/-/g, " ");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 glass-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-[0.2em]">Spaced Review</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] text-primary-400/80 uppercase tracking-[0.3em] font-medium mb-2">
              Spaced Repetition
            </p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Due Today</h2>
            <p className="text-slate-400 text-sm mt-2">
              {entries.length} {entries.length === 1 ? "card" : "cards"} to review
              {overdueCount > 0 && (
                <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-medium">
                  Overdue: {overdueCount}
                </span>
              )}
            </p>
          </div>

          {entries.length > 0 && (
            <button
              onClick={startSession}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              Start Due Session
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-semibold text-white mb-2">Nothing due! Come back tomorrow.</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              You&apos;re all caught up on reviews. Consider learning new cases from the subspecialty
              browser to build your deck.
            </p>
            <button
              onClick={onBack}
              className="mt-6 px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              Browse Cases
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            {entries.map(({ card, caseData, daysOverdue }) => (
              <button
                key={card.caseId}
                onClick={() => onStudyCase(caseData)}
                className="glass-card rounded-xl p-4 text-left hover:bg-slate-800/40 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{caseData.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 capitalize">
                      {formatSubspecialty(caseData.subspecialty)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      reps: {card.repetitions} · ease: {card.ease.toFixed(2)}
                    </span>
                  </div>
                </div>
                {daysOverdue > 0 ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 font-medium shrink-0">
                    {daysOverdue}d overdue
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium shrink-0">
                    Due today
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
