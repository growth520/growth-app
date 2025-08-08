-- Debug script to check photo_url values in posts table
-- Run this in your Supabase SQL editor

-- Check the most recent posts with photo_url
SELECT 
  id,
  user_id,
  reflection,
  photo_url,
  created_at,
  challenge_title
FROM posts 
WHERE photo_url IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if photo_url column exists and has data
SELECT 
  COUNT(*) as total_posts,
  COUNT(photo_url) as posts_with_photos,
  COUNT(CASE WHEN photo_url IS NOT NULL AND photo_url != '' THEN 1 END) as posts_with_non_empty_photos
FROM posts;

-- Check the structure of a specific post
SELECT 
  id,
  user_id,
  reflection,
  photo_url,
  created_at,
  challenge_title,
  category
FROM posts 
WHERE id = '19c6d5d5-df54-41e0-890a-a3a4611b013a'; 