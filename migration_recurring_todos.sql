-- ============================================================
--  MIGRATION: recurring to-dos
--  Run this once in the Supabase SQL Editor.
--  A recurring to-do is one task row (its "recur" setting repeats it).
--  This table stores per-day state for each occurrence:
--    done    - checked off on that specific day
--    removed - that single occurrence was skipped/deleted
-- ============================================================

create table if not exists public.task_marks (
  task_id  uuid not null references public.tasks(id) on delete cascade,
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dt       date not null,
  done     boolean not null default false,
  removed  boolean not null default false,
  primary key (task_id, dt)
);

alter table public.task_marks enable row level security;

drop policy if exists own_rows on public.task_marks;
create policy own_rows on public.task_marks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
