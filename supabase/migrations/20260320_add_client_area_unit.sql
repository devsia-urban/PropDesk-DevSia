-- Migration: Add min_area_unit to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS min_area_unit TEXT DEFAULT 'sqft' CHECK (min_area_unit IN ('sqft', 'sqyard', 'sqm'));

-- Update existing records
UPDATE clients SET min_area_unit = 'sqft' WHERE min_area_unit IS NULL;
