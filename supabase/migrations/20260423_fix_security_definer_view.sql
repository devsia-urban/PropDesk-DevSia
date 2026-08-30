-- Fix Security Warning: Security Definer View
-- Error: View public.public_properties is defined with the SECURITY DEFINER property
-- Solution: Recreate the view with security_invoker = true to respect RLS policies

-- 1. Drop existing view (Required to change view properties)
DROP VIEW IF EXISTS public_properties;

-- 2. Recreate view with security_invoker = true
-- This ensures that when the frontend (anon) queries this view, 
-- it respects the RLS policies defined on the 'properties' table.
CREATE VIEW public_properties 
WITH (security_invoker = true)
AS
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
    dimensions,
    commercial_type,
    created_at
FROM properties
WHERE is_deleted = FALSE AND status = 'available';

-- 3. Re-grant access for public and authenticated users
GRANT SELECT ON public_properties TO anon, authenticated;
