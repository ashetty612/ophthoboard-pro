import { describe, it, expect } from 'vitest';
import { computeHeatmap, axisLabel, MIN_HEATMAP_SAMPLES } from '@/lib/heatmap';
import type { CaseAttempt } from '@/lib/types';

function mkAttempt(
  caseId: string,
  answers: Array<{ q: number; pct: number }>,
  timestamp = '2025-01-01T00:00:00Z',
  photoDescriptionScore = 0
): CaseAttempt {
  return {
    caseId,
    timestamp,
    photoDescriptionAnswer: '',
    photoDescriptionScore,
    answers: answers.map((a) => ({
      questionNumber: a.q,
      answer: '',
      score: a.pct, // pretend maxScore=100 so pct math is trivial
      maxScore: 100,
      matchedKeywords: [],
      missedKeywords: [],
      feedback: '',
    })),
    totalScore: 0,
    maxPossibleScore: 0,
    percentageScore: 0,
    grade: '',
    timeSpentSeconds: 0,
  };
}

describe('computeHeatmap — empty state', () => {
  it('returns a valid rectangular grid with zero attempts', () => {
    const h = computeHeatmap([]);
    expect(h.totalAttempts).toBe(0);
    expect(h.subspecialties.length).toBe(5);
    expect(h.axes).toEqual(['dataAcq', 'dx', 'mgmt']);
    // 5 subspecialties × 3 axes = 15 cells
    expect(h.cells.length).toBe(15);
    // All cells should have 0 samples and be ineligible
    expect(h.cells.every((c) => c.sampleCount === 0)).toBe(true);
    expect(h.weakestCell).toBeNull();
    expect(h.strongestCell).toBeNull();
  });
});

describe('computeHeatmap — bucketing', () => {
  it('buckets Q2/Q3 into dataAcq, Q1/Q4/Q5 into dx, Q6 into mgmt', () => {
    // One AS attempt with a spread of question numbers.
    const attempts = [
      mkAttempt('as-1', [
        { q: 2, pct: 80 }, // dataAcq
        { q: 3, pct: 60 }, // dataAcq (avg dataAcq = 70)
        { q: 1, pct: 50 }, // dx
        { q: 4, pct: 50 }, // dx
        { q: 5, pct: 50 }, // dx (avg dx = 50)
        { q: 6, pct: 40 }, // mgmt
      ]),
    ];
    const h = computeHeatmap(attempts);
    const as = h.cells.filter((c) => c.subspecialty === 'Anterior Segment');
    const dataAcq = as.find((c) => c.axis === 'dataAcq')!;
    const dx = as.find((c) => c.axis === 'dx')!;
    const mgmt = as.find((c) => c.axis === 'mgmt')!;
    expect(dataAcq.sampleCount).toBe(2);
    expect(dataAcq.averagePercent).toBe(70);
    expect(dx.sampleCount).toBe(3);
    expect(dx.averagePercent).toBe(50);
    expect(mgmt.sampleCount).toBe(1); // Q6 only (no photoDescriptionScore)
    expect(mgmt.averagePercent).toBe(40);
  });
});

describe('computeHeatmap — sparse cells', () => {
  it('returns cells with <3 samples but marks them ineligible for weakest/strongest', () => {
    const attempts = [
      mkAttempt('ps-1', [{ q: 1, pct: 10 }]), // 1 sample in PS/dx
    ];
    const h = computeHeatmap(attempts);
    const ps = h.cells.find((c) => c.subspecialty === 'Posterior Segment' && c.axis === 'dx')!;
    expect(ps.sampleCount).toBe(1);
    expect(ps.sampleCount).toBeLessThan(MIN_HEATMAP_SAMPLES);
    // Not eligible → no weakest/strongest gets set
    expect(h.weakestCell).toBeNull();
    expect(h.strongestCell).toBeNull();
  });
});

describe('computeHeatmap — weakest/strongest', () => {
  it('identifies weakest and strongest cells among those with enough samples', () => {
    // AS/dataAcq: three 90% answers → strong
    // PS/dx: three 30% answers → weak
    const attempts = [
      mkAttempt('as-1', [
        { q: 2, pct: 90 },
        { q: 2, pct: 90 },
        { q: 2, pct: 90 },
      ]),
      mkAttempt('ps-1', [
        { q: 1, pct: 30 },
        { q: 1, pct: 30 },
        { q: 1, pct: 30 },
      ]),
    ];
    const h = computeHeatmap(attempts);
    expect(h.weakestCell).not.toBeNull();
    expect(h.weakestCell!.subspecialty).toBe('Posterior Segment');
    expect(h.weakestCell!.axis).toBe('dx');
    expect(h.weakestCell!.averagePercent).toBe(30);
    expect(h.strongestCell).not.toBeNull();
    expect(h.strongestCell!.subspecialty).toBe('Anterior Segment');
    expect(h.strongestCell!.axis).toBe('dataAcq');
    expect(h.strongestCell!.averagePercent).toBe(90);
  });
});

describe('computeHeatmap — date handling', () => {
  it('records the latest timestamp per cell as lastAttemptAt', () => {
    const attempts = [
      mkAttempt('as-1', [{ q: 2, pct: 50 }], '2025-01-10T00:00:00Z'),
      mkAttempt('as-2', [{ q: 2, pct: 60 }], '2025-03-15T00:00:00Z'),
      mkAttempt('as-3', [{ q: 2, pct: 70 }], '2025-02-01T00:00:00Z'),
    ];
    const h = computeHeatmap(attempts);
    const cell = h.cells.find((c) => c.subspecialty === 'Anterior Segment' && c.axis === 'dataAcq')!;
    expect(cell.sampleCount).toBe(3);
    expect(cell.lastAttemptAt).toBe('2025-03-15T00:00:00Z');
  });
});

describe('computeHeatmap — photo description feeds mgmt axis', () => {
  it('rolls photoDescriptionScore into the mgmt bucket as a percent of 10', () => {
    const attempts = [
      mkAttempt('ps-1', [], '2025-01-01T00:00:00Z', 8), // 80%
      mkAttempt('ps-2', [], '2025-01-02T00:00:00Z', 6), // 60%
      mkAttempt('ps-3', [], '2025-01-03T00:00:00Z', 4), // 40%
    ];
    const h = computeHeatmap(attempts);
    const mgmt = h.cells.find((c) => c.subspecialty === 'Posterior Segment' && c.axis === 'mgmt')!;
    expect(mgmt.sampleCount).toBe(3);
    expect(mgmt.averagePercent).toBe(60);
  });
});

describe('axisLabel', () => {
  it('returns human-readable names', () => {
    expect(axisLabel('dataAcq')).toBe('Data Acquisition');
    expect(axisLabel('dx')).toBe('Diagnosis');
    expect(axisLabel('mgmt')).toBe('Management');
  });
});
