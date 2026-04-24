"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CasesDatabase, CaseData, StudyProgress } from "@/lib/types";
import { getProgress, getAttempts, getStudyStreak } from "@/lib/storage";
import {
  computeHeatmap,
  axisLabel,
  type HeatmapCell,
  type HeatmapData,
  MIN_HEATMAP_SAMPLES,
} from "@/lib/heatmap";
import {
  analyzeWeaknesses,
  buildAttemptedMap,
  generateWeaknessQuizWithAttempts,
} from "@/lib/weakness-quiz";

interface HeatmapViewProps {
  onBack: () => void;
  onStartCase: (c: CaseData) => void;
  database: CasesDatabase;
}

const DRILL_SIZE = 5;

// Cell color classes keyed by bucket. Uses the emerald `primary-*` scale and
// `steel-*` scale from globals.css, plus amber/rose for weakness.
function cellStyle(cell: HeatmapCell): { bg: string; text: string; ring: string; label: string } {
  if (cell.sampleCount < MIN_HEATMAP_SAMPLES) {
    return {
      bg: "bg-slate-800/40",
      text: "text-slate-500",
      ring: "ring-slate-700/40",
      label: "Insufficient data",
    };
  }
  const p = cell.averagePercent;
  if (p >= 80)
    return {
      bg: "bg-[color:var(--color-primary-500)]/25 hover:bg-[color:var(--color-primary-500)]/35",
      text: "text-emerald-100",
      ring: "ring-[color:var(--color-primary-500)]/50",
      label: "Strong",
    };
  if (p >= 65)
    return {
      bg: "bg-[color:var(--color-steel-500)]/25 hover:bg-[color:var(--color-steel-500)]/35",
      text: "text-sky-100",
      ring: "ring-[color:var(--color-steel-500)]/50",
      label: "Solid",
    };
  if (p >= 50)
    return {
      bg: "bg-amber-500/20 hover:bg-amber-500/30",
      text: "text-amber-100",
      ring: "ring-amber-500/50",
      label: "Borderline",
    };
  return {
    bg: "bg-rose-500/25 hover:bg-rose-500/35",
    text: "text-rose-100",
    ring: "ring-rose-500/60",
    label: "Weak",
  };
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function HeatmapView({ onBack, onStartCase, database }: HeatmapViewProps) {
  // All hooks at top — Rules of Hooks.
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [streak, setStreak] = useState({ current: 0, lastDate: "" });
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  useEffect(() => {
    try {
      setProgress(getProgress());
      setHeatmap(computeHeatmap(getAttempts()));
      setStreak(getStudyStreak());
    } catch {
      setProgress(null);
      setHeatmap(null);
    } finally {
      setReady(true);
    }
  }, []);

  const startDrill = useCallback(
    (cell: HeatmapCell) => {
      if (!progress) return;
      // Reuse the weakness-quiz generator but pin the weakest subspecialty to
      // the clicked cell's subspecialty so the drill targets that row.
      const attempts = getAttempts();
      const base = analyzeWeaknesses(progress, attempts);
      const report = {
        ...base,
        weakestSubspecialty: cell.subspecialty,
        weakestSubspecialtyAvg: cell.averagePercent,
      };
      const attemptedMap = buildAttemptedMap(attempts);
      const picked = generateWeaknessQuizWithAttempts(database, report, DRILL_SIZE, attemptedMap);
      if (picked.length > 0) onStartCase(picked[0]);
    },
    [progress, database, onStartCase]
  );

  // Keyboard: Esc = back, Enter on focused weak cell = drill.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
        return;
      }
      if (e.key === "Enter" && heatmap && focusIndex >= 0 && focusIndex < heatmap.cells.length) {
        const cell = heatmap.cells[focusIndex];
        if (cell.sampleCount >= MIN_HEATMAP_SAMPLES) startDrill(cell);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [heatmap, focusIndex, onBack, startDrill]);

  const headerStats = useMemo(() => {
    if (!progress || !heatmap) return null;
    const subs = Object.entries(progress.bySubspecialty || {});
    let best: { name: string; avg: number } | null = null;
    let worst: { name: string; avg: number } | null = null;
    for (const [name, s] of subs) {
      if (s.attempted < MIN_HEATMAP_SAMPLES) continue;
      if (!best || s.averageScore > best.avg) best = { name, avg: s.averageScore };
      if (!worst || s.averageScore < worst.avg) worst = { name, avg: s.averageScore };
    }
    return {
      totalAttempts: heatmap.totalAttempts,
      avg: progress.averageScore,
      best,
      worst,
    };
  }, [progress, heatmap]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm tracking-wide">Building heatmap...</p>
      </div>
    );
  }

  const hasAnyData = !!heatmap && heatmap.totalAttempts > 0;
  const hasEligibleCells =
    !!heatmap && heatmap.cells.some((c) => c.sampleCount >= MIN_HEATMAP_SAMPLES);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 glass-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white text-sm"
            aria-label="Back to home (Esc)"
          >
            ← Back
          </button>
          <h1 className="text-sm font-semibold text-white uppercase tracking-[0.2em]">
            Performance Heatmap
          </h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {!hasAnyData && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-xl font-bold text-white mb-2">No heatmap yet</h2>
            <p className="text-sm text-slate-400 mb-6">
              Complete 3+ cases per subspecialty to see your heatmap.
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {hasAnyData && (
          <>
            {/* Stats Header */}
            {headerStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="stat-number text-2xl font-bold text-primary-400">
                    {headerStats.totalAttempts}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                    Attempts
                  </p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p
                    className={`stat-number text-2xl font-bold ${
                      headerStats.avg >= 70 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {headerStats.avg}
                    <span className="text-sm text-slate-400">%</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                    Average
                  </p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="stat-number text-sm font-semibold text-emerald-300 truncate">
                    {headerStats.best ? headerStats.best.name : "—"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                    Best {headerStats.best ? `(${headerStats.best.avg}%)` : ""}
                  </p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="stat-number text-sm font-semibold text-rose-300 truncate">
                    {headerStats.worst ? headerStats.worst.name : "—"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">
                    Worst {headerStats.worst ? `(${headerStats.worst.avg}%)` : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-slate-400">
              <span className="uppercase tracking-wider">Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-[color:var(--color-primary-500)]/40 ring-1 ring-[color:var(--color-primary-500)]/50" />
                ≥80%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-[color:var(--color-steel-500)]/40 ring-1 ring-[color:var(--color-steel-500)]/50" />
                65–79%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/30 ring-1 ring-amber-500/50" />
                50–64%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-rose-500/40 ring-1 ring-rose-500/60" />
                &lt;50%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-slate-800/60 ring-1 ring-slate-700/40" />
                &lt;3 samples
              </span>
              <span className="ml-auto text-slate-500">Click a weak cell to drill {DRILL_SIZE} cases · Streak: {streak.current}d</span>
            </div>

            {/* Grid */}
            <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Column headers */}
                <div className="grid grid-cols-[220px_repeat(3,minmax(0,1fr))] gap-2 mb-2">
                  <div />
                  {heatmap!.axes.map((axis) => (
                    <div
                      key={axis}
                      className="text-center text-[11px] uppercase tracking-wider text-primary-400 font-semibold py-2"
                    >
                      {axisLabel(axis)}
                    </div>
                  ))}
                </div>
                {heatmap!.subspecialties.map((sub) => (
                  <div
                    key={sub}
                    className="grid grid-cols-[220px_repeat(3,minmax(0,1fr))] gap-2 mb-2"
                  >
                    <div className="flex items-center text-sm text-slate-300 font-medium pr-2">
                      {sub}
                    </div>
                    {heatmap!.axes.map((axis) => {
                      const idx = heatmap!.cells.findIndex(
                        (c) => c.subspecialty === sub && c.axis === axis
                      );
                      const cell = heatmap!.cells[idx];
                      const style = cellStyle(cell);
                      const k = `${sub}::${axis}`;
                      const canDrill = cell.sampleCount >= MIN_HEATMAP_SAMPLES;
                      const dateStr = formatDate(cell.lastAttemptAt);
                      return (
                        <button
                          key={k}
                          onMouseEnter={() => setHoverKey(k)}
                          onMouseLeave={() => setHoverKey((v) => (v === k ? null : v))}
                          onFocus={() => setFocusIndex(idx)}
                          onBlur={() => setFocusIndex((v) => (v === idx ? -1 : v))}
                          onClick={() => {
                            if (canDrill) startDrill(cell);
                          }}
                          disabled={!canDrill}
                          aria-label={`${sub} ${axisLabel(axis)}: ${
                            canDrill ? `${cell.averagePercent}% over ${cell.sampleCount} samples` : "insufficient data"
                          }${dateStr ? `, last attempt ${dateStr}` : ""}`}
                          className={`relative aspect-[2/1] min-h-[64px] rounded-lg ring-1 transition-all ${style.bg} ${style.ring} ${
                            canDrill
                              ? "cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-400"
                              : "cursor-not-allowed opacity-70"
                          }`}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {canDrill ? (
                              <>
                                <span className={`text-xl font-bold ${style.text}`}>
                                  {cell.averagePercent}%
                                </span>
                                <span className="text-[10px] text-slate-300/70 mt-0.5">
                                  n={cell.sampleCount}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                n={cell.sampleCount} / 3
                              </span>
                            )}
                          </div>
                          {hoverKey === k && dateStr && (
                            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-md bg-slate-900/95 border border-slate-700/60 px-2 py-1 text-[10px] text-slate-300 shadow-lg">
                              Last: {dateStr}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Drill callout */}
            {heatmap!.weakestCell && (
              <div className="mt-6 rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-amber-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5" aria-hidden>
                    🎯
                  </span>
                  <div>
                    <p className="text-[11px] text-rose-300 uppercase tracking-wider font-semibold">
                      Weakest cell
                    </p>
                    <p className="text-sm text-white font-medium mt-0.5">
                      {axisLabel(heatmap!.weakestCell.axis)} in{" "}
                      <span className="text-rose-300">{heatmap!.weakestCell.subspecialty}</span> —{" "}
                      <span className="text-rose-300">{heatmap!.weakestCell.averagePercent}%</span>{" "}
                      across {heatmap!.weakestCell.sampleCount} answers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => heatmap!.weakestCell && startDrill(heatmap!.weakestCell)}
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold transition-colors"
                >
                  Drill {DRILL_SIZE} cases →
                </button>
              </div>
            )}

            {!hasEligibleCells && (
              <p className="text-center text-slate-500 text-xs mt-6">
                Each cell needs {MIN_HEATMAP_SAMPLES}+ answers before it unlocks — keep
                practicing across subspecialties.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
