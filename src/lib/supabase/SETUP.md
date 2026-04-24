# Supabase setup — one-time, ~10 minutes

The app works without Supabase (all data stored in localStorage).
When you enable Supabase, you unlock:
- Email + password (or magic-link) accounts
- Cross-device progress sync
- Closed-beta access control (allowlist)
- Owner-only admin overview (future)

## Steps

### 1. Create a Supabase project
- Go to <https://supabase.com> → New project
- Note the **Project URL** and **anon public key** (Settings → API)

### 2. Run the schema
- In the Supabase SQL editor, paste the full contents of
  `src/lib/supabase/schema.sql` and run it.
- This creates 6 tables (attempts, bookmarks, streaks, srs_cards,
  user_flashcards, beta_allowlist) with row-level security.
- It also installs triggers so sign-ups require an allowlisted email,
  and creates a blank streak row on account creation.

### 3. Add beta-allowlist emails
Already seeded with `ashetty612@gmail.com`. To invite more users:
```sql
insert into public.beta_allowlist (email, note) values
  ('friend@example.com', 'Residency buddy');
```

### 4. Add env vars
In Vercel → Project → Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |

Or locally:
```bash
echo 'NEXT_PUBLIC_SUPABASE_URL="https://<your-ref>.supabase.co"' >> .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"' >> .env.local
```

### 5. Redeploy
Auth UI appears automatically. Before redeploy, auth UI is hidden and
all state lives in localStorage. No user action is lost.

### 6. Verify
- Visit `/auth/sign-up`, create an account with an allowlisted email.
- Sign in. You should see a green "Signed in" state in the header.
- Any progress you made while signed-out will be migrated on first
  sign-in.

## Troubleshooting

- **"Not on beta allowlist"** — the email isn't in `public.beta_allowlist`.
  Add it via the SQL editor.
- **Sign-in loop** — check that anon key is correct and that
  Supabase Auth → Providers → Email is enabled.
- **Progress not syncing** — open the browser console; any RLS violations
  would log there as 401/403 errors.
