-- Migration: Upgrade properties schema with new fields
-- Run this in your Supabase SQL Editor.

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS seller_phone TEXT,
ADD COLUMN IF NOT EXISTS approval_type TEXT, -- e.g., 'JDA', 'HBA', 'Society', etc.
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS balconies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Create an index for the slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Create a unique constraint for the slug within an agency
ALTER TABLE properties ADD CONSTRAINT unique_agency_slug UNIQUE (agency_id, slug);
