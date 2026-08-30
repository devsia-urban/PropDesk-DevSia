-- FIX: Add 'gaj' to area unit check constraints

-- 1. Update Properties Table
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_area_unit_check;
ALTER TABLE properties ADD CONSTRAINT properties_area_unit_check 
  CHECK (area_unit IN ('sqft', 'sqyard', 'sqm', 'gaj'));

-- 2. Update Clients Table (for matching consistency)
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_min_area_unit_check;
ALTER TABLE clients ADD CONSTRAINT clients_min_area_unit_check 
  CHECK (min_area_unit IN ('sqft', 'sqyard', 'sqm', 'gaj'));
