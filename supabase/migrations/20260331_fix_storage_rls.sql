-- ============================================================
-- Fix Storage RLS Policies for property-images bucket
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop all existing storage policies for this bucket to start clean
DROP POLICY IF EXISTS "images_upload" ON storage.objects;
DROP POLICY IF EXISTS "images_select" ON storage.objects;
DROP POLICY IF EXISTS "images_delete" ON storage.objects;
DROP POLICY IF EXISTS "images_update" ON storage.objects;

-- 2. Authenticated users can upload images
CREATE POLICY "images_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

-- 3. Anyone can view images (public bucket)
CREATE POLICY "images_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');

-- 4. Authenticated users can delete their own images
CREATE POLICY "images_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images');

-- 5. Authenticated users can update/replace images
CREATE POLICY "images_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-images')
  WITH CHECK (bucket_id = 'property-images');

-- IMPORTANT: Also make sure the bucket is set to PUBLIC in Supabase Dashboard:
-- Storage > property-images > Edit > Toggle "Public bucket" ON
