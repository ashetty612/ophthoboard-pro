import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveAttempt,
  getAttempts,
  safeSetItem,
  getStudyStreak,
  updateStudyStreak,
  clearAllData,
  toggleBookmark,
  isBookmarked,
} from '@/lib/storage';
import type { CaseAttempt } from '@/lib/types';

function mkAttempt(caseId: string, percentageScore = 80, ts = new Date().toISOString()): CaseAttempt {
  return {
    caseId,
    timestamp: ts,
    photoDescriptionAnswer: '',
    photoDescriptionScore: 0,
    answers: [],
    totalScore: 80,
    maxPossibleScore: 100,
    percentageScore,
    grade: 'Excellent',
    timeSpentSeconds: 60,
  };
}

describe('storage — attempts', () => {
  beforeEach(() => localStorage.clear());

  it('saveAttempt persists to localStorage', () => {
    saveAttempt(mkAttempt('as-1'));
    const back = getAttempts();
    expect(back.length).toBe(1);
    expect(back[0].caseId).toBe('as-1');
  });

  it('getAttempts returns [] when no data', () => {
    expect(getAttempts()).toEqual([]);
  });

  it('getAttempts returns [] when data is malformed', () => {
    localStorage.setItem('ophtho_boards_attempts', '{not valid json');
    expect(getAttempts()).toEqual([]);
  });
});

describe('storage — safeSetItem quota handling', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('returns true on normal write', () => {
    expect(safeSetItem('k', 'v')).toBe(true);
    expect(localStorage.getItem('k')).toBe('v');
  });

  it('prunes old attempts on QuotaExceeded', () => {
    // Seed 100 attempts
    const many = Array.from({ length: 100 }, (_, i) => mkAttempt(`c-${i}`));
    localStorage.setItem('ophtho_boards_attempts', JSON.stringify(many));

    // First setItem throws; second call (after pruning) succeeds.
    const real = Storage.prototype.setItem;
    let callCount = 0;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      k: string,
      v: string
    ) {
      callCount++;
      if (callCount === 1) {
        const err = new Error('QuotaExceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      real.call(this, k, v);
    });

    const ok = safeSetItem('new-key', 'new-value');
    expect(ok).toBe(true);
    // Pruned array should be shorter than 100
    const pruned = JSON.parse(localStorage.getItem('ophtho_boards_attempts') || '[]');
    expect(pruned.length).toBeLessThan(100);
    spy.mockRestore();
  });

  it('returns false when truly out of space', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('Quota');
      err.name = 'QuotaExceededError';
      throw err;
    });
    const ok = safeSetItem('k', 'v');
    expect(ok).toBe(false);
    spy.mockRestore();
  });
});

describe('storage — study streak', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('getStudyStreak returns default when empty', () => {
    expect(getStudyStreak()).toEqual({ current: 0, lastDate: '' });
  });

  it('updateStudyStreak starts at 1 on first call', () => {
    const n = updateStudyStreak();
    expect(n).toBe(1);
    expect(getStudyStreak().current).toBe(1);
  });

  it('updateStudyStreak bumps consecutive days correctly', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 0, 10, 12, 0, 0)); // Jan 10, noon
    expect(updateStudyStreak()).toBe(1);

    vi.setSystemTime(new Date(2026, 0, 11, 12, 0, 0)); // Jan 11 — consecutive
    expect(updateStudyStreak()).toBe(2);

    vi.setSystemTime(new Date(2026, 0, 12, 12, 0, 0)); // Jan 12 — consecutive
    expect(updateStudyStreak()).toBe(3);

    // Gap of 2 days → streak resets to 1
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    expect(updateStudyStreak()).toBe(1);
  });

  it('updateStudyStreak is idempotent within the same day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 21, 9, 0, 0));
    expect(updateStudyStreak()).toBe(1);
    // later same day — no bump
    vi.setSystemTime(new Date(2026, 3, 21, 23, 0, 0));
    expect(updateStudyStreak()).toBe(1);
  });
});

describe('storage — bookmarks', () => {
  beforeEach(() => localStorage.clear());

  it('toggleBookmark adds then removes', () => {
    expect(isBookmarked('c1')).toBe(false);
    const added = toggleBookmark('c1');
    expect(added).toBe(true);
    expect(isBookmarked('c1')).toBe(true);
    const removed = toggleBookmark('c1');
    expect(removed).toBe(false);
    expect(isBookmarked('c1')).toBe(false);
  });
});

describe('storage — clearAllData', () => {
  it('removes all known keys', () => {
    saveAttempt(mkAttempt('c1'));
    toggleBookmark('c1');
    updateStudyStreak();
    clearAllData();
    expect(getAttempts()).toEqual([]);
    expect(isBookmarked('c1')).toBe(false);
    expect(getStudyStreak().current).toBe(0);
  });
});
