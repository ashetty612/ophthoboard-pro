import type { CaseAttempt, StudyProgress, SrsCard } from "./types";
import { getAttempts, getProgress, getBookmarks, getStudyStreak, safeSetItem, clearAllData } from "./storage";
import { getAllSrsCards } from "./srs";

const STORAGE_KEY = "ophtho_boards_progress";
const ATTEMPTS_KEY = "ophtho_boards_attempts";
const BOOKMARKS_KEY = "ophtho_boards_bookmarks";
const STREAK_KEY = "ophtho_boards_streak";
const SRS_KEY = "ophtho_boards_srs";

export interface ExportBundle {
  version: "1";
  exportedAt: string;
  attempts: CaseAttempt[];
  progress: StudyProgress;
  bookmarks: string[];
  streak: { current: number; lastDate: string };
  srs: Record<string, SrsCard>;
}

export function exportUserData(): ExportBundle {
  const srsList = getAllSrsCards();
  const srs: Record<string, SrsCard> = {};
  for (const card of srsList) {
    srs[card.caseId] = card;
  }
  return {
    version: "1",
    exportedAt: new Date().toISOString(),
    attempts: getAttempts(),
    progress: getProgress(),
    bookmarks: getBookmarks(),
    streak: getStudyStreak(),
    srs,
  };
}

function isExportBundle(v: unknown): v is ExportBundle {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.version === "1" &&
    typeof o.exportedAt === "string" &&
    Array.isArray(o.attempts) &&
    Array.isArray(o.bookmarks) &&
    typeof o.progress === "object" &&
    typeof o.streak === "object" &&
    typeof o.srs === "object"
  );
}

export function importUserData(bundle: ExportBundle): { success: boolean; message: string } {
  if (typeof window === "undefined") {
    return { success: false, message: "Import requires a browser environment." };
  }
  if (!isExportBundle(bundle)) {
    return { success: false, message: "Invalid backup file — unsupported shape or version." };
  }
  try {
    safeSetItem(ATTEMPTS_KEY, JSON.stringify(bundle.attempts));
    safeSetItem(STORAGE_KEY, JSON.stringify(bundle.progress));
    safeSetItem(BOOKMARKS_KEY, JSON.stringify(bundle.bookmarks));
    safeSetItem(STREAK_KEY, JSON.stringify(bundle.streak));
    safeSetItem(SRS_KEY, JSON.stringify(bundle.srs));
    return {
      success: true,
      message: `Imported ${bundle.attempts.length} attempts, ${bundle.bookmarks.length} bookmarks, ${Object.keys(bundle.srs).length} SRS cards.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Import failed: ${msg}` };
  }
}

export function clearAllUserData(): void {
  if (typeof window === "undefined") return;
  clearAllData();
  try {
    localStorage.removeItem(SRS_KEY);
  } catch {
    // ignore
  }
}
