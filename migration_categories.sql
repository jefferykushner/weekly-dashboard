-- ============================================================
--  MIGRATION: panel focus categories
--  Run this once in the Supabase SQL Editor.
--  Adds a category tag to each panel so you can filter
--  between work, personal, or both views.
-- ============================================================

alter table public.panels
  add column if not exists category text not null default 'both';

alter table public.panels drop constraint if exists panels_category_check;

alter table public.panels
  add constraint panels_category_check
  check (category in ('work','personal','both'));
