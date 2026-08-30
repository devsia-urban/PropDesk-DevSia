-- PUBLIC FRONTEND VISIBILITY SETUP
-- Run this in your Supabase SQL Editor to allow anonymous users to view properties.

-- 1. Enable anonymous access to properties (Read-only)
-- This policy allows anyone (even not logged in) to view properties.
-- CAUTION: This exposes the fields to the public. 
-- We filter by is_deleted and optionally by status.

DROP POLICY IF EXISTS "properties_public_select" ON properties;
CREATE POLICY "properties_public_select" ON properties 
FOR SELECT 
USING (is_deleted = FALSE AND status = 'available' AND is_featured = TRUE);


-- 2. SECURE WAY: Create a Public View
-- Instead of exposing the main table directly, create a "public_properties" view
-- that EXCLUDES sensitive fields like seller_name and seller_phone.

-- First, set search path to public
SET search_path = public;

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
    created_at
FROM properties
WHERE is_deleted = FALSE AND status = 'available' AND is_featured = TRUE;

-- Grant access to the view
GRANT SELECT ON public_properties TO anon, authenticated;


-- 3. STORAGE ACCESS (Already public in migration script, but ensuring here)
-- This allows the public to see the images.
-- (This assumes the bucket is 'property-images')
DO $$ 
BEGIN
    NULL; -- This part is typically managed via Supabase storage settings or the storage schema which RLS might not touch directly in some setups
END $$;

-- If you want a direct SELECT policy on storage:
-- CREATE POLICY "Public Storage Select" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
