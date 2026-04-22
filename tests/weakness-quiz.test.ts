import { describe, it, expect } from 'vitest';
import {
  analyzeWeaknesses,
  generateWeaknessQuizWithAttempts,
  buildAttemptedMap,
} from '@/lib/weakness-quiz';
import type { CaseAttempt, CasesDatabase, StudyProgress } from '@/lib/types';

function mkProgress(by: StudyProgress['bySubspecialty']): StudyProgress {
  return {
    totalCasesAttempted: 0,
    totalCasesAvailable: 0,
    averageScore: 0,
    bestScore: 0,
    worstScore: 0,
    bySubspecialty: by,
    recentAttempts: [],
    weakAreas: [],
    strongAreas: [],
  };
}

function mkDb(): CasesDatabase {
  const makeCase = (id: string, subId: string, subName: string) => ({
    id,
    caseNumber: 1,
    source: 't',
    title: id,
    subspecialty: subName,
    presentation: '',
    imageFile: null,
    imageFiles: [],
    photoDescription: '',
    questions: [
      {
        number: 1,
        question: 'q',
        answer: 'a',
        keyPoints: [],
        scoringKeywords: ['a', 'b'],
      },
    ],
  });

  return {
    metadata: { title: 't', editor: 'e', totalPages: 0, extractedAt: '' },
    subspecialties: [
      {
        id: 'as',
        name: 'Anterior Segment',
        cases: [
          makeCase('as-1', 'as', 'Anterior Segment'),
          makeCase('as-2', 'as', 'Anterior Segment'),
          makeCase('as-3', 'as', 'Anterior Segment'),
          makeCase('as-4', 'as', 'Anterior Segment'),
          makeCase('as-5', 'as', 'Anterior Segment'),
        ],
      },
      {
        id: 'ps',
        name: 'Posterior Segment',
        cases: [
          makeCase('ps-1', 'ps', 'Posterior Segment'),
          makeCase('ps-2', 'ps', 'Posterior Segment'),
        ],
      },
    ],
  };
}

describe('analyzeWeaknesses', () => {
  it('finds the weakest subspecialty when samples meet threshold', () => {
    const progress = mkProgress({
      'Anterior Segment': { attempted: 5, total: 10, averageScore: 40, lastAttempt: '' },
      'Posterior Segment': { attempted: 5, total: 10, averageScore: 80, lastAttempt: '' },
    });
    const report = analyzeWeaknesses(progress, []);
    expect(report.weakestSubspecialty).toBe('Anterior Segment');
    expect(report.weakestSubspecialtyAvg).toBe(40);
  });

  it('does NOT flag subspecialties with < 3 attempts', () => {
    const progress = mkProgress({
      'Anterior Segment': { attempted: 1, total: 10, averageScore: 20, lastAttempt: '' },
      'Posterior Segment': { attempted: 5, total: 10, averageScore: 70, lastAttempt: '' },
    });
    const report = analyzeWeaknesses(progress, []);
    // 'Anterior Segment' has only 1 attempt so it's ineligible; PS is the only eligible.
    expect(report.weakestSubspecialty).toBe('Posterior Segment');
  });

  it('returns null weakestSubspecialty when no data', () => {
    const progress = mkProgress({});
    const report = analyzeWeaknesses(progress, []);
    expect(report.weakestSubspecialty).toBeNull();
    expect(report.weakestSubspecialtyAvg).toBe(0);
  });

  it('flags least-attempted (< 5) subspecialties', () => {
    const progress = mkProgress({
      'Anterior Segment': { attempted: 3, total: 10, averageScore: 60, lastAttempt: '' },
      'Posterior Segment': { attempted: 10, total: 10, averageScore: 90, lastAttempt: '' },
    });
    const report = analyzeWeaknesses(progress, []);
    expect(report.leastAttempted).toContain('Anterior Segment');
    expect(report.leastAttempted).not.toContain('Posterior Segment');
  });

  it('identifies weakest PMP element from attempt bucket averages', () => {
    const attempts: CaseAttempt[] = [];
    // 5 attempts each on Q1 (30%) and Q5 (90%) → weakest should be Q1
    for (let i = 0; i < 5; i++) {
      attempts.push({
        caseId: `c-${i}`,
        timestamp: '',
        photoDescriptionAnswer: '',
        photoDescriptionScore: 0,
        answers: [
          { questionNumber: 1, answer: '', score: 3, maxScore: 10, matchedKeywords: [], missedKeywords: [], feedback: '' },
          { questionNumber: 5, answer: '', score: 9, maxScore: 10, matchedKeywords: [], missedKeywords: [], feedback: '' },
        ],
        totalScore: 0,
        maxPossibleScore: 0,
        percentageScore: 0,
        grade: '',
        timeSpentSeconds: 0,
      });
    }
    const report = analyzeWeaknesses(mkProgress({}), attempts);
    expect(report.weakestPmpElement?.number).toBe(1);
    expect(report.weakestPmpElement?.avgScore).toBe(30);
  });
});

describe('generateWeaknessQuizWithAttempts', () => {
  it('returns `count` cases from the weak subspecialty', () => {
    const db = mkDb();
    const report = {
      weakestSubspecialty: 'Anterior Segment',
      weakestSubspecialtyAvg: 40,
      weakestPmpElement: null,
      leastAttempted: [],
    };
    const picked = generateWeaknessQuizWithAttempts(db, report, 3, new Map());
    expect(picked.length).toBe(3);
    expect(picked.every((c) => c.id.startsWith('as-'))).toBe(true);
  });

  it('skips cases already mastered (>= 70%)', () => {
    const db = mkDb();
    const mastered = new Map<string, number>([
      ['as-1', 95],
      ['as-2', 90],
      ['as-3', 85],
      ['as-4', 80],
      ['as-5', 75],
    ]);
    const report = {
      weakestSubspecialty: 'Anterior Segment',
      weakestSubspecialtyAvg: 40,
      weakestPmpElement: null,
      leastAttempted: [],
    };
    const picked = generateWeaknessQuizWithAttempts(db, report, 3, mastered);
    // All AS cases are mastered → pool falls back to other subspecialties
    expect(picked.every((c) => !c.id.startsWith('as-'))).toBe(true);
  });
});

describe('buildAttemptedMap', () => {
  it('keeps best percentageScore per caseId', () => {
    const attempts: CaseAttempt[] = [
      { caseId: 'c1', percentageScore: 50 } as CaseAttempt,
      { caseId: 'c1', percentageScore: 80 } as CaseAttempt,
      { caseId: 'c1', percentageScore: 60 } as CaseAttempt,
      { caseId: 'c2', percentageScore: 40 } as CaseAttempt,
    ];
    const map = buildAttemptedMap(attempts);
    expect(map.get('c1')).toBe(80);
    expect(map.get('c2')).toBe(40);
  });

  it('ignores malformed attempts', () => {
    const attempts = [
      null,
      { caseId: 1, percentageScore: 50 },
      { caseId: 'ok', percentageScore: 'bad' },
      { caseId: 'ok2', percentageScore: 42 },
    ] as unknown as CaseAttempt[];
    const map = buildAttemptedMap(attempts);
    expect(map.get('ok2')).toBe(42);
    expect(map.has('ok')).toBe(false);
  });
});
