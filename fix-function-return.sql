-- Fix the function return type back to void
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS increment_post_view(uuid, uuid, text);

-- Create the function with void return type
CREATE OR REPLACE FUNCTION increment_post_view(p_post_id uuid, p_viewer_id uuid, p_view_type text DEFAULT 'scroll')
RETURNS void AS $$
BEGIN
  -- Only increment if viewer is not the post author
  IF p_viewer_id != (SELECT user_id FROM posts WHERE id = p_post_id) THEN
    -- Update the posts table views_count
    UPDATE posts 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_post_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'Function updated successfully' as status; 