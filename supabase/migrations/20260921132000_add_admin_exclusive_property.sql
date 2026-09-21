-- Add is_admin_exclusive column to properties table
ALTER TABLE public.properties ADD COLUMN is_admin_exclusive BOOLEAN DEFAULT FALSE;
