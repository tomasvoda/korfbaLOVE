-- 1. Update 'osoby' table
ALTER TABLE osoby ADD COLUMN IF NOT EXISTS vek INT;
ALTER TABLE osoby ADD COLUMN IF NOT EXISTS status_evidence TEXT;
ALTER TABLE osoby ADD COLUMN IF NOT EXISTS externi_id TEXT;

-- 2. Update 'licence' table
ALTER TABLE licence ADD COLUMN IF NOT EXISTS kredity_23_24 INT DEFAULT 0;
ALTER TABLE licence ADD COLUMN IF NOT EXISTS kredity_24_25 INT DEFAULT 0;
ALTER TABLE licence ADD COLUMN IF NOT EXISTS uroven_projekce TEXT;

-- 3. Update view/search index if necessary (managed by Supabase)
-- (No specific actions needed for standard Supabase search)
