-- Update the Public View to include the new 'group' and multi-BHK configuration
-- Run this in your Supabase SQL Editor to refresh the public frontend visibility.

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
    bhk, -- This will now correctly return an INTEGER[] array
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
    "group", -- Added the new Plot Group categorization
    created_at
FROM properties
WHERE is_deleted = FALSE AND status = 'available';

-- Re-grant access to ensure the anonymous users can still see it
GRANT SELECT ON public_properties TO anon, authenticated;

-- Optional: If you want to only show Featured properties on the public homepage,
-- you can add "AND is_featured = TRUE" to the WHERE clause above.
