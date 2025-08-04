-- Create photos storage bucket for challenge photos
-- This should be run in Supabase Dashboard under Storage

-- Note: Storage buckets need to be created manually in Supabase Dashboard
-- Go to Storage > Create a new bucket
-- Bucket name: photos
-- Public bucket: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- The RLS policies will be created automatically by Supabase
-- when you create the bucket through the dashboard

-- If you need to manually set up policies later, you can run these:

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload photos
-- CREATE POLICY "Users can upload photos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'photos' AND 
--     auth.role() = 'authenticated'
--   );

-- Policy to allow public read access to photos (for community posts)
-- CREATE POLICY "Public can view photos" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'photos'
--   ); 