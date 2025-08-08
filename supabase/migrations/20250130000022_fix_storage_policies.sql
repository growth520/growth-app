-- Fix storage bucket policies for photo uploads
-- This migration ensures users can upload photos to the photos bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = 'challenge-photos'
);

-- Create policy to allow users to view their own photos
CREATE POLICY "Allow users to view their own photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = 'challenge-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow users to update their own photos
CREATE POLICY "Allow users to update their own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = 'challenge-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = 'challenge-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Create policy to allow users to delete their own photos
CREATE POLICY "Allow users to delete their own photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'photos' AND 
  (storage.foldername(name))[1] = 'challenge-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Ensure the photos bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create a function to get public URLs for photos
CREATE OR REPLACE FUNCTION get_photo_url(file_path text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT storage.url('photos', file_path);
$$; 