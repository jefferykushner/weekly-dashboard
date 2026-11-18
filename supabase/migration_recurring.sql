-- ============================================================
--  MIGRATION: recurring events
--  Run this once in the Supabase SQL Editor.
--  Adds a "recur" setting to tasks. Only events use it.
--    none     - a one-off event (default)
--    daily    - every day from its date onward
--    weekdays - Monday to Friday
--    weekly   - same weekday every week
-- ============================================================

alter table public.tasks
  add column if not exists recur text not null default 'none';

alter table public.tasks drop constraint if exists tasks_recur_check;

alter table public.tasks
  add constraint tasks_recur_check
  check (recur in ('none','daily','weekdays','weekly'));
