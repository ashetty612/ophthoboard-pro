"use client";

/**
 * Supabase browser client — safe to import in client components.
 *
 * The app works entirely offline/localStorage when Supabase env vars are
 * absent. When NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set, cloud sync activates and the user gains auth + cross-device
 * progress.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _cached: SupabaseClient | null = null;

/** Is Supabase configured at all? Controls whether auth UI appears. */
export function isSupabaseEnabled(): boolean {
  return !!(URL && ANON);
}

/** Get (or lazily create) the browser Supabase client. Returns null when
 *  not configured — consumers must fall back to localStorage gracefully.
 */
export function supabase(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  if (!_cached) {
    _cached = createBrowserClient(URL, ANON);
  }
  return _cached;
}
