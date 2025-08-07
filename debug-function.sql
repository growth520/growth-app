-- Debug script to test what's happening inside the function
-- Run this in Supabase SQL Editor

-- 1. First, let's see what posts exist and their current state
SELECT 
    id, 
    user_id, 
    views_count,
    created_at
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Drop the existing function first
DROP FUNCTION IF EXISTS increment_post_view(uuid, uuid, text);

-- 3. Test the function with explicit logging
CREATE OR REPLACE FUNCTION increment_post_view(p_post_id uuid, p_viewer_id uuid, p_view_type text DEFAULT 'scroll')
RETURNS text AS $$
DECLARE
    post_author_id uuid;
    result text;
BEGIN
  -- Get the post author
  SELECT user_id INTO post_author_id FROM posts WHERE id = p_post_id;
  
  -- Log the values
  result := 'Post ID: ' || p_post_id || ', Viewer ID: ' || p_viewer_id || ', Post Author: ' || post_author_id;
  
  -- Only increment if viewer is not the post author
  IF p_viewer_id != post_author_id THEN
    -- Update the posts table views_count
    UPDATE posts 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_post_id;
    
    result := result || ' - VIEW COUNT UPDATED';
  ELSE
    result := result || ' - SKIPPED (own post)';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Test the function with a real post
SELECT increment_post_view(
    (SELECT id FROM posts LIMIT 1),
    '00000000-0000-0000-0000-000000000000',
    'test'
);

-- 5. Check if views_count was updated
SELECT id, views_count FROM posts ORDER BY created_at DESC LIMIT 5; 