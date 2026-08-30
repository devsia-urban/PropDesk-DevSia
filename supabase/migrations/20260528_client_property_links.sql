-- ============================================================
-- Migration: client_property_links
-- Purpose: Link clients who are SELLING to one or more properties
--          they own/want to sell (non-destructive addition)
-- Run in: Supabase SQL Editor
-- ============================================================

-- 1. Create the table (safe to re-run)
CREATE TABLE IF NOT EXISTS client_property_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'sell',   -- 'sell' | 'rent_out'
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, property_id)                -- one link per pair
);

-- 2. Enable RLS
ALTER TABLE client_property_links ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (agency-scoped)
DROP POLICY IF EXISTS "cpl_select" ON client_property_links;
CREATE POLICY "cpl_select" ON client_property_links FOR SELECT
  USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "cpl_insert" ON client_property_links;
CREATE POLICY "cpl_insert" ON client_property_links FOR INSERT
  WITH CHECK (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "cpl_delete" ON client_property_links;
CREATE POLICY "cpl_delete" ON client_property_links FOR DELETE
  USING (agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid()));

-- 4. Gracefully add 'sell' to clients.looking_for if CHECK exists
-- (Drop existing constraint and re-add with 'sell' included)
DO $$
BEGIN
  -- Try to drop the old CHECK constraint that doesn't include 'sell'
  ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_looking_for_check;
  -- Add the updated constraint
  ALTER TABLE clients ADD CONSTRAINT clients_looking_for_check
    CHECK (looking_for IN ('buy', 'rent', 'sell'));
EXCEPTION
  WHEN others THEN NULL; -- Ignore if already updated
END $$;

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_cpl_client_id   ON client_property_links(client_id);
CREATE INDEX IF NOT EXISTS idx_cpl_property_id ON client_property_links(property_id);
CREATE INDEX IF NOT EXISTS idx_cpl_agency_id   ON client_property_links(agency_id);

-- ============================================================
-- ✅ Migration complete
-- ============================================================
