-- ============================================================
--  WEEKLY DASHBOARD - Supabase schema
--  Run this whole file in the Supabase SQL Editor (one click).
--  Safe to re-run: it drops and recreates cleanly.
-- ============================================================

-- ---- Tables ----

create table if not exists public.weeks (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_start date not null,                 -- the Monday of the week
  theme      text default '',
  primary key (user_id, week_start)
);

create table if not exists public.panels (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title     text not null,
  accent    text not null default '#6E8BA6',
  position  int  not null default 0,
  created_at timestamptz default now()
);

-- One table for every check-off item. "kind" tells us which board it lives on.
--   priority : a top priority for a week        -> dt = that week's Monday
--   panel    : an item inside a panel            -> panel_id set
--   day      : something tied to a calendar day  -> dt = that date  (these roll over)
--   inbox    : brain dump / quick capture        -> dt null
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('priority','panel','day','inbox')),
  panel_id   uuid references public.panels(id) on delete cascade,
  dt         date,
  body       text not null default '',
  done       boolean not null default false,
  position   int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists tasks_user_kind_idx on public.tasks (user_id, kind);
create index if not exists tasks_user_dt_idx   on public.tasks (user_id, dt);

create table if not exists public.habits (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name      text not null,
  position  int  not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.habit_marks (
  habit_id  uuid not null references public.habits(id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dt        date not null,
  primary key (habit_id, dt)
);

-- ---- Row Level Security: each user only sees their own rows ----

alter table public.weeks       enable row level security;
alter table public.panels      enable row level security;
alter table public.tasks       enable row level security;
alter table public.habits      enable row level security;
alter table public.habit_marks enable row level security;

do $$
declare t text;
begin
  foreach t in array array['weeks','panels','tasks','habits','habit_marks']
  loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format(
      'create policy own_rows on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---- keep updated_at fresh on tasks ----
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
