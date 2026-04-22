import { describe, it, expect } from 'vitest';
import {
  scoreAnswer,
  scorePhotoDescription,
  calculateGrade,
  getGradeColor,
} from '@/lib/scoring';
import type { Question } from '@/lib/types';

function makeQ(partial: Partial<Question> & { number: number }): Question {
  return {
    number: partial.number,
    question: partial.question ?? 'q',
    answer: partial.answer ?? 'a',
    keyPoints: partial.keyPoints ?? [],
    scoringKeywords: partial.scoringKeywords ?? [],
  };
}

describe('scoreAnswer — core matching', () => {
  it('exact keyword match scores full points', () => {
    const q = makeQ({ number: 5, scoringKeywords: ['prednisolone', 'cycloplegic', 'topical steroid'] });
    const result = scoreAnswer(q, 'Start prednisolone 1% q1h and a cycloplegic drop. Topical steroid is mainstay.');
    expect(result.score).toBe(result.maxScore);
    expect(result.matchedKeywords.length).toBe(3);
    expect(result.missedKeywords).toEqual([]);
  });

  it('empty answer returns 0 and lists all missed keywords', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['uveitis', 'scleritis'] });
    const result = scoreAnswer(q, '');
    expect(result.score).toBe(0);
    expect(result.matchedKeywords).toEqual([]);
    expect(result.missedKeywords).toEqual(['uveitis', 'scleritis']);
  });

  it('whitespace-only answer returns 0', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['uveitis'] });
    const result = scoreAnswer(q, '   \n  \t ');
    expect(result.score).toBe(0);
  });

  it('empty keywords returns full score (theoretical questions)', () => {
    const q = makeQ({ number: 2, scoringKeywords: [], keyPoints: [] });
    const result = scoreAnswer(q, 'any answer at all');
    expect(result.score).toBe(result.maxScore);
  });

  it('uses keyPoints as fallback when scoringKeywords empty', () => {
    const q = makeQ({ number: 1, scoringKeywords: [], keyPoints: ['glaucoma'] });
    const result = scoreAnswer(q, 'This is glaucoma.');
    expect(result.matchedKeywords).toContain('glaucoma');
  });

  it('"not applicable" keywords are skipped', () => {
    const q = makeQ({ number: 3, scoringKeywords: ['Not applicable'] });
    const result = scoreAnswer(q, 'nothing relevant here');
    expect(result.score).toBe(result.maxScore);
  });
});

describe('scoreAnswer — synonym matching', () => {
  it('HZO abbreviation finds "herpes zoster ophthalmicus"', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['herpes zoster ophthalmicus'] });
    const result = scoreAnswer(q, 'I suspect HZO given the vesicular rash.');
    expect(result.matchedKeywords).toContain('herpes zoster ophthalmicus');
  });

  it('"pink eye" matches conjunctivitis', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['conjunctivitis'] });
    const result = scoreAnswer(q, 'Looks like pink eye.');
    expect(result.matchedKeywords).toContain('conjunctivitis');
  });

  it('"RD" matches retinal detachment', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['retinal detachment'] });
    const result = scoreAnswer(q, 'Rhegmatogenous RD, mac-on.');
    expect(result.matchedKeywords).toContain('retinal detachment');
  });

  it('"AMD" matches macular degeneration', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['macular degeneration'] });
    const result = scoreAnswer(q, 'Wet AMD with CNV on OCT.');
    expect(result.matchedKeywords).toContain('macular degeneration');
  });
});

describe('scoreAnswer — word-boundary safety', () => {
  it('short synonym "on" (optic neuritis) does NOT match inside "observation"', () => {
    // "on" is a listed synonym of optic neuritis. We must NOT match it inside
    // words like "observation".
    const q = makeQ({ number: 5, scoringKeywords: ['optic neuritis'] });
    const result = scoreAnswer(q, 'Recommend observation only at this point.');
    expect(result.matchedKeywords).not.toContain('optic neuritis');
  });

  it('short synonym "et" (esotropia) does NOT match inside "etiology"', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['esotropia'] });
    const result = scoreAnswer(q, 'Discuss etiology with parents.');
    expect(result.matchedKeywords).not.toContain('esotropia');
  });
});

describe('scoreAnswer — typo / Levenshtein tolerance', () => {
  it('typo "keratitiss" matches keratitis', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['keratitis'] });
    const result = scoreAnswer(q, 'Bacterial keratitiss suspected.');
    expect(result.matchedKeywords).toContain('keratitis');
  });

  it('case-insensitive matching (HZO / hzo)', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['HZO'] });
    const result = scoreAnswer(q, 'hzo with hutchinson sign');
    expect(result.matchedKeywords).toContain('HZO');
  });
});

describe('scoreAnswer — stemming regression', () => {
  it('keratitis must NOT stem to "kerat" and falsely match keratoconus', () => {
    const q = makeQ({ number: 1, scoringKeywords: ['keratoconus'] });
    const result = scoreAnswer(q, 'Patient has keratitis.');
    expect(result.matchedKeywords).not.toContain('keratoconus');
  });
});

describe('scoreAnswer — scoring curve & feedback', () => {
  it('80%+ match receives bonus curve boost', () => {
    const q = makeQ({
      number: 5,
      scoringKeywords: ['timolol', 'brimonidine', 'latanoprost', 'acetazolamide', 'mannitol'],
    });
    const result = scoreAnswer(q, 'Start timolol, brimonidine, latanoprost, and acetazolamide.');
    // 4/5 = 80%, adjusted = 0.8 + (0.2 * 0.2) = 0.84
    expect(result.score).toBeGreaterThanOrEqual(Math.round(0.84 * result.maxScore));
  });

  it('low match (~25%) produces "Unacceptable" feedback', () => {
    const q = makeQ({
      number: 1,
      scoringKeywords: ['xerophthalmia', 'pseudoexfoliation', 'pemphigoid', 'dermatochalasis'],
    });
    const result = scoreAnswer(q, 'Some vague answer about xerophthalmia only.');
    expect(result.feedback).toContain('Unacceptable');
  });

  it('90%+ match produces "Above Expected" feedback', () => {
    const q = makeQ({
      number: 5,
      scoringKeywords: ['prednisolone', 'cycloplegic', 'doxycycline'],
    });
    const result = scoreAnswer(q, 'Prednisolone, cycloplegic, and doxycycline.');
    expect(result.feedback).toContain('Above Expected');
  });
});

describe('scorePhotoDescription', () => {
  it('boosts score when description covers key visual findings', () => {
    const correct = 'Slit lamp photo of the right eye showing a large corneal ulcer with dense stromal infiltrate and hypopyon.';
    const user = 'Right eye with large corneal ulcer, dense stromal infiltrate, and hypopyon visible.';
    const result = scorePhotoDescription(user, correct);
    expect(result.score).toBeGreaterThanOrEqual(6);
    expect(result.maxScore).toBe(10);
    expect(result.feedback).toContain('Excellent');
  });

  it('empty description returns 0', () => {
    const result = scorePhotoDescription('', 'anything');
    expect(result.score).toBe(0);
  });

  it('poor description produces low score and unhelpful feedback', () => {
    const result = scorePhotoDescription('eye', 'Optical coherence tomography of macula showing subretinal fluid, pigment epithelial detachment, and drusen.');
    expect(result.score).toBeLessThan(5);
  });
});

describe('calculateGrade', () => {
  it('maps scores to grade bands', () => {
    expect(calculateGrade(95)).toBe('Above Expected');
    expect(calculateGrade(85)).toBe('Excellent');
    expect(calculateGrade(75)).toBe('Expected');
    expect(calculateGrade(65)).toBe('Borderline');
    expect(calculateGrade(55)).toBe('Below Expected');
    expect(calculateGrade(30)).toBe('Unacceptable');
  });
});

describe('getGradeColor', () => {
  it('returns distinct tailwind colors per grade', () => {
    expect(getGradeColor('Above Expected')).toBe('text-emerald-400');
    expect(getGradeColor('Expected')).toBe('text-primary-400');
    expect(getGradeColor('Unacceptable')).toBe('text-rose-400');
    expect(getGradeColor('Unknown Grade')).toBe('text-slate-400');
  });
});
