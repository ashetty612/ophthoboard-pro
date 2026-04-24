"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CasesDatabase, CaseData } from "@/lib/types";
import { getProgress, getAttempts, clearAllData } from "@/lib/storage";
import { calculateGrade, getGradeColor } from "@/lib/scoring";
import CountUp from "./CountUp";
import CVBLogo from "./CVBLogo";
import { fadeUp, stagger, slideInRight, easeOut } from "@/lib/motion";

interface DashboardProps {
  database: CasesDatabase;
  onBack: () => void;
  onSelectCase: (caseData: CaseData) => void;
}

// ───────────────────────────────────────────────────────────────────────────
// Mini-visualizations for each hero stat card.  Each card type is distinct
// so the hero row doesn't read like generic stat tiles.
// ───────────────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  // Normalise 0..1 and render a tiny area-path.  If fewer than 2 points,
  // draw a flat baseline with a growing dot so it still feels alive.
  const reduce = useReducedMotion();
  const w = 80;
  const h = 24;
  if (values.length < 2) {
    return (
      <svg width={w} height={h} className="overflow-visible">
        <line x1={0} y1={h - 2} x2={w} y2={h - 2} stroke={color} strokeWidth={1} opacity={0.3} />
        <motion.circle
          cx={w - 4}
          cy={h - 2}
          r={2.5}
          fill={color}
          animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return [x, y] as const;
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#spark-${color.replace("#", "")})`}
        initial={reduce ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: easeOut }}
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
    </svg>
  );
}

function ProgressRail({ pct, color }: { pct: number; color: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={reduce ? { width: `${pct}%` } : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, ease: easeOut, delay: 0.1 }}
      />
    </div>
  );
}

function RadialGauge({ pct, color }: { pct: number; color: string }) {
  const reduce = useReducedMotion();
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={44} height={44} viewBox="0 0 44 44">
      <circle cx={22} cy={22} r={r} stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} fill="none" className="text-slate-400" />
      <motion.circle
        cx={22}
        cy={22}
        r={r}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        transform="rotate(-90 22 22)"
        strokeDasharray={c}
        initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: easeOut, delay: 0.2 }}
      />
    </svg>
  );
}

function BarSpread({ values, color }: { values: number[]; color: string }) {
  // Histogram of 0-5 bars — distinct from sparkline
  const reduce = useReducedMotion();
  const bars = 5;
  const data = Array.from({ length: bars }).map((_, i) => {
    const slice = values.slice(
      Math.floor((values.length * i) / bars),
      Math.floor((values.length * (i + 1)) / bars) || undefined
    );
    if (!slice.length) return 0;
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-6">
      {data.map((v, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-sm"
          style={{ backgroundColor: color, opacity: 0.2 + 0.8 * (v / max) }}
          initial={reduce ? { height: `${(v / max) * 100}%` } : { height: 0 }}
          animate={{ height: `${Math.max(10, (v / max) * 100)}%` }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.06, ease: easeOut }}
        />
      ))}
    </div>
  );
}

function CountChip({ n }: { n: number }) {
  // Distinct "stack of tickets" visualization for total attempts
  const reduce = useReducedMotion();
  const layers = Math.min(4, Math.max(1, Math.ceil(Math.log2(n + 2))));
  return (
    <div className="relative h-6 w-10">
      {Array.from({ length: layers }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-0 right-0 h-1.5 rounded-full bg-gradient-to-r from-primary-400/70 to-steel-400/70"
          style={{ top: 4 + i * 4 }}
          initial={reduce ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: easeOut }}
        />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

export default function Dashboard({ database, onBack, onSelectCase }: DashboardProps) {
  const [progress, setProgress] = useState(getProgress());
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const allAttempts = useMemo(() => getAttempts(), []);
  const totalCasesAvailable = useMemo(
    () =>
      database.subspecialties.reduce(
        (sum, s) => sum + s.cases.filter((c) => c.questions.length > 0).length,
        0
      ),
    [database]
  );

  const subspecialtyStats = useMemo(
    () =>
      database.subspecialties.map((spec) => {
        const activeCases = spec.cases.filter((c) => c.questions.length > 0).length;
        const specAttempts = allAttempts.filter((a) =>
          spec.cases.some((c) => c.id === a.caseId)
        );
        const uniqueCases = new Set(specAttempts.map((a) => a.caseId)).size;
        const avgScore =
          specAttempts.length > 0
            ? Math.round(specAttempts.reduce((s, a) => s + a.percentageScore, 0) / specAttempts.length)
            : 0;
        return {
          name: spec.name,
          id: spec.id,
          total: activeCases,
          attempted: uniqueCases,
          avgScore,
          attempts: specAttempts.length,
        };
      }),
    [database, allAttempts]
  );

  // Recent-score series for sparklines (chronological, oldest→newest)
  const chronologicalScores = useMemo(
    () =>
      [...allAttempts]
        .sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0))
        .map((a) => a.percentageScore),
    [allAttempts]
  );

  // Weakest subspecialty
  const weakestSpec = useMemo(() => {
    const scored = subspecialtyStats.filter((s) => s.attempts > 0);
    if (!scored.length) return null;
    return scored.reduce((lo, s) => (s.avgScore < lo.avgScore ? s : lo));
  }, [subspecialtyStats]);

  // Trend: compare last-5 avg vs previous-5 avg
  const trend = useMemo(() => {
    if (chronologicalScores.length < 2) return null;
    const last5 = chronologicalScores.slice(-5);
    const prev5 = chronologicalScores.slice(-10, -5);
    if (!prev5.length) return null;
    const a = last5.reduce((s, v) => s + v, 0) / last5.length;
    const b = prev5.reduce((s, v) => s + v, 0) / prev5.length;
    return Math.round(a - b);
  }, [chronologicalScores]);

  const handleClearData = () => {
    clearAllData();
    setProgress(getProgress());
    setShowConfirmClear(false);
  };

  const weakCases = useMemo(
    () => [...allAttempts].sort((a, b) => a.percentageScore - b.percentageScore).slice(0, 5),
    [allAttempts]
  );

  const hasData = progress.totalCasesAttempted > 0;

  // Hero stat card definitions
  type HeroStat = {
    label: string;
    value: number;
    suffix?: string;
    color: string;
    hex: string;
    render: React.ReactNode;
  };
  const heroStats: HeroStat[] = [
    {
      label: "Cases Done",
      value: progress.totalCasesAttempted,
      color: "text-primary-400",
      hex: "#34d399",
      render: <Sparkline values={chronologicalScores} color="#34d399" />,
    },
    {
      label: "Available",
      value: totalCasesAvailable,
      color: "text-slate-300",
      hex: "#94a3b8",
      render: (
        <ProgressRail
          pct={totalCasesAvailable > 0 ? (progress.totalCasesAttempted / totalCasesAvailable) * 100 : 0}
          color="#94a3b8"
        />
      ),
    },
    {
      label: "Avg Score",
      value: progress.averageScore,
      suffix: "%",
      color: progress.averageScore >= 70 ? "text-emerald-400" : "text-amber-400",
      hex: progress.averageScore >= 70 ? "#34d399" : "#fbbf24",
      render: (
        <RadialGauge
          pct={progress.averageScore}
          color={progress.averageScore >= 70 ? "#34d399" : "#fbbf24"}
        />
      ),
    },
    {
      label: "Best",
      value: progress.bestScore,
      suffix: "%",
      color: "text-emerald-400",
      hex: "#34d399",
      render: <BarSpread values={chronologicalScores.length ? chronologicalScores : [0]} color="#34d399" />,
    },
    {
      label: "Total Attempts",
      value: allAttempts.length,
      color: "text-primary-300",
      hex: "#347896",
      render: <CountChip n={allAttempts.length} />,
    },
  ];

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
        {/* Empty state when nothing attempted yet */}
        {!hasData ? (
          <motion.div
            className="glass-card rounded-3xl p-10 text-center mb-8"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <div className="flex flex-col items-center gap-5">
              <motion.div
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <CVBLogo size={88} />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Your dashboard starts with your first case
                </h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Once you attempt a case, you&rsquo;ll see score trends, subspecialty
                  heat maps, and your weakest topics surfaced here.
                </p>
              </div>
              <motion.button
                onClick={onBack}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-steel-500 text-white font-semibold text-sm shadow-[0_10px_30px_-10px_rgba(4,121,98,0.55)]"
              >
                Study your first case →
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Overview Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
              variants={stagger(0.07, 0.05)}
              initial="hidden"
              animate="show"
            >
              {heroStats.map((stat) => (
                <motion.button
                  key={stat.label}
                  variants={fadeUp}
                  whileHover={reduce ? undefined : { y: -3 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  onClick={onBack}
                  className="glass-card rounded-xl p-4 text-left relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className={`text-2xl font-bold ${stat.color} leading-none`}>
                      <CountUp value={stat.value} suffix={stat.suffix || ""} duration={1200} />
                    </p>
                    <div className="shrink-0">{stat.render}</div>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Weakness Callout */}
            {weakestSpec && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeOut }}
                className="relative overflow-hidden rounded-2xl p-6 mb-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative mt-1">
                      <span className="block w-3 h-3 rounded-full bg-amber-400" />
                      {!reduce && (
                        <motion.span
                          className="absolute inset-0 rounded-full bg-amber-400"
                          animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-widest mb-1">
                        Your weakest area
                      </p>
                      <h3 className="text-xl font-bold text-white truncate">{weakestSpec.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {weakestSpec.attempts} attempt{weakestSpec.attempts === 1 ? "" : "s"} ·{" "}
                        {weakestSpec.attempted}/{weakestSpec.total} cases seen
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Avg</p>
                      <p className="text-4xl font-extrabold bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent leading-none tabular-nums">
                        <CountUp value={weakestSpec.avgScore} suffix="%" duration={1100} />
                      </p>
                      {trend !== null && (
                        <p
                          className={`text-xs mt-1 font-semibold ${
                            trend >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {trend >= 0 ? "↗" : "↘"} {Math.abs(trend)}%{" "}
                          <span className="text-slate-500 font-normal">vs prior 5</span>
                        </p>
                      )}
                    </div>
                    <motion.button
                      onClick={onBack}
                      whileHover={reduce ? undefined : { scale: 1.04, x: 2 }}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      className="px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-100 font-semibold text-sm whitespace-nowrap"
                    >
                      Drill this →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Subspecialty Performance */}
            <motion.div
              className="glass-card rounded-2xl p-6 mb-8"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              <h2 className="text-lg font-bold text-white mb-4">Performance by Subspecialty</h2>
              <motion.div
                className="space-y-4"
                variants={stagger(0.05, 0.1)}
                initial="hidden"
                animate="show"
              >
                {subspecialtyStats.map((stat) => (
                  <motion.div key={stat.id} variants={fadeUp} className="flex items-center gap-4">
                    <div className="w-48 shrink-0">
                      <p className="text-sm font-medium text-white truncate">{stat.name}</p>
                      <p className="text-xs text-slate-400">
                        {stat.attempted}/{stat.total} cases &bull; {stat.attempts} attempts
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            stat.avgScore >= 70
                              ? "bg-emerald-500"
                              : stat.avgScore >= 50
                              ? "bg-amber-500"
                              : stat.avgScore > 0
                              ? "bg-rose-500"
                              : "bg-slate-600"
                          }`}
                          initial={reduce ? { width: `${stat.avgScore}%` } : { width: 0 }}
                          animate={{ width: `${stat.avgScore}%` }}
                          transition={{ duration: 1, ease: easeOut, delay: 0.15 }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold w-12 text-right ${
                        stat.avgScore >= 70
                          ? "text-emerald-400"
                          : stat.avgScore >= 50
                          ? "text-amber-400"
                          : stat.avgScore > 0
                          ? "text-rose-400"
                          : "text-slate-500"
                      }`}
                    >
                      {stat.avgScore > 0 ? `${stat.avgScore}%` : "---"}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Recent Attempts — timeline */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
                {progress.recentAttempts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    No attempts yet. Start practicing!
                  </p>
                ) : (
                  <ol className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-slate-700/70">
                    {progress.recentAttempts.slice(0, 8).map((attempt, i) => {
                      const caseData = database.subspecialties
                        .flatMap((s) => s.cases)
                        .find((c) => c.id === attempt.caseId);
                      const grade = calculateGrade(attempt.percentageScore);
                      const dotColor =
                        attempt.percentageScore >= 70
                          ? "bg-emerald-400"
                          : attempt.percentageScore >= 50
                          ? "bg-amber-400"
                          : "bg-rose-400";
                      const d = new Date(attempt.timestamp);
                      const timeChip = `${d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}`;
                      return (
                        <motion.li
                          key={i}
                          initial={reduce ? false : { opacity: 0, x: 30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                          transition={{ duration: 0.45, ease: easeOut, delay: i * 0.04 }}
                          className="relative"
                        >
                          <span
                            className={`absolute -left-[11px] top-2 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${dotColor}`}
                          />
                          <button
                            onClick={() => caseData && onSelectCase(caseData)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/30 transition-colors text-left"
                          >
                            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1 rounded-md bg-slate-900/60 border border-slate-700/50">
                              {timeChip}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {caseData?.title || attempt.caseId}
                              </p>
                              <p className={`text-xs ${getGradeColor(grade)}`}>Grade {grade}</p>
                            </div>
                            <div
                              className={`shrink-0 px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums ${
                                attempt.percentageScore >= 70
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : attempt.percentageScore >= 50
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {attempt.percentageScore}%
                            </div>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ol>
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
                        <motion.button
                          key={i}
                          variants={slideInRight}
                          initial="hidden"
                          whileInView="show"
                          viewport={{ once: true }}
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
                        </motion.button>
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
          </>
        )}

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
