/**
 * Weakness-targeted quiz generation.
 *
 * Pure analytics over the user's progress + attempt history. No side effects,
 * no localStorage access — callers pass data in. This keeps it trivially
 * unit-testable and SSR-safe.
 */
import { CasesDatabase, CaseData, CaseAttempt, StudyProgress } from './types';
import { QUESTION_TYPE_INFO } from './pearls';

export interface WeaknessReport {
  weakestSubspecialty: string | null;
  weakestSubspecialtyAvg: number;
  weakestPmpElement: { number: number; name: string; avgScore: number } | null;
  leastAttempted: string[]; // subspecialty names with attempted < 5
}

const MIN_SUBSPECIALTY_SAMPLES = 3;
const MIN_PMP_SAMPLES = 5;
const LOW_MASTERY_THRESHOLD = 70; // percent

export function analyzeWeaknesses(
  progress: StudyProgress,
  attempts: CaseAttempt[]
): WeaknessReport {
  // Weakest subspecialty: lowest averageScore among those with >= MIN samples.
  let weakestSubspecialty: string | null = null;
  let weakestSubspecialtyAvg = 0;

  const subEntries = Object.entries(progress.bySubspecialty || {});
  const eligible = subEntries.filter(([, s]) => s.attempted >= MIN_SUBSPECIALTY_SAMPLES);

  if (eligible.length > 0) {
    const sorted = [...eligible].sort((a, b) => a[1].averageScore - b[1].averageScore);
    weakestSubspecialty = sorted[0][0];
    weakestSubspecialtyAvg = sorted[0][1].averageScore;
  }

  const leastAttempted = subEntries
    .filter(([, s]) => s.attempted < 5)
    .map(([name]) => name);

  // PMP-element analysis: bucket every answer by questionNumber, compute % per
  // answer (score/maxScore), then average per bucket. Pick lowest bucket with
  // >= MIN_PMP_SAMPLES.
  const buckets: { [n: number]: number[] } = {};
  for (const attempt of attempts) {
    if (!attempt || !Array.isArray(attempt.answers)) continue;
    for (const ans of attempt.answers) {
      if (!ans || typeof ans.questionNumber !== 'number') continue;
      if (typeof ans.maxScore !== 'number' || ans.maxScore <= 0) continue;
      if (typeof ans.score !== 'number') continue;
      const pct = (ans.score / ans.maxScore) * 100;
      if (!buckets[ans.questionNumber]) buckets[ans.questionNumber] = [];
      buckets[ans.questionNumber].push(pct);
    }
  }

  let weakestPmpElement: WeaknessReport['weakestPmpElement'] = null;
  let lowestAvg = Infinity;
  for (const [numStr, samples] of Object.entries(buckets)) {
    if (samples.length < MIN_PMP_SAMPLES) continue;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    if (avg < lowestAvg) {
      const num = Number(numStr);
      const info = QUESTION_TYPE_INFO[num];
      if (!info) continue;
      lowestAvg = avg;
      weakestPmpElement = {
        number: num,
        name: info.name,
        avgScore: Math.round(avg),
      };
    }
  }

  return {
    weakestSubspecialty,
    weakestSubspecialtyAvg,
    weakestPmpElement,
    leastAttempted,
  };
}

/**
 * Deterministic, date-seeded shuffle so the "today's quiz" is stable within
 * the day. Uses a tiny LCG — no deps. Same seed => same order.
 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    // LCG step (Numerical Recipes constants)
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function todaysSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function subspecialtyNameToId(database: CasesDatabase, name: string): string | null {
  const match = database.subspecialties.find((s) => s.name === name);
  return match ? match.id : null;
}

function hasStrongManagementTeaching(c: CaseData, pmpNumber: number): boolean {
  // QUESTION_TYPE_INFO: 5 = Management, 6 = Follow-Up. Both map to oral-boards
  // management/dispo content. Favor cases whose matching question has rich
  // teaching metadata or many scoring keywords.
  const q = c.questions.find((q) => q.number === pmpNumber);
  if (!q) return false;
  const hasTeaching = !!q.teaching && (
    (q.teaching.learningPoints?.length ?? 0) > 0 ||
    (q.teaching.acceptableAnswers?.length ?? 0) > 0
  );
  const richKeywords = (q.scoringKeywords?.length ?? 0) >= 5;
  return hasTeaching || richKeywords;
}

export function generateWeaknessQuiz(
  database: CasesDatabase,
  report: WeaknessReport,
  count: number = 10
): CaseData[] {
  // Pure-function default: no attempt data available here (callers with
  // attempt data should use generateWeaknessQuizWithAttempts).
  return generateWeaknessQuizWithAttempts(database, report, count, new Map());
}

/**
 * Variant that accepts the attempt map directly — the component computes it
 * once from localStorage and passes it in to stay pure-function at this layer.
 * (`generateWeaknessQuiz` above is the spec'd default.)
 */
export function generateWeaknessQuizWithAttempts(
  database: CasesDatabase,
  report: WeaknessReport,
  count: number,
  attemptedMap: Map<string, number> // caseId -> best percentageScore
): CaseData[] {
  const weakSubId = report.weakestSubspecialty
    ? subspecialtyNameToId(database, report.weakestSubspecialty)
    : null;

  const allActive = database.subspecialties.flatMap((s) =>
    s.cases.filter((c) => c.questions.length > 0)
  );

  // Primary pool: cases from the weakest subspecialty that are unattempted OR
  // scored < LOW_MASTERY_THRESHOLD.
  const primary: CaseData[] = weakSubId
    ? database.subspecialties
        .filter((s) => s.id === weakSubId)
        .flatMap((s) => s.cases.filter((c) => c.questions.length > 0))
        .filter((c) => {
          const best = attemptedMap.get(c.id);
          return best === undefined || best < LOW_MASTERY_THRESHOLD;
        })
    : [];

  // Bias: if weakest PMP element is Diagnosis (1), Management (5), or
  // Follow-Up (6), float cases with strong teaching content for that element
  // to the front of the primary pool.
  const biasNumber = report.weakestPmpElement?.number;
  const biasRelevant = biasNumber === 1 || biasNumber === 5 || biasNumber === 6;
  const primarySorted = biasRelevant && biasNumber
    ? [...primary].sort((a, b) => {
        const aStrong = hasStrongManagementTeaching(a, biasNumber) ? 1 : 0;
        const bStrong = hasStrongManagementTeaching(b, biasNumber) ? 1 : 0;
        return bStrong - aStrong;
      })
    : primary;

  const seed = todaysSeed();
  // Shuffle primary while preserving the "strong teaching" bucket bias:
  // split into two buckets, shuffle each, concatenate.
  let ordered: CaseData[];
  if (biasRelevant && biasNumber) {
    const strong = primarySorted.filter((c) => hasStrongManagementTeaching(c, biasNumber));
    const rest = primarySorted.filter((c) => !hasStrongManagementTeaching(c, biasNumber));
    ordered = [...seededShuffle(strong, seed), ...seededShuffle(rest, seed + 1)];
  } else {
    ordered = seededShuffle(primarySorted, seed);
  }

  const picked: CaseData[] = ordered.slice(0, count);

  // Fill from other weak subspecialties (or any unattempted cases) if short.
  if (picked.length < count) {
    const pickedIds = new Set(picked.map((c) => c.id));
    const leastAttemptedIds = new Set(
      report.leastAttempted
        .map((n) => subspecialtyNameToId(database, n))
        .filter((x): x is string => !!x)
    );
    const fallback = allActive.filter((c) => {
      if (pickedIds.has(c.id)) return false;
      const best = attemptedMap.get(c.id);
      if (best !== undefined && best >= LOW_MASTERY_THRESHOLD) return false;
      // Prefer least-attempted subspecialties first; other cases fall back too.
      return true;
    });
    const fallbackSorted = [...fallback].sort((a, b) => {
      const aLeast = leastAttemptedIds.has(a.subspecialty) || leastAttemptedIds.has(a.id) ? 1 : 0;
      const bLeast = leastAttemptedIds.has(b.subspecialty) || leastAttemptedIds.has(b.id) ? 1 : 0;
      return bLeast - aLeast;
    });
    const shuffledFallback = seededShuffle(fallbackSorted, seed + 2);
    for (const c of shuffledFallback) {
      if (picked.length >= count) break;
      picked.push(c);
    }
  }

  return picked;
}

/**
 * Helper: build caseId -> best percentageScore map from a flat attempt list.
 * Exported for the UI layer.
 */
export function buildAttemptedMap(attempts: CaseAttempt[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) {
    if (!a || typeof a.caseId !== 'string') continue;
    if (typeof a.percentageScore !== 'number') continue;
    const prev = m.get(a.caseId);
    if (prev === undefined || a.percentageScore > prev) {
      m.set(a.caseId, a.percentageScore);
    }
  }
  return m;
}
