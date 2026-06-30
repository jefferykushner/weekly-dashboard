-- ============================================================
--  MIGRATION: add "event" items (dates / appointments)
--  Run this once in the Supabase SQL Editor.
--  Events are dated notes that never get checked off and never roll over.
-- ============================================================

alter table public.tasks drop constraint if exists tasks_kind_check;

alter table public.tasks
  add constraint tasks_kind_check
  check (kind in ('priority','panel','day','inbox','event'));
