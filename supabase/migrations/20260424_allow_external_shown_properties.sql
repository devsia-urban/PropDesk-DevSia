-- Allow recording property visits for properties NOT in the database
-- 1. Make property_id nullable
ALTER TABLE client_shown_properties ALTER COLUMN property_id DROP NOT NULL;

-- 2. Add columns for external/unregistered properties
ALTER TABLE client_shown_properties ADD COLUMN IF NOT EXISTS external_title TEXT;
ALTER TABLE client_shown_properties ADD COLUMN IF NOT EXISTS external_location TEXT;

-- 3. Add constraint to ensure EITHER property_id OR external_title is provided
ALTER TABLE client_shown_properties DROP CONSTRAINT IF EXISTS shown_property_check;
ALTER TABLE client_shown_properties ADD CONSTRAINT shown_property_check 
  CHECK (
    (property_id IS NOT NULL) OR 
    (external_title IS NOT NULL AND external_title <> '')
  );

-- 4. Update the unique constraint to only apply when property_id is present
-- (A client can visit the same 'external' property multiple times, but shouldn't link the same DB property twice)
ALTER TABLE client_shown_properties DROP CONSTRAINT IF EXISTS client_shown_properties_client_id_property_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_shown_db_property 
ON client_shown_properties (client_id, property_id) 
WHERE property_id IS NOT NULL;
