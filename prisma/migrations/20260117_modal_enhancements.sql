-- Extend finance transaction type with Transferência
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'FinanceTransactionType'
      AND e.enumlabel = 'TRANSFERENCIA'
  ) THEN
    ALTER TYPE "FinanceTransactionType" ADD VALUE 'TRANSFERENCIA';
  END IF;
END $$;

-- Projects: scheduling + goal link
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS goal_id text REFERENCES goals(id) ON DELETE SET NULL;

-- Tasks: start date + clarify checklist
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS clarify_items jsonb DEFAULT '[]'::jsonb;

-- Goals: scheduling metadata
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;
