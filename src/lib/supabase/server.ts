/**
 * Supabase server client — for Next.js route handlers and Server Components.
 *
 * Uses @supabase/ssr to wire cookie-based session to incoming requests.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseEnabled(): boolean {
  return !!(URL && ANON);
}

export async function createServerSupabase(): Promise<SupabaseClient | null> {
  if (!URL || !ANON) return null;
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ignore: setting cookies from a Server Component is OK to silently fail
          // when middleware has already refreshed the session.
        }
      },
    },
  });
}
