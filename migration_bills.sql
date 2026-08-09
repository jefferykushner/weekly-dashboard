-- ============================================================
--  MIGRATION: bills tracker
--  Run this in the Supabase SQL Editor.
--
--  After running this SQL, ALSO create a Storage bucket:
--    1. Supabase sidebar -> Storage -> New bucket
--    2. Name: "invoices"
--    3. Public: OFF (private bucket)
--    4. Click "Policies" on the bucket -> New policy -> 
--       "Give users access to own folder" template
--       This lets each user upload/read their own files.
--
--  Bills can recur (monthly, quarterly, yearly). When paid,
--  a recurring bill auto-generates its next occurrence.
-- ============================================================

create table if not exists public.bills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  amount      numeric(10,2),
  due_date    date not null,
  paid        boolean not null default false,
  paid_at     date,
  recur       text not null default 'none' check (recur in ('none','monthly','quarterly','yearly')),
  file_path   text,                         -- path in the "invoices" storage bucket
  notes       text default '',
  position    int not null default 0,
  created_at  timestamptz default now()
);

create index if not exists bills_user_idx on public.bills (user_id, due_date);

alter table public.bills enable row level security;

drop policy if exists own_rows on public.bills;
create policy own_rows on public.bills for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
