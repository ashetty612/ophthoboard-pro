import { describe, it, expect, beforeEach } from 'vitest';
import {
  scheduleCard,
  getSrsCard,
  saveSrsCard,
  getAllSrsCards,
  getDueCards,
  rateCase,
} from '@/lib/srs';
import type { SrsCard } from '@/lib/types';

function freshCard(caseId = 'test-1'): SrsCard {
  return {
    caseId,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date().toISOString(),
    lastReview: new Date().toISOString(),
    lapses: 0,
  };
}

describe('scheduleCard — rating behavior', () => {
  it('new card + good → 1 day interval, repetitions=1', () => {
    const c = scheduleCard(null, 'good');
    expect(c.interval).toBe(1);
    expect(c.repetitions).toBe(1);
    expect(c.lapses).toBe(0);
  });

  it('good → good → good progression is roughly 1, 3, 8 days', () => {
    let c = scheduleCard(null, 'good');
    expect(c.interval).toBe(1);
    c = scheduleCard(c, 'good');
    expect(c.interval).toBe(3);
    c = scheduleCard(c, 'good');
    // 3 * 2.5 = 7.5 → rounds to 8
    expect(c.interval).toBe(8);
    c = scheduleCard(c, 'good');
    // 8 * 2.5 = 20
    expect(c.interval).toBe(20);
  });

  it('again on reps=3 card → 1 day, ease drops, lapses increments', () => {
    let c = scheduleCard(null, 'good');
    c = scheduleCard(c, 'good');
    c = scheduleCard(c, 'good');
    const easeBefore = c.ease;
    const lapsesBefore = c.lapses;
    c = scheduleCard(c, 'again');
    expect(c.interval).toBe(1);
    expect(c.repetitions).toBe(0);
    expect(c.lapses).toBe(lapsesBefore + 1);
    expect(c.ease).toBeLessThan(easeBefore);
  });

  it('hard slightly extends interval but drops ease', () => {
    let c = scheduleCard(null, 'good');
    c = scheduleCard(c, 'good'); // interval=3, ease=2.5
    const easeBefore = c.ease;
    c = scheduleCard(c, 'hard');
    // 3 * 1.2 = 3.6 → 4
    expect(c.interval).toBe(4);
    expect(c.ease).toBeLessThan(easeBefore);
  });

  it('easy extends aggressively and raises ease', () => {
    let c = scheduleCard(null, 'good');
    c = scheduleCard(c, 'good'); // interval=3, ease=2.5
    const intervalBefore = c.interval;
    const easeBefore = c.ease;
    c = scheduleCard(c, 'easy');
    expect(c.ease).toBeGreaterThan(easeBefore);
    expect(c.interval).toBeGreaterThan(intervalBefore * 2);
  });

  it('ease is clamped at minimum 1.3 on repeated "again"', () => {
    let c = freshCard();
    for (let i = 0; i < 20; i++) c = scheduleCard(c, 'again');
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
    expect(c.ease).toBeLessThanOrEqual(1.31); // within clamp floor
  });

  it('ease is clamped at maximum 3.0 on repeated "easy"', () => {
    // Call with caseId so dueDate calculations work even after several iterations;
    // we only need to verify ease clamp so limit iterations to keep dates valid.
    let c = freshCard();
    for (let i = 0; i < 5; i++) c = scheduleCard(c, 'easy');
    expect(c.ease).toBeLessThanOrEqual(3.0);
    expect(c.ease).toBeGreaterThanOrEqual(2.99);
  });
});

describe('SRS persistence', () => {
  beforeEach(() => localStorage.clear());

  it('saveSrsCard + getSrsCard roundtrip', () => {
    const c = { ...freshCard('case-42'), interval: 5 };
    saveSrsCard(c);
    const back = getSrsCard('case-42');
    expect(back).not.toBeNull();
    expect(back!.interval).toBe(5);
  });

  it('getSrsCard returns null for unknown id', () => {
    expect(getSrsCard('nope')).toBeNull();
  });

  it('saveSrsCard merges — never overwrites unrelated cards', () => {
    saveSrsCard(freshCard('a'));
    saveSrsCard(freshCard('b'));
    expect(getAllSrsCards().length).toBe(2);
  });

  it('rateCase creates a new card on first rating', () => {
    const card = rateCase('new-case', 'good');
    expect(card.interval).toBe(1);
    expect(getSrsCard('new-case')?.interval).toBe(1);
  });
});

describe('getDueCards', () => {
  beforeEach(() => localStorage.clear());

  it('returns only cards with dueDate ≤ today', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 5);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    saveSrsCard({ ...freshCard('due'), dueDate: yesterday.toISOString() });
    saveSrsCard({ ...freshCard('future'), dueDate: tomorrow.toISOString() });

    const due = getDueCards(today);
    const ids = due.map((c) => c.caseId);
    expect(ids).toContain('due');
    expect(ids).not.toContain('future');
  });
});
