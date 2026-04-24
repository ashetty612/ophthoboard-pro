# Supabase setup for Clear Vision Boards

The app works identically today in localStorage-only mode. Turning on Supabase
gives you accounts, cross-device sync, and the closed-beta allowlist.

This guide has two tracks:

- **A. CLI path (recommended, fastest)** — create the project in the dashboard,
  then push our existing migration via the Supabase CLI.
- **B. Click-ops path** — open the Supabase SQL editor, paste the schema once.

Both paths assume you already own a Supabase account. If not, sign up at
<https://supabase.com> (free tier is enough for beta).

---

## Path A — CLI (recommended)

All commands run from the project root:
`/Users/Acanch/Downloads/Oral Boards Review copy/ophthalmology-boards`

The CLI is already installed as a devDependency (`./node_modules/.bin/supabase`).
Use `npx supabase ...` or add `./node_modules/.bin` to your PATH.

### 1. Create the project in the dashboard

<https://supabase.com/dashboard> → New project.

- Project name: `clear-vision-boards` (or anything)
- Database password: **generate & save somewhere** — used by CLI link
- Region: closest to you (e.g., us-east-1)
- Plan: Free

Wait ~2 minutes for it to provision. Note the **Project Ref** (a slug like
`abcdxyz12345`) from the URL: `https://app.supabase.com/project/<REF>`.

### 2. Get a Personal Access Token

<https://supabase.com/dashboard/account/tokens> → Generate new token.
Copy it — it's only shown once. Call it `CLI`.

### 3. Log in and link

```bash
# One-time
npx supabase login --token <YOUR_PAT>

# Link the local repo to the remote project
npx supabase link --project-ref <YOUR_PROJECT_REF>
# When prompted for db password, paste what you generated in step 1.
```

### 4. Push the initial schema

We already shipped the migration at:
`supabase/migrations/<timestamp>_initial_schema.sql`

```bash
npx supabase db push
```

This creates 6 RLS-secured tables (`attempts`, `bookmarks`, `streaks`,
`srs_cards`, `user_flashcards`, `beta_allowlist`) plus triggers that enforce
the closed-beta allowlist on sign-up. Your email (`ashetty612@gmail.com`) is
already seeded in `beta_allowlist`.

### 5. Paste env vars into Vercel

<https://vercel.com/ashetty612s-projects/ophthalmology-boards/settings/environment-variables>

Add for **Production, Preview, and Development**:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copy from Dashboard → Settings → API → *anon public* |

(Optional, for future server-side admin work:)

| Name | Value |
|------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Copy from Dashboard → Settings → API → *service_role* |

### 6. Redeploy

```bash
npx vercel --prod --yes
```

The sign-in/up UI now appears in the header. Your email is on the allowlist so
you can sign up immediately. To invite more users later:

```sql
-- In Supabase SQL editor
insert into public.beta_allowlist (email, note) values
  ('friend@example.com', 'Residency buddy');
```

---

## Path B — Click-ops

If you don't want to use the CLI:

1. Create the Supabase project (same step 1 above).
2. Open **Dashboard → SQL Editor → New query**.
3. Paste the full contents of `src/lib/supabase/schema.sql`.
4. Run.
5. Paste env vars into Vercel (step 5 above).
6. Redeploy.

---

## Verifying the setup

After redeploy:

1. Visit <https://www.clearvisioneducation.app>.
2. You should see a **Sign in** button in the header (hidden before Supabase is
   configured).
3. Click it → **Sign up** → use your allowlisted email.
4. Check your inbox for the confirmation link.
5. After confirming, the header shows your initial + **Sign out**.

Any existing localStorage progress persists. Cross-device sync kicks in once
the migration runs (wired in a subsequent commit).

## Optional: Supabase MCP for Claude Code

The Supabase MCP is already registered at user scope:

```bash
claude mcp list
# Should show: supabase
```

It needs a PAT to talk to your account. Add one as:

```bash
# macOS / zsh
echo 'export SUPABASE_ACCESS_TOKEN="sbp_..."' >> ~/.zshrc
source ~/.zshrc
```

Then in a future Claude session you can ask Claude to manage migrations,
branches, advisors, etc. directly.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Not on beta allowlist` on signup | email isn't seeded | `insert into public.beta_allowlist (email) values ('…')` |
| Sign-in loop | wrong anon key in Vercel env | paste the **anon public** key, not service_role |
| Progress not syncing | RLS misconfigured | check browser console for 401/403 from Supabase; re-run migration |
| `supabase link` password fails | wrong DB password | reset via Dashboard → Settings → Database → Reset password |

## Security notes

- **Never** commit the service role key.
- Keep the anon key public — it's safe by design (RLS gates everything).
- The IONOS API credentials used for DNS are stored only locally; do not commit
  them. Rotate them via <https://api.hosting.ionos.com/> if ever leaked.
