-- ============================================================
--  MIGRATION: word cloud
--  Run this once in the Supabase SQL Editor.
--  Stores the words/themes you enter over time; the Words page
--  renders them as a cumulative cloud (repeats grow larger).
-- ============================================================

create table if not exists public.words (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

create index if not exists words_user_idx on public.words (user_id, created_at);

alter table public.words enable row level security;

drop policy if exists own_rows on public.words;
create policy own_rows on public.words for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
