-- =====================================================================
-- OphthoBoard Pro — Supabase schema
--
-- Run this once in the Supabase SQL editor after creating your project.
-- Enables auth via Supabase Auth + a few tables for cross-device sync.
--
-- ALL TABLES USE ROW-LEVEL SECURITY keyed to auth.uid().
-- Users can only read/write their own rows.
-- =====================================================================

-- 1. BETA ALLOWLIST
-- Add trusted emails here to permit sign-ups during closed beta.
-- Set enabled=false for the whole table to disable the check, or delete
-- rows to revoke access.
create table if not exists public.beta_allowlist (
  email text primary key,
  created_at timestamptz not null default now(),
  note text
);
alter table public.beta_allowlist enable row level security;
-- Anyone can read (so the signup page can tell the user they're NOT on the list)
create policy "allowlist read" on public.beta_allowlist for select to authenticated, anon using (true);

-- Seed with owner's email. REPLACE with your email.
insert into public.beta_allowlist (email, note) values
  ('ashetty612@gmail.com', 'Owner')
on conflict (email) do nothing;

-- 2. ATTEMPTS — one row per case attempt
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  timestamp timestamptz not null default now(),
  total_score numeric(6,2) not null default 0,
  max_score numeric(6,2) not null default 0,
  percentage_score integer not null default 0,
  grade text,
  time_spent_seconds integer not null default 0,
  photo_description_answer text,
  photo_description_score numeric(6,2),
  answers jsonb not null default '[]'::jsonb
);
create index if not exists idx_attempts_user_id on public.attempts(user_id);
create index if not exists idx_attempts_case_id on public.attempts(user_id, case_id);
alter table public.attempts enable row level security;
create policy "attempts select own" on public.attempts for select using (auth.uid() = user_id);
create policy "attempts insert own" on public.attempts for insert with check (auth.uid() = user_id);
create policy "attempts update own" on public.attempts for update using (auth.uid() = user_id);
create policy "attempts delete own" on public.attempts for delete using (auth.uid() = user_id);

-- 3. BOOKMARKS
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, case_id)
);
alter table public.bookmarks enable row level security;
create policy "bookmarks select own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks insert own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks delete own" on public.bookmarks for delete using (auth.uid() = user_id);

-- 4. STREAKS — one row per user
create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  last_date date,
  updated_at timestamptz not null default now()
);
alter table public.streaks enable row level security;
create policy "streaks select own" on public.streaks for select using (auth.uid() = user_id);
create policy "streaks upsert own" on public.streaks for insert with check (auth.uid() = user_id);
create policy "streaks update own" on public.streaks for update using (auth.uid() = user_id);

-- 5. SRS CARDS
create table if not exists public.srs_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  ease numeric(4,2) not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  due_date timestamptz not null default now(),
  last_review timestamptz not null default now(),
  primary key (user_id, case_id)
);
create index if not exists idx_srs_due on public.srs_cards(user_id, due_date);
alter table public.srs_cards enable row level security;
create policy "srs select own" on public.srs_cards for select using (auth.uid() = user_id);
create policy "srs insert own" on public.srs_cards for insert with check (auth.uid() = user_id);
create policy "srs update own" on public.srs_cards for update using (auth.uid() = user_id);
create policy "srs delete own" on public.srs_cards for delete using (auth.uid() = user_id);

-- 6. USER FLASHCARDS
create table if not exists public.user_flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  image_url text,
  tags text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_flashcards_user on public.user_flashcards(user_id);
alter table public.user_flashcards enable row level security;
create policy "fc select own" on public.user_flashcards for select using (auth.uid() = user_id);
create policy "fc insert own" on public.user_flashcards for insert with check (auth.uid() = user_id);
create policy "fc update own" on public.user_flashcards for update using (auth.uid() = user_id);
create policy "fc delete own" on public.user_flashcards for delete using (auth.uid() = user_id);

-- 7. TRIGGER: enforce beta allowlist at sign-up
create or replace function public.enforce_beta_allowlist()
returns trigger as $$
begin
  if not exists (select 1 from public.beta_allowlist where email = new.email) then
    raise exception 'Not on beta allowlist. Contact the site owner for an invite.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_beta_on_signup on auth.users;
create trigger enforce_beta_on_signup
  before insert on auth.users
  for each row execute function public.enforce_beta_allowlist();

-- 8. TRIGGER: create an empty streak row on user creation (optional convenience)
create or replace function public.initialize_user()
returns trigger as $$
begin
  insert into public.streaks (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists initialize_user_on_signup on auth.users;
create trigger initialize_user_on_signup
  after insert on auth.users
  for each row execute function public.initialize_user();
