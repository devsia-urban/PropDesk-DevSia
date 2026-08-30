-- Migration: Add area_unit and road_info to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS area_unit TEXT DEFAULT 'sqft' CHECK (area_unit IN ('sqft', 'sqyard', 'sqm')),
ADD COLUMN IF NOT EXISTS road_info TEXT;

-- Update existing records to have 'sqft' if needed (though default handles it for new ones)
UPDATE properties SET area_unit = 'sqft' WHERE area_unit IS NULL;
