-- ============================================================
--  MIGRATION: "Someday" lists
--  Run this once in the Supabase SQL Editor. Safe to re-run.
--  A list marked someday lives on the shelf under the board
--  instead of taking a full panel, even when it has open items.
-- ============================================================

alter table public.panels
  add column if not exists someday boolean not null default false;
