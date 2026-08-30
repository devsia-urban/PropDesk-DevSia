-- Create agency_plot_groups table for dynamic plot categorization
CREATE TABLE IF NOT EXISTS agency_plot_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, name)
);

-- Enable RLS on plot groups
ALTER TABLE agency_plot_groups ENABLE ROW LEVEL SECURITY;

-- Dynamic Plot Groups Policies
CREATE POLICY "plot_groups_select" ON agency_plot_groups FOR SELECT
  USING (agency_id = my_agency_id());

CREATE POLICY "plot_groups_insert" ON agency_plot_groups FOR INSERT
  WITH CHECK (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));

CREATE POLICY "plot_groups_delete" ON agency_plot_groups FOR DELETE
  USING (agency_id = my_agency_id() AND my_role() IN ('admin','agent'));

-- Update properties table for Plot Categorization
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "group" TEXT;

-- Convert BHK column to array type
-- First, drop the check constraint if it exists (though not explicitly shown in current schema, safe to handle)
DO $$
BEGIN
  -- Convert bhk column to integer array
  -- This handles existing integer data by wrapping it in an array: e.g. 3 -> ARRAY[3]
  ALTER TABLE properties 
    ALTER COLUMN bhk TYPE INTEGER[] 
    USING CASE 
      WHEN bhk IS NULL THEN ARRAY[]::INTEGER[]
      ELSE ARRAY[bhk]
    END;
END $$;

-- Update Client Matching Logic Hint:
-- SQL Queries matching BHKs will now use overlap operator: bhk && preferred_bhks
