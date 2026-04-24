/**
 * Supabase auth callback — handles the redirect after magic-link or email
 * confirmation. Exchanges the ?code param for a session, then bounces to /.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, isSupabaseEnabled } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!isSupabaseEnabled() || !code) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const sb = await createServerSupabase();
  if (sb) {
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
