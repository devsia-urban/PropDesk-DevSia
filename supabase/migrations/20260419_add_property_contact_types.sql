-- Add Coloniser and Builder to properties.contact_type
-- v1.0 (2026-04-19)

-- Since contact_type was likely a TEXT field without a hard constraint (based on previous migrations),
-- we will add/update a CHECK constraint for safety and documentation.

DO $$ 
BEGIN
    -- Drop old constraint if exists (standardizing on a name)
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_contact_type_check;
    
    -- Add new constraint
    ALTER TABLE properties ADD CONSTRAINT properties_contact_type_check 
        CHECK (contact_type IN ('client', 'broker', 'coloniser', 'builder'));
END $$;
