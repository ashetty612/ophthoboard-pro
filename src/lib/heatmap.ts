/**
 * Performance heatmap analytics.
 *
 * Buckets every saved answer by (subspecialty × ABO-scoring axis) and computes
 * a mean percent per cell. Pure function over localStorage reads — SSR-safe.
 *
 * Question-number → axis mapping (per ABO's 3 scoring domains):
 *   Q2 (History), Q3 (Exam)                       → 'dataAcq'
 *   Q1 (Differential), Q4 (Workup), Q5 (Diagnosis) → 'dx'
 *   Q6 (Management/Follow-up) + photoDescription   → 'mgmt'
 */
import { getAttempts } from './storage';
import type { CaseAttempt } from './types';

export type AboAxis = 'dataAcq' | 'dx' | 'mgmt';

export interface HeatmapCell {
  subspecialty: string;
  axis: AboAxis;
  averagePercent: number; // 0-100
  sampleCount: number;
  lastAttemptAt?: string;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  subspecialties: string[];
  axes: AboAxis[];
  totalAttempts: number;
  weakestCell: HeatmapCell | null;
  strongestCell: HeatmapCell | null;
}

export const MIN_HEATMAP_SAMPLES = 3;

// Stable canonical axis ordering — columns in the UI.
const AXES: AboAxis[] = ['dataAcq', 'dx', 'mgmt'];

// Stable canonical row ordering — matches the 5 subspecialties in storage.ts.
const CANONICAL_SUBSPECIALTIES = [
  'Anterior Segment',
  'Posterior Segment',
  'Neuro-Ophthalmology and Orbit',
  'Pediatric Ophthalmology',
  'Optics',
];

const SUBSPECIALTY_PREFIX_MAP: { [prefix: string]: string } = {
  as: 'Anterior Segment',
  ps: 'Posterior Segment',
  no: 'Neuro-Ophthalmology and Orbit',
  po: 'Pediatric Ophthalmology',
  ped: 'Pediatric Ophthalmology',
  op: 'Optics',
  opt: 'Optics',
};

function caseIdToSubspecialty(caseId: string): string | null {
  if (typeof caseId !== 'string' || !caseId) return null;
  const prefix = caseId.split('-')[0];
  return SUBSPECIALTY_PREFIX_MAP[prefix] || null;
}

function questionNumberToAxis(n: number): AboAxis | null {
  switch (n) {
    case 2:
    case 3:
      return 'dataAcq';
    case 1:
    case 4:
    case 5:
      return 'dx';
    case 6:
      return 'mgmt';
    default:
      return null;
  }
}

interface Bucket {
  samples: number[]; // each 0-100
  lastAt?: string;
}

/**
 * Compute the heatmap from persisted attempts. Pass `attempts` explicitly for
 * testability; if omitted, reads from localStorage.
 */
export function computeHeatmap(attemptsOverride?: CaseAttempt[]): HeatmapData {
  const attempts = attemptsOverride ?? getAttempts();

  // Pre-seed buckets for every canonical (subspecialty × axis) pair so the
  // grid is rectangular even when some cells have no data.
  const buckets = new Map<string, Bucket>();
  const key = (sub: string, axis: AboAxis) => `${sub}::${axis}`;
  for (const sub of CANONICAL_SUBSPECIALTIES) {
    for (const axis of AXES) {
      buckets.set(key(sub, axis), { samples: [] });
    }
  }

  for (const attempt of attempts) {
    if (!attempt || typeof attempt !== 'object') continue;
    const sub = caseIdToSubspecialty(attempt.caseId);
    if (!sub) continue;
    const ts = typeof attempt.timestamp === 'string' ? attempt.timestamp : undefined;

    // photoDescription feeds the 'mgmt' axis (per spec). We store it as a
    // percent relative to a nominal max of 10. A score of 0 means "not
    // scored / no photo" — don't count it as a sample; only non-zero
    // scores contribute to the mgmt rolling average.
    if (typeof attempt.photoDescriptionScore === 'number' && !isNaN(attempt.photoDescriptionScore) && attempt.photoDescriptionScore > 0) {
      const pct = Math.max(0, Math.min(100, (attempt.photoDescriptionScore / 10) * 100));
      const b = buckets.get(key(sub, 'mgmt'));
      if (b) {
        b.samples.push(pct);
        if (ts && (!b.lastAt || ts > b.lastAt)) b.lastAt = ts;
      }
    }

    if (!Array.isArray(attempt.answers)) continue;
    for (const ans of attempt.answers) {
      if (!ans || typeof ans.questionNumber !== 'number') continue;
      if (typeof ans.maxScore !== 'number' || ans.maxScore <= 0) continue;
      if (typeof ans.score !== 'number') continue;
      const axis = questionNumberToAxis(ans.questionNumber);
      if (!axis) continue;
      const pct = (ans.score / ans.maxScore) * 100;
      const b = buckets.get(key(sub, axis));
      if (!b) continue;
      b.samples.push(pct);
      if (ts && (!b.lastAt || ts > b.lastAt)) b.lastAt = ts;
    }
  }

  const cells: HeatmapCell[] = [];
  for (const sub of CANONICAL_SUBSPECIALTIES) {
    for (const axis of AXES) {
      const b = buckets.get(key(sub, axis))!;
      const avg =
        b.samples.length > 0
          ? b.samples.reduce((a, v) => a + v, 0) / b.samples.length
          : 0;
      cells.push({
        subspecialty: sub,
        axis,
        averagePercent: Math.round(avg),
        sampleCount: b.samples.length,
        lastAttemptAt: b.lastAt,
      });
    }
  }

  // Weakest / strongest identification only considers cells meeting the
  // minimum-sample threshold — otherwise a single bad answer would dominate.
  const eligible = cells.filter((c) => c.sampleCount >= MIN_HEATMAP_SAMPLES);
  let weakestCell: HeatmapCell | null = null;
  let strongestCell: HeatmapCell | null = null;
  for (const c of eligible) {
    if (!weakestCell || c.averagePercent < weakestCell.averagePercent) weakestCell = c;
    if (!strongestCell || c.averagePercent > strongestCell.averagePercent) strongestCell = c;
  }

  return {
    cells,
    subspecialties: CANONICAL_SUBSPECIALTIES,
    axes: AXES,
    totalAttempts: Array.isArray(attempts) ? attempts.length : 0,
    weakestCell,
    strongestCell,
  };
}

/**
 * Human-readable axis label for UI display.
 */
export function axisLabel(axis: AboAxis): string {
  switch (axis) {
    case 'dataAcq':
      return 'Data Acquisition';
    case 'dx':
      return 'Diagnosis';
    case 'mgmt':
      return 'Management';
  }
}
