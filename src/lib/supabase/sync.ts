"use client";

/**
 * Cloud sync — keep localStorage and the Supabase `attempts` table in
 * step so a signed-in user gets cross-device progress without losing
 * the offline-first behaviour.
 *
 * Strategy:
 *   - On sign-in: pull cloud attempts → merge into local (dedupe by
 *     case_id + timestamp). Local-only attempts (created while signed
 *     out) are pushed up.
 *   - On every local saveAttempt() while signed in: fire-and-forget
 *     INSERT to Supabase. Failure logs to console but never throws —
 *     the local copy is the source of truth and re-syncs on next
 *     sign-in.
 *
 * RLS policies on `public.attempts` already restrict each user to
 * their own rows, so the client just sends user_id from the session.
 */

import { CaseAttempt } from "../types";
import { supabase, isSupabaseEnabled } from "./client";
import { getAttempts, saveAttempt } from "../storage";
import { safeSetItem } from "../storage";

const ATTEMPTS_KEY = "ophtho_boards_attempts";
// Track which local attempts have been pushed so we don't re-push on
// every save. We use a content-hash so the same attempt across devices
// dedupes naturally.
const PUSHED_KEY = "ophtho_boards_synced_hashes";

function attemptHash(a: CaseAttempt): string {
  // Stable across devices: case + timestamp uniquely identify an attempt
  return `${a.caseId}::${a.timestamp}`;
}

function getPushedHashes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PUSHED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markPushed(hashes: string[]) {
  if (typeof window === "undefined") return;
  const set = getPushedHashes();
  for (const h of hashes) set.add(h);
  safeSetItem(PUSHED_KEY, JSON.stringify(Array.from(set)));
}

// Map local CaseAttempt → DB row shape
function toCloudRow(userId: string, a: CaseAttempt) {
  return {
    user_id: userId,
    case_id: a.caseId,
    timestamp: a.timestamp,
    total_score: a.totalScore,
    max_score: a.maxPossibleScore,
    percentage_score: a.percentageScore,
    grade: a.grade,
    time_spent_seconds: a.timeSpentSeconds,
    photo_description_answer: a.photoDescriptionAnswer ?? null,
    photo_description_score: a.photoDescriptionScore ?? null,
    answers: a.answers,
  };
}

// Map DB row → local CaseAttempt
interface CloudRow {
  case_id: string;
  timestamp: string;
  total_score: number;
  max_score: number;
  percentage_score: number;
  grade: string | null;
  time_spent_seconds: number;
  photo_description_answer: string | null;
  photo_description_score: number | null;
  answers: unknown;
}

function fromCloudRow(r: CloudRow): CaseAttempt {
  return {
    caseId: r.case_id,
    timestamp: r.timestamp,
    totalScore: Number(r.total_score),
    maxPossibleScore: Number(r.max_score),
    percentageScore: r.percentage_score,
    grade: r.grade ?? "",
    timeSpentSeconds: r.time_spent_seconds,
    photoDescriptionAnswer: r.photo_description_answer ?? "",
    photoDescriptionScore: r.photo_description_score == null ? 0 : Number(r.photo_description_score),
    answers: Array.isArray(r.answers) ? (r.answers as CaseAttempt["answers"]) : [],
  };
}

/**
 * Push a single attempt to the cloud. Fire-and-forget — never throws.
 * Safe to call from saveAttempt(); silently no-ops when Supabase is
 * disabled or the user isn't signed in.
 */
export async function pushAttemptToCloud(attempt: CaseAttempt): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const sb = supabase();
  if (!sb) return;
  try {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) return;
    const hash = attemptHash(attempt);
    if (getPushedHashes().has(hash)) return;
    const { error } = await sb.from("attempts").insert(toCloudRow(userId, attempt));
    if (error) {
      // Probable conflict (already exists from another device). Mark as
      // pushed locally to avoid retrying every save.
      if (/duplicate|conflict|409/i.test(error.message || "")) {
        markPushed([hash]);
        return;
      }
      console.warn("[sync] push attempt failed:", error.message);
      return;
    }
    markPushed([hash]);
  } catch (e) {
    console.warn("[sync] push exception:", (e as Error).message);
  }
}

/**
 * Pull all cloud attempts for the signed-in user and merge into local
 * storage. Dedupes by (caseId, timestamp). Returns the merged array.
 *
 * Call once on sign-in. The merge is idempotent — calling it twice is
 * harmless (just costs an extra round-trip).
 */
export async function pullAndMergeAttempts(): Promise<CaseAttempt[] | null> {
  if (!isSupabaseEnabled()) return null;
  const sb = supabase();
  if (!sb) return null;
  try {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) return null;

    const { data, error } = await sb
      .from("attempts")
      .select("case_id, timestamp, total_score, max_score, percentage_score, grade, time_spent_seconds, photo_description_answer, photo_description_score, answers")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });
    if (error) {
      console.warn("[sync] pull failed:", error.message);
      return null;
    }
    const cloud = (data || []).map(fromCloudRow);
    const local = getAttempts();

    // Merge by (caseId + timestamp). Cloud wins on duplicate (same key
    // = same attempt; cloud is canonical because it survives device
    // resets).
    const byKey = new Map<string, CaseAttempt>();
    for (const a of local) byKey.set(attemptHash(a), a);
    for (const a of cloud) byKey.set(attemptHash(a), a);
    const merged = Array.from(byKey.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    safeSetItem(ATTEMPTS_KEY, JSON.stringify(merged));

    // Push any local attempts that aren't in the cloud yet
    const cloudHashes = new Set(cloud.map(attemptHash));
    const toPush = local.filter((a) => !cloudHashes.has(attemptHash(a)));
    for (const a of toPush) {
      // Sequential to keep things polite on the API; each is a single
      // INSERT so this is fast for any realistic backlog (< 100 rows).
      await pushAttemptToCloud(a);
    }

    return merged;
  } catch (e) {
    console.warn("[sync] pull exception:", (e as Error).message);
    return null;
  }
}

/**
 * Convenience wrapper used by callers that don't import storage.ts —
 * saves locally AND pushes to cloud in one call.
 */
export function saveAttemptWithSync(attempt: CaseAttempt): void {
  saveAttempt(attempt);
  void pushAttemptToCloud(attempt);
}

// ---------------------------------------------------------------------------
// Bookmarks sync — same fire-and-forget pattern as attempts
// ---------------------------------------------------------------------------

const BOOKMARKS_KEY = "ophtho_boards_bookmarks";

/** Push the FULL bookmarks set to Supabase (idempotent upsert). Cheaper
 *  than diffing because the table is tiny (one row per bookmarked case). */
export async function syncBookmarksToCloud(): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const sb = supabase();
  if (!sb) return;
  try {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) return;
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const local: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(local)) return;

    // Pull cloud bookmarks
    const { data: cloudData } = await sb.from("bookmarks").select("case_id").eq("user_id", userId);
    const cloudIds = new Set((cloudData || []).map((r) => r.case_id));
    const localIds = new Set(local);

    // Add bookmarks that exist locally but not in cloud
    const toAdd = local.filter((id) => !cloudIds.has(id));
    if (toAdd.length > 0) {
      await sb.from("bookmarks").insert(toAdd.map((case_id) => ({ user_id: userId, case_id })));
    }

    // Add bookmarks that exist in cloud but not locally (cross-device merge)
    const toRestore = Array.from(cloudIds).filter((id) => !localIds.has(id));
    if (toRestore.length > 0) {
      const merged = [...local, ...toRestore];
      safeSetItem(BOOKMARKS_KEY, JSON.stringify(merged));
    }
  } catch (e) {
    console.warn("[sync] bookmarks sync failed:", (e as Error).message);
  }
}

/** Toggle a bookmark in the cloud. Called after the local toggle so the
 *  UI feels instant. */
export async function pushBookmarkToggle(caseId: string, bookmarked: boolean): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const sb = supabase();
  if (!sb) return;
  try {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) return;
    if (bookmarked) {
      await sb.from("bookmarks").upsert({ user_id: userId, case_id: caseId }, { onConflict: "user_id,case_id" });
    } else {
      await sb.from("bookmarks").delete().eq("user_id", userId).eq("case_id", caseId);
    }
  } catch (e) {
    console.warn("[sync] bookmark push failed:", (e as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Streaks sync — pull cloud streak on sign-in, push on every update
// ---------------------------------------------------------------------------

const STREAK_KEY = "ophtho_boards_streak";

interface StreakState { current: number; lastDate: string }

export async function pushStreakToCloud(): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const sb = supabase();
  if (!sb) return;
  try {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) return;
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return;
    const local: StreakState = JSON.parse(raw);
    if (!local || typeof local.current !== "number") return;
    await sb.from("streaks").upsert(
      {
        user_id: userId,
        current_streak: local.current,
        last_attempt_date: local.lastDate,
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    console.warn("[sync] streak push failed:", (e as Error).message);
  }
}

export async function pullStreakFromCloud(): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const sb = supabase();
  if (!sb) return;
  try {
    const { data: sess } = await sb.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) return;
    const { data, error } = await sb
      .from("streaks")
      .select("current_streak, last_attempt_date")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return;
    const raw = localStorage.getItem(STREAK_KEY);
    const local: StreakState = raw ? JSON.parse(raw) : { current: 0, lastDate: "" };
    // Cloud-wins ONLY if cloud has more recent activity. Otherwise local
    // (the more-recent device) wins and gets pushed back up next save.
    const cloudIsNewer =
      !local.lastDate ||
      (data.last_attempt_date && new Date(data.last_attempt_date) > new Date(local.lastDate));
    if (cloudIsNewer) {
      const merged = {
        current: Math.max(local.current, data.current_streak),
        lastDate: data.last_attempt_date || local.lastDate,
      };
      safeSetItem(STREAK_KEY, JSON.stringify(merged));
    } else {
      // Push local up
      void pushStreakToCloud();
    }
  } catch (e) {
    console.warn("[sync] streak pull failed:", (e as Error).message);
  }
}

/** One-stop "I just signed in — sync everything" helper. */
export async function pullEverything(): Promise<void> {
  await Promise.allSettled([
    pullAndMergeAttempts(),
    syncBookmarksToCloud(),
    pullStreakFromCloud(),
  ]);
}
