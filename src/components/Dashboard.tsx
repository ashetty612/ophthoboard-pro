"use client";

import { useState, useEffect } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";
import { getProgress, getAttempts, clearAllData } from "@/lib/storage";
import { calculateGrade, getGradeColor } from "@/lib/scoring";

interface DashboardProps {
  database: CasesDatabase;
  onBack: () => void;
  onSelectCase: (caseData: CaseData) => void;
}

export default function Dashboard({ database, onBack, onSelectCase }: DashboardProps) {
  const [progress, setProgress] = useState(getProgress());
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const allAttempts = getAttempts();
  const totalCasesAvailable = database.subspecialties.reduce(
    (sum, s) => sum + s.cases.filter((c) => c.questions.length > 0).length,
    0
  );

  const subspecialtyStats = database.subspecialties.map((spec) => {
    const activeCases = spec.cases.filter((c) => c.questions.length > 0).length;
    const specAttempts = allAttempts.filter((a) =>
      spec.cases.some((c) => c.id === a.caseId)
    );
    const uniqueCases = new Set(specAttempts.map((a) => a.caseId)).size;
    const avgScore =
      specAttempts.length > 0
        ? Math.round(specAttempts.reduce((s, a) => s + a.percentageScore, 0) / specAttempts.length)
        : 0;
    return { name: spec.name, id: spec.id, total: activeCases, attempted: uniqueCases, avgScore, attempts: specAttempts.length };
  });

  const handleClearData = () => {
    clearAllData();
    setProgress(getProgress());
    setShowConfirmClear(false);
  };

  // Find weakest cases
  const weakCases = allAttempts
    .sort((a, b) => a.percentageScore - b.percentageScore)
    .slice(0, 5);

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
          <h1 className="text-lg font-bold text-white">Performance Dashboard</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Cases Done", value: progress.totalCasesAttempted, color: "text-primary-400" },
            { label: "Available", value: totalCasesAvailable, color: "text-slate-300" },
            { label: "Avg Score", value: `${progress.averageScore}%`, color: progress.averageScore >= 70 ? "text-emerald-400" : "text-amber-400" },
            { label: "Best", value: `${progress.bestScore}%`, color: "text-emerald-400" },
            { label: "Total Attempts", value: allAttempts.length, color: "text-primary-300" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Subspecialty Performance */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Performance by Subspecialty</h2>
          <div className="space-y-4">
            {subspecialtyStats.map((stat) => (
              <div key={stat.id} className="flex items-center gap-4">
                <div className="w-48 shrink-0">
                  <p className="text-sm font-medium text-white truncate">{stat.name}</p>
                  <p className="text-xs text-slate-400">
                    {stat.attempted}/{stat.total} cases &bull; {stat.attempts} attempts
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-bar ${
                        stat.avgScore >= 70 ? "bg-emerald-500" : stat.avgScore >= 50 ? "bg-amber-500" : stat.avgScore > 0 ? "bg-rose-500" : "bg-slate-600"
                      }`}
                      style={{ width: `${stat.avgScore}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`text-sm font-bold w-12 text-right ${
                    stat.avgScore >= 70 ? "text-emerald-400" : stat.avgScore >= 50 ? "text-amber-400" : stat.avgScore > 0 ? "text-rose-400" : "text-slate-500"
                  }`}
                >
                  {stat.avgScore > 0 ? `${stat.avgScore}%` : "---"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent Attempts */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Attempts</h2>
            {progress.recentAttempts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No attempts yet. Start practicing!
              </p>
            ) : (
              <div className="space-y-3">
                {progress.recentAttempts.slice(0, 8).map((attempt, i) => {
                  const caseData = database.subspecialties
                    .flatMap((s) => s.cases)
                    .find((c) => c.id === attempt.caseId);
                  const grade = calculateGrade(attempt.percentageScore);
                  return (
                    <button
                      key={i}
                      onClick={() => caseData && onSelectCase(caseData)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                          attempt.percentageScore >= 70
                            ? "bg-emerald-500/20 text-emerald-400"
                            : attempt.percentageScore >= 50
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {attempt.percentageScore}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {caseData?.title || attempt.caseId}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(attempt.timestamp).toLocaleDateString()} &bull;{" "}
                          <span className={getGradeColor(grade)}>{grade}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Lowest Scores</h2>
            {weakCases.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Complete some cases to see your weak areas.
              </p>
            ) : (
              <div className="space-y-3">
                {weakCases.map((attempt, i) => {
                  const caseData = database.subspecialties
                    .flatMap((s) => s.cases)
                    .find((c) => c.id === attempt.caseId);
                  return (
                    <button
                      key={i}
                      onClick={() => caseData && onSelectCase(caseData)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-400">
                        {attempt.percentageScore}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {caseData?.title || attempt.caseId}
                        </p>
                        <p className="text-xs text-slate-400">{caseData?.subspecialty}</p>
                      </div>
                      <span className="text-xs text-primary-400">Review</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Study Recommendations */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Study Recommendations</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {progress.weakAreas.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                  Needs Work
                </p>
                {progress.weakAreas.map((area) => (
                  <p key={area} className="text-sm text-rose-200/80">{area}</p>
                ))}
              </div>
            )}
            {progress.strongAreas.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                  Strong Areas
                </p>
                {progress.strongAreas.map((area) => (
                  <p key={area} className="text-sm text-emerald-200/80">{area}</p>
                ))}
              </div>
            )}
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">
                Next Steps
              </p>
              <p className="text-sm text-primary-200/80">
                {progress.totalCasesAttempted === 0
                  ? "Start with any subspecialty that interests you."
                  : progress.averageScore < 60
                  ? "Focus on reviewing model answers before attempting more cases."
                  : progress.totalCasesAttempted < totalCasesAvailable / 2
                  ? "Good progress! Keep completing new cases."
                  : "Consider retrying your lowest-scoring cases."}
              </p>
            </div>
          </div>
        </div>

        {/* Clear Data */}
        <div className="text-center">
          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Reset All Progress
            </button>
          ) : (
            <div className="inline-flex items-center gap-3">
              <span className="text-xs text-rose-400">Are you sure?</span>
              <button
                onClick={handleClearData}
                className="px-3 py-1 text-xs bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
