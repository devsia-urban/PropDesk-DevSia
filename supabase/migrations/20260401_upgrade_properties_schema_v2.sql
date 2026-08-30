-- Add dimensions and commercial_type to properties
ALTER TABLE properties
ADD COLUMN dimensions TEXT,
ADD COLUMN commercial_type TEXT CHECK (commercial_type IN ('shop', 'space', 'land'));

-- Add min_dimensions and preferred_commercial_type to clients
ALTER TABLE clients
ADD COLUMN min_dimensions TEXT,
ADD COLUMN preferred_commercial_type TEXT CHECK (preferred_commercial_type IN ('shop', 'space', 'land'));
