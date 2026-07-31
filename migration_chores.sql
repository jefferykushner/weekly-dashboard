-- ============================================================
--  MIGRATION: chores tracker
--  Run this once in the Supabase SQL Editor.
--
--  Chores are recurring household/life tasks that cycle on a
--  schedule (daily, weekly, biweekly, monthly). They live in
--  their own tracker, separate from habits and to-dos.
--
--  chore_completions tracks WHEN each chore was last done.
--  The app computes "due" vs "done" from the frequency + last
--  completion date.
-- ============================================================

create table if not exists public.chores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  frequency  text not null default 'weekly' check (frequency in ('daily','weekly','biweekly','monthly')),
  position   int not null default 0,
  created_at timestamptz default now()
);

create index if not exists chores_user_idx on public.chores (user_id, position);

alter table public.chores enable row level security;
drop policy if exists own_rows on public.chores;
create policy own_rows on public.chores for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Each row = one completion event (the date you did it).
-- To know if a chore is "done this cycle", the app checks if
-- the most recent completion falls within the current cycle window.
create table if not exists public.chore_completions (
  id         uuid primary key default gen_random_uuid(),
  chore_id   uuid not null references public.chores(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  completed_at date not null default current_date
);

create index if not exists cc_chore_idx on public.chore_completions (chore_id, completed_at desc);

alter table public.chore_completions enable row level security;
drop policy if exists own_rows on public.chore_completions;
create policy own_rows on public.chore_completions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
