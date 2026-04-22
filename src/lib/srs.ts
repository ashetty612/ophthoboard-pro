import { SrsCard } from "./types";
import { safeSetItem } from "./storage";

export type Rating = "again" | "hard" | "good" | "easy";

const SRS_KEY = "ophtho_boards_srs";
const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const EASE_DEFAULT = 2.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function todayIso(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function addDaysIso(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function newCard(caseId: string): SrsCard {
  return {
    caseId,
    ease: EASE_DEFAULT,
    interval: 0,
    repetitions: 0,
    dueDate: todayIso(),
    lastReview: todayIso(),
    lapses: 0,
  };
}

// Pure scheduling function — no side effects.
export function scheduleCard(card: SrsCard | null, rating: Rating): SrsCard {
  const base: SrsCard = card ? { ...card } : newCard("");

  let { ease, interval, repetitions, lapses } = base;

  switch (rating) {
    case "again":
      ease = clamp(ease - 0.2, EASE_MIN, EASE_MAX);
      interval = 1;
      repetitions = 0;
      lapses += 1;
      break;
    case "hard":
      ease = clamp(ease - 0.15, EASE_MIN, EASE_MAX);
      interval = Math.max(1, Math.round((interval || 1) * 1.2));
      repetitions += 1;
      break;
    case "good":
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * ease);
      }
      repetitions += 1;
      break;
    case "easy":
      ease = clamp(ease + 0.15, EASE_MIN, EASE_MAX);
      interval = Math.round(Math.max(1, interval || 1) * ease * 1.3);
      repetitions += 1;
      break;
  }

  const now = new Date();
  return {
    ...base,
    ease,
    interval,
    repetitions,
    lapses,
    dueDate: addDaysIso(interval, now),
    lastReview: todayIso(now),
  };
}

type SrsStore = { [caseId: string]: SrsCard };

function readStore(): SrsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SRS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as SrsStore;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStore(store: SrsStore): void {
  if (typeof window === "undefined") return;
  safeSetItem(SRS_KEY, JSON.stringify(store));
}

export function getSrsCard(caseId: string): SrsCard | null {
  const store = readStore();
  return store[caseId] ?? null;
}

export function saveSrsCard(card: SrsCard): void {
  if (typeof window === "undefined") return;
  // Merge — never overwrite unrelated cards.
  const store = readStore();
  store[card.caseId] = card;
  writeStore(store);
}

export function getAllSrsCards(): SrsCard[] {
  return Object.values(readStore());
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getDueCards(today: Date = new Date()): SrsCard[] {
  const cutoff = startOfDay(today);
  return getAllSrsCards().filter((c) => {
    const due = new Date(c.dueDate).getTime();
    return due <= cutoff + 24 * 60 * 60 * 1000 - 1;
  });
}

export function getOverdueCount(): number {
  const cutoff = startOfDay(new Date());
  return getAllSrsCards().filter((c) => new Date(c.dueDate).getTime() < cutoff).length;
}

export function getUpcomingCount(days: number): number {
  const start = startOfDay(new Date());
  const end = start + days * 24 * 60 * 60 * 1000;
  return getAllSrsCards().filter((c) => {
    const due = new Date(c.dueDate).getTime();
    return due >= start && due <= end;
  }).length;
}

// Helper for the rating flow: build/update a card for a given caseId and rating.
export function rateCase(caseId: string, rating: Rating): SrsCard {
  const existing = getSrsCard(caseId) ?? { ...newCard(caseId) };
  const updated = scheduleCard(existing, rating);
  updated.caseId = caseId;
  saveSrsCard(updated);
  return updated;
}
