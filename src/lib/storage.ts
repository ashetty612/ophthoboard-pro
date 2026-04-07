import { CaseAttempt, StudyProgress } from './types';

const STORAGE_KEY = 'ophtho_boards_progress';
const ATTEMPTS_KEY = 'ophtho_boards_attempts';
const BOOKMARKS_KEY = 'ophtho_boards_bookmarks';
const STREAK_KEY = 'ophtho_boards_streak';

export function saveAttempt(attempt: CaseAttempt): void {
  if (typeof window === 'undefined') return;
  const attempts = getAttempts();
  attempts.push(attempt);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  updateProgress(attempts);
}

export function getAttempts(): CaseAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ATTEMPTS_KEY);
    return data ? JSON.parse(data) : [];
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
    return data ? JSON.parse(data) : getDefaultProgress();
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
  const scores = attempts.map(a => a.percentageScore);

  const bySubspecialty: StudyProgress['bySubspecialty'] = {};

  for (const attempt of attempts) {
    const subspecialty = attempt.caseId.split('-').slice(0, -1).join('-');
    const specName = getSubspecialtyName(subspecialty);

    if (!bySubspecialty[specName]) {
      bySubspecialty[specName] = {
        attempted: 0,
        total: getSubspecialtyTotal(specName),
        averageScore: 0,
        lastAttempt: attempt.timestamp,
      };
    }

    bySubspecialty[specName].attempted = new Set(
      attempts.filter(a => a.caseId.startsWith(subspecialty)).map(a => a.caseId)
    ).size;

    const specScores = attempts
      .filter(a => a.caseId.startsWith(subspecialty))
      .map(a => a.percentageScore);
    bySubspecialty[specName].averageScore =
      Math.round(specScores.reduce((a, b) => a + b, 0) / specScores.length);
    bySubspecialty[specName].lastAttempt = attempt.timestamp;
  }

  // Determine weak and strong areas
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getSubspecialtyName(prefix: string): string {
  const map: { [key: string]: string } = {
    'as': 'Anterior Segment',
    'ps': 'Posterior Segment',
    'no': 'Neuro-Ophthalmology and Orbit',
    'po': 'Pediatric Ophthalmology',
    'op': 'Optics',
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
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return index < 0;
}

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(caseId: string): boolean {
  return getBookmarks().includes(caseId);
}

export function getStudyStreak(): { current: number; lastDate: string } {
  if (typeof window === 'undefined') return { current: 0, lastDate: '' };
  try {
    const data = localStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { current: 0, lastDate: '' };
  } catch {
    return { current: 0, lastDate: '' };
  }
}

export function updateStudyStreak(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().split('T')[0];
  const streak = getStudyStreak();

  if (streak.lastDate === today) return streak.current;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = streak.lastDate === yesterday ? streak.current + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ current: newStreak, lastDate: today }));
  return newStreak;
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(STREAK_KEY);
}
