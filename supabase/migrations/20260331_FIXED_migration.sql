-- FOOLPROOF MIGRATION: RUN ALL AT ONCE
-- This script handles the dependency error by temporarily dropping the public view.

-- 1. Create agency_plot_groups table
CREATE TABLE IF NOT EXISTS agency_plot_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, name)
);

-- 2. Drop the view that depends on the 'bhk' column
DROP VIEW IF EXISTS public_properties;

-- 3. Add 'group' column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "group" TEXT;

-- 4. Convert 'bhk' to INTEGER ARRAY
-- This handles existing data by wrapping it: e.g. 3 becomes [3]
ALTER TABLE properties 
  ALTER COLUMN bhk TYPE INTEGER[] 
  USING CASE 
    WHEN bhk IS NULL THEN ARRAY[]::INTEGER[]
    ELSE ARRAY[bhk]
  END;

-- 5. Recreate the Public View with the new schema
CREATE OR REPLACE VIEW public_properties AS
SELECT 
    id,
    agency_id,
    title,
    description,
    property_type,
    status,
    price,
    price_negotiable,
    area_sqft,
    area_unit,
    bhk,
    bedrooms,
    bathrooms,
    locality,
    city,
    pincode,
    facing,
    furnishing,
    amenities,
    image_urls,
    cover_image_url,
    listing_type,
    is_featured,
    is_new,
    slug,
    balconies,
    google_maps_url,
    "group",
    created_at
FROM properties
WHERE is_deleted = FALSE AND status = 'available';

-- 6. Re-grant permissions
GRANT SELECT ON public_properties TO anon, authenticated;
GRANT ALL ON agency_plot_groups TO authenticated;

-- 7. Logic for New Table Policies
ALTER TABLE agency_plot_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plot_groups_select" ON agency_plot_groups;
CREATE POLICY "plot_groups_select" ON agency_plot_groups FOR SELECT USING (agency_id = my_agency_id());
DROP POLICY IF EXISTS "plot_groups_insert" ON agency_plot_groups;
CREATE POLICY "plot_groups_insert" ON agency_plot_groups FOR INSERT WITH CHECK (agency_id = my_agency_id());
