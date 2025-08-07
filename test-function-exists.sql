-- Test script to check if the increment_post_view function exists
-- Run this in Supabase SQL Editor

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%increment_post_view%'
AND routine_schema = 'public';

-- 2. List all functions that contain 'increment' or 'view'
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE (routine_name LIKE '%increment%' OR routine_name LIKE '%view%')
AND routine_schema = 'public'
ORDER BY routine_name;

-- 3. Check if the post_views table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'post_views'
AND table_schema = 'public';

-- 4. Try to create the function manually
CREATE OR REPLACE FUNCTION increment_post_view(p_post_id uuid, p_viewer_id uuid, p_view_type text DEFAULT 'scroll')
RETURNS void AS $$
BEGIN
  -- Only increment if viewer is not the post author
  IF p_viewer_id != (SELECT user_id FROM posts WHERE id = p_post_id) THEN
    -- Insert into post_views table for analytics
    INSERT INTO public.post_views (post_id, viewer_id, view_type, session_id)
    VALUES (p_post_id, p_viewer_id, p_view_type, gen_random_uuid()::text)
    ON CONFLICT (post_id, viewer_id, session_id) DO NOTHING;
    
    -- Update the posts table views_count
    UPDATE posts 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_post_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test the function
SELECT 'Function created successfully' as status; 