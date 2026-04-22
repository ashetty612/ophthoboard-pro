/**
 * User-generated flashcards
 * -------------------------
 * Thin localStorage-backed CRUD for custom flashcards. Each card can be
 * promoted into the shared SRS scheduler via a prefixed id ("user:" + uuid)
 * so it coexists with case-based SRS cards without colliding on ids.
 */

import { safeSetItem } from "./storage";

export interface UserFlashcard {
  id: string;       // uuid (prefix "user:" used when syncing to SRS)
  front: string;
  back: string;
  imageUrl?: string;
  tags: string[];   // subspecialty / topic
  createdAt: string;
}

const STORAGE_KEY = "ophtho_boards_user_flashcards";

/** SRS id for a user flashcard — kept stable so reviews accumulate. */
export function srsIdFor(card: UserFlashcard | string): string {
  const id = typeof card === "string" ? card : card.id;
  return `user:${id}`;
}

function uuid(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback — good enough for localStorage-only identifiers
  return "uf-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function readAll(): UserFlashcard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserFlashcard[]) : [];
  } catch {
    return [];
  }
}

function writeAll(cards: UserFlashcard[]): void {
  if (typeof window === "undefined") return;
  safeSetItem(STORAGE_KEY, JSON.stringify(cards));
}

export function createFlashcard(
  c: Omit<UserFlashcard, "id" | "createdAt">
): UserFlashcard {
  const card: UserFlashcard = {
    ...c,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(card);
  writeAll(all);
  return card;
}

export function updateFlashcard(c: UserFlashcard): void {
  const all = readAll();
  const i = all.findIndex((x) => x.id === c.id);
  if (i >= 0) {
    all[i] = c;
    writeAll(all);
  }
}

export function deleteFlashcard(id: string): void {
  const all = readAll().filter((c) => c.id !== id);
  writeAll(all);
}

export function getAllFlashcards(): UserFlashcard[] {
  return readAll();
}

export function getFlashcardsByTag(tag: string): UserFlashcard[] {
  const needle = tag.toLowerCase();
  return readAll().filter((c) => c.tags.some((t) => t.toLowerCase() === needle));
}
