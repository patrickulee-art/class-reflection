-- Migration: Create reflections table
-- Description: Creates the reflections table with JSONB storage, indexes, RLS policies, and updated_at trigger
-- Idempotent: Safe to run multiple times without data loss

-- =============================================================================
-- 1. Create table (idempotent)
-- =============================================================================
CREATE TABLE IF NOT EXISTS reflections (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 2. Create indexes (idempotent)
-- =============================================================================
-- Index on created_at for date-based sorting
CREATE INDEX IF NOT EXISTS idx_reflections_created_at
  ON reflections (created_at);

-- Index on (data->>'date') for filtering by lesson date
CREATE INDEX IF NOT EXISTS idx_reflections_data_date
  ON reflections ((data->>'date'));

-- =============================================================================
-- 3. Enable RLS with anonymous access policy
-- =============================================================================
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Allow anon role full access (SELECT, INSERT, UPDATE, DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reflections'
      AND policyname = 'Allow anonymous access'
  ) THEN
    CREATE POLICY "Allow anonymous access"
      ON reflections
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- =============================================================================
-- 4. Updated-at trigger (idempotent)
-- =============================================================================
-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on reflections table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_reflections_updated_at'
      AND tgrelid = 'reflections'::regclass
  ) THEN
    CREATE TRIGGER set_reflections_updated_at
      BEFORE UPDATE ON reflections
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
