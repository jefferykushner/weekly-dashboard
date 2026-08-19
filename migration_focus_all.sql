-- ============================================================
--  MIGRATION: focus categories on all trackers
--  Run this once in the Supabase SQL Editor.
--  Adds a category tag (work/personal/both) to habits, chores,
--  and bills so the focus filter covers everything.
-- ============================================================

-- Habits
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='habits' AND column_name='category') THEN
    ALTER TABLE habits ADD COLUMN category text NOT NULL DEFAULT 'personal';
  END IF;
END $$;
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_category_check;
ALTER TABLE habits ADD CONSTRAINT habits_category_check CHECK (category IN ('work','personal','both'));

-- Chores
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chores' AND column_name='category') THEN
    ALTER TABLE chores ADD COLUMN category text NOT NULL DEFAULT 'personal';
  END IF;
END $$;
ALTER TABLE chores DROP CONSTRAINT IF EXISTS chores_category_check;
ALTER TABLE chores ADD CONSTRAINT chores_category_check CHECK (category IN ('work','personal','both'));

-- Bills
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bills' AND column_name='category') THEN
    ALTER TABLE bills ADD COLUMN category text NOT NULL DEFAULT 'personal';
  END IF;
END $$;
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_category_check;
ALTER TABLE bills ADD CONSTRAINT bills_category_check CHECK (category IN ('work','personal','both'));

-- Panels (safe re-run if already done)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='panels' AND column_name='category') THEN
    ALTER TABLE panels ADD COLUMN category text NOT NULL DEFAULT 'both';
  END IF;
END $$;
ALTER TABLE panels DROP CONSTRAINT IF EXISTS panels_category_check;
ALTER TABLE panels ADD CONSTRAINT panels_category_check CHECK (category IN ('work','personal','both'));
