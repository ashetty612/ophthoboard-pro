import { CaseAttempt, StudyProgress } from './types';

const STORAGE_KEY = 'ophtho_boards_progress';
const ATTEMPTS_KEY = 'ophtho_boards_attempts';
const BOOKMARKS_KEY = 'ophtho_boards_bookmarks';
const STREAK_KEY = 'ophtho_boards_streak';
const MAX_ATTEMPTS = 500; // Prune oldest attempts when exceeding this limit

// Safe localStorage write — handles QuotaExceededError gracefully
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // QuotaExceededError or other write failure — try pruning old data
    try {
      const attempts = getAttempts();
      if (attempts.length > 50) {
        // Remove oldest half of attempts to free space
        const pruned = attempts.slice(Math.floor(attempts.length / 2));
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(pruned));
        // Retry the original write
        localStorage.setItem(key, value);
        return true;
      }
    } catch {
      // Storage is truly full — fail silently rather than crash
    }
    return false;
  }
}

export function saveAttempt(attempt: CaseAttempt): void {
  if (typeof window === 'undefined') return;
  const attempts = getAttempts();
  attempts.push(attempt);

  // Prune if exceeding max to prevent unbounded growth
  const pruned = attempts.length > MAX_ATTEMPTS
    ? attempts.slice(attempts.length - MAX_ATTEMPTS)
    : attempts;

  safeSetItem(ATTEMPTS_KEY, JSON.stringify(pruned));
  updateProgress(pruned);
}

export function getAttempts(): CaseAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ATTEMPTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Validate it's an array
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAttemptsForCase(caseId: string): CaseAttempt[] {
  return getAttempts().filter(a => a.caseId === caseId);
}

export function getProgress(): StudyProgress {
  if (typeof window === 'undefined') return getDefaultProgress();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultProgress();
    const parsed = JSON.parse(data);
    // Basic schema validation
    if (typeof parsed === 'object' && parsed !== null && 'totalCasesAttempted' in parsed) {
      return parsed as StudyProgress;
    }
    return getDefaultProgress();
  } catch {
    return getDefaultProgress();
  }
}

function getDefaultProgress(): StudyProgress {
  return {
    totalCasesAttempted: 0,
    totalCasesAvailable: 350,
    averageScore: 0,
    bestScore: 0,
    worstScore: 0,
    bySubspecialty: {},
    recentAttempts: [],
    weakAreas: [],
    strongAreas: [],
  };
}

function updateProgress(attempts: CaseAttempt[]): void {
  const uniqueCases = new Set(attempts.map(a => a.caseId));
  const scores = attempts.map(a => a.percentageScore).filter(s => typeof s === 'number' && !isNaN(s));

  const bySubspecialty: StudyProgress['bySubspecialty'] = {};

  // Group attempts by subspecialty name so we scan the list once (previously O(N²)).
  // Multiple prefixes can map to the same specName (e.g. 'po' and 'ped' →
  // "Pediatric Ophthalmology"), so we merge them into a single bucket.
  const caseIdsBySpec: Record<string, Set<string>> = {};
  const scoreSumBySpec: Record<string, { sum: number; count: number }> = {};
  const lastAttemptBySpec: Record<string, string> = {};
  for (const attempt of attempts) {
    const prefix = attempt.caseId.split('-').slice(0, -1).join('-');
    const specName = getSubspecialtyName(prefix);
    if (!caseIdsBySpec[specName]) {
      caseIdsBySpec[specName] = new Set();
      scoreSumBySpec[specName] = { sum: 0, count: 0 };
      lastAttemptBySpec[specName] = attempt.timestamp;
    }
    caseIdsBySpec[specName].add(attempt.caseId);
    if (typeof attempt.percentageScore === 'number' && !isNaN(attempt.percentageScore)) {
      scoreSumBySpec[specName].sum += attempt.percentageScore;
      scoreSumBySpec[specName].count += 1;
    }
    if (attempt.timestamp > lastAttemptBySpec[specName]) {
      lastAttemptBySpec[specName] = attempt.timestamp;
    }
  }
  for (const specName of Object.keys(caseIdsBySpec)) {
    const { sum, count } = scoreSumBySpec[specName];
    bySubspecialty[specName] = {
      attempted: caseIdsBySpec[specName].size,
      total: getSubspecialtyTotal(specName),
      averageScore: count > 0 ? Math.round(sum / count) : 0,
      lastAttempt: lastAttemptBySpec[specName],
    };
  }

  const weakAreas: string[] = [];
  const strongAreas: string[] = [];
  for (const [name, data] of Object.entries(bySubspecialty)) {
    if (data.averageScore < 60) weakAreas.push(name);
    else if (data.averageScore >= 80) strongAreas.push(name);
  }

  const progress: StudyProgress = {
    totalCasesAttempted: uniqueCases.size,
    totalCasesAvailable: 350,
    averageScore: scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    worstScore: scores.length > 0 ? Math.min(...scores) : 0,
    bySubspecialty,
    recentAttempts: attempts.slice(-10).reverse(),
    weakAreas,
    strongAreas,
  };

  safeSetItem(STORAGE_KEY, JSON.stringify(progress));
}

function getSubspecialtyName(prefix: string): string {
  const map: { [key: string]: string } = {
    'as': 'Anterior Segment',
    'ps': 'Posterior Segment',
    'no': 'Neuro-Ophthalmology and Orbit',
    'po': 'Pediatric Ophthalmology',
    'ped': 'Pediatric Ophthalmology',
    'op': 'Optics',
    'opt': 'Optics',
  };
  return map[prefix] || prefix;
}

function getSubspecialtyTotal(name: string): number {
  const map: { [key: string]: number } = {
    'Anterior Segment': 109,
    'Posterior Segment': 65,
    'Neuro-Ophthalmology and Orbit': 61,
    'Pediatric Ophthalmology': 45,
    'Optics': 70,
  };
  return map[name] || 0;
}

export function toggleBookmark(caseId: string): boolean {
  if (typeof window === 'undefined') return false;
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(caseId);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(caseId);
  }
  safeSetItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return index < 0;
}

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isBookmarked(caseId: string): boolean {
  return getBookmarks().includes(caseId);
}

// Use LOCAL date for streak calculation (not UTC)
function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getLocalYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

export function getStudyStreak(): { current: number; lastDate: string } {
  if (typeof window === 'undefined') return { current: 0, lastDate: '' };
  try {
    const data = localStorage.getItem(STREAK_KEY);
    if (!data) return { current: 0, lastDate: '' };
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null && 'current' in parsed) {
      return parsed;
    }
    return { current: 0, lastDate: '' };
  } catch {
    return { current: 0, lastDate: '' };
  }
}

export function updateStudyStreak(): number {
  if (typeof window === 'undefined') return 0;
  const today = getLocalDateString();
  const streak = getStudyStreak();

  if (streak.lastDate === today) return streak.current;

  const yesterday = getLocalYesterdayString();
  const newStreak = streak.lastDate === yesterday ? streak.current + 1 : 1;
  safeSetItem(STREAK_KEY, JSON.stringify({ current: newStreak, lastDate: today }));
  return newStreak;
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(STREAK_KEY);
}
