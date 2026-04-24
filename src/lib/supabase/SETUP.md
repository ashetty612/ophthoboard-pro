# Supabase — LIVE ✅

Status: **deployed** on 2026-04-24.

- **Project ref**: `hypnejdbvlrbszpydtyh`
- **URL**: `https://hypnejdbvlrbszpydtyh.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/hypnejdbvlrbszpydtyh
- **Org**: `nivtaeeuslozsodnprke` (AK, Pro plan)
- **Region**: `us-east-1`

## What's configured

- **6 tables** with row-level security:
  `attempts`, `bookmarks`, `srs_cards`, `streaks`, `user_flashcards`, `beta_allowlist`
- **Closed-beta trigger** enforces `beta_allowlist` at sign-up. Verified: non-allowlisted emails receive `Not on beta allowlist` from Postgres.
- **Owner seeded**: `ashetty612@gmail.com`
- **Auto-streaks trigger**: fires on user creation to initialize a streak row.
- **Vercel env vars** set in production, preview, development:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Invite a friend

```sql
-- In the Supabase SQL editor:
insert into public.beta_allowlist (email, note) values
  ('friend@example.com', 'Residency buddy');
```

Or via CLI:
```bash
curl -X POST "https://api.supabase.com/v1/projects/hypnejdbvlrbszpydtyh/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"query":"insert into public.beta_allowlist (email, note) values ('"'"'friend@example.com'"'"', '"'"'note'"'"')"}'
```

## Remove a user

```sql
delete from auth.users where email = 'kicked@example.com';
-- cascades through attempts/bookmarks/etc via FK on delete cascade
```

## Local development

Run the local Supabase stack alongside dev:
```bash
npx supabase start             # spin up local Postgres + Studio + Inbucket
# .env.local already has real prod keys — for local-only test, override:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
```

## Adding new migrations

```bash
npx supabase db diff --schema public -f my_change    # generate diff
# edit supabase/migrations/*.sql by hand
npx supabase link --project-ref hypnejdbvlrbszpydtyh  # one-time
npx supabase db push                                  # deploy to prod
```

## Service role (server-only)

The service-role key is kept out of env vars by default. If you ever need it for server-side admin work:
```bash
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/hypnejdbvlrbszpydtyh/api-keys?reveal=true" \
  | jq '.[] | select(.name=="service_role") | .api_key'
```
Then `vercel env add SUPABASE_SERVICE_ROLE_KEY production`.

## Graceful local fallback

If `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are ever unset, the app automatically falls back to the local-first PBKDF2 auth (`src/lib/local-auth.ts`). No downtime.
