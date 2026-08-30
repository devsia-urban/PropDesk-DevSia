-- ============================================================
-- Add 'farmer_land' to the properties.property_type constraint
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the existing constraint
ALTER TABLE properties 
  DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Step 2: Add the updated constraint with farmer_land
ALTER TABLE properties
  ADD CONSTRAINT properties_property_type_check 
  CHECK (property_type IN (
    'apartment', 'villa', 'independent_house', 
    'plot', 'commercial', 'farmhouse', 'penthouse', 'farmer_land'
  ));

-- Verify it works
SELECT 'farmer_land constraint added successfully' as status;
