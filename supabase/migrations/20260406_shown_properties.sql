-- Final Migration for Property Manager Platform (2026-04-06)
-- Feature: Shown Properties Tracking & Final Schema Refinements

-- 1. client_shown_properties table (Join table for tracking showings)
CREATE TABLE IF NOT EXISTS client_shown_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  UNIQUE(client_id, property_id)
);

-- Index for efficient client-based fetching
CREATE INDEX IF NOT EXISTS idx_client_shown_properties_client ON client_shown_properties(client_id);

-- Enable RLS
ALTER TABLE client_shown_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shown_prop_select') THEN
        CREATE POLICY "shown_prop_select" ON client_shown_properties FOR SELECT
          USING (agency_id = my_agency_id());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shown_prop_insert') THEN
        CREATE POLICY "shown_prop_insert" ON client_shown_properties FOR INSERT
          WITH CHECK (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shown_prop_delete') THEN
        CREATE POLICY "shown_prop_delete" ON client_shown_properties FOR DELETE
          USING (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));
    END IF;
END $$;

-- 2. Ensure Contact Type columns exist (Safety check if not already manual)
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'client';
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_type TEXT;
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS "group" TEXT;

-- 3. Add looking_for constraint if missing
-- ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_looking_for_check;
-- ALTER TABLE clients ADD CONSTRAINT clients_looking_for_check CHECK (looking_for IN ('buy','rent'));
