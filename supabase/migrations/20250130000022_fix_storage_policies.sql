-- Create photos bucket for challenge photo uploads
-- Note: Storage policies need to be set up manually in Supabase dashboard

-- Create the photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create a simple function to get photo URLs
CREATE OR REPLACE FUNCTION get_photo_url(file_path text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'https://eceojrvqdsfjakprojgy.supabase.co/storage/v1/object/public/photos/' || file_path;
$$; 