"use client";

import { useState, useEffect } from "react";
import { Subspecialty, CaseData } from "@/lib/types";
import { getAttemptsForCase, isBookmarked } from "@/lib/storage";

interface SubspecialtyBrowserProps {
  subspecialty: Subspecialty;
  onSelectCase: (caseData: CaseData) => void;
  onBack: () => void;
}

export default function SubspecialtyBrowser({
  subspecialty,
  onSelectCase,
  onBack,
}: SubspecialtyBrowserProps) {
  const [filter, setFilter] = useState<"all" | "unattempted" | "bookmarked" | "with-images">("all");
  const [sortBy, setSortBy] = useState<"number" | "score" | "attempts">("number");
  const [caseScores, setCaseScores] = useState<{ [key: string]: { best: number; attempts: number } }>({});

  useEffect(() => {
    const scores: typeof caseScores = {};
    for (const c of subspecialty.cases) {
      const attempts = getAttemptsForCase(c.id);
      if (attempts.length > 0) {
        scores[c.id] = {
          best: Math.max(...attempts.map((a) => a.percentageScore)),
          attempts: attempts.length,
        };
      }
    }
    setCaseScores(scores);
  }, [subspecialty]);

  const activeCases = subspecialty.cases.filter((c) => c.questions.length > 0);

  let filteredCases = activeCases;
  if (filter === "unattempted") {
    filteredCases = activeCases.filter((c) => !caseScores[c.id]);
  } else if (filter === "bookmarked") {
    filteredCases = activeCases.filter((c) => isBookmarked(c.id));
  } else if (filter === "with-images") {
    filteredCases = activeCases.filter((c) => c.imageFile);
  }

  if (sortBy === "score") {
    filteredCases.sort((a, b) => (caseScores[a.id]?.best || 0) - (caseScores[b.id]?.best || 0));
  } else if (sortBy === "attempts") {
    filteredCases.sort((a, b) => (caseScores[a.id]?.attempts || 0) - (caseScores[b.id]?.attempts || 0));
  }

  const completedCount = activeCases.filter((c) => caseScores[c.id]).length;
  const averageScore =
    Object.values(caseScores).length > 0
      ? Math.round(
          Object.values(caseScores).reduce((sum, s) => sum + s.best, 0) /
            Object.values(caseScores).length
        )
      : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Home</span>
          </button>
          <h1 className="text-lg font-bold text-white">{subspecialty.name}</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary-400">{activeCases.length}</p>
            <p className="text-xs text-slate-400">Active Cases</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{averageScore}%</p>
            <p className="text-xs text-slate-400">Avg Score</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              ["all", "All Cases"],
              ["unattempted", "Not Attempted"],
              ["bookmarked", "Bookmarked"],
              ["with-images", "With Images"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-primary-600 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50"
            >
              <option value="number">Sort by Case #</option>
              <option value="score">Sort by Score (Low First)</option>
              <option value="attempts">Sort by Attempts</option>
            </select>
          </div>
        </div>

        {/* Case Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((c, i) => {
            const score = caseScores[c.id];
            const bm = isBookmarked(c.id);
            return (
              <button
                key={c.id}
                onClick={() => onSelectCase(c)}
                className="glass-card rounded-xl p-5 text-left hover-lift transition-all group animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Image thumbnail */}
                {c.imageFile && (
                  <div className="relative rounded-lg overflow-hidden bg-black/50 mb-3 h-32">
                    <img
                      src={`/images/${c.imageFile}`}
                      alt=""
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    {bm && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-500">
                      Case {c.caseNumber}
                    </span>
                    <h3 className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                      {c.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{c.presentation}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{c.questions.length} questions</span>
                  {score ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          score.best >= 70 ? "text-emerald-400" : score.best >= 50 ? "text-amber-400" : "text-rose-400"
                        }`}
                      >
                        Best: {score.best}%
                      </span>
                      <span className="text-xs text-slate-500">({score.attempts}x)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Not attempted</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
