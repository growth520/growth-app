-- Fix posts table missing columns
-- This script adds the missing columns that the ChallengeCompletionPage expects

-- Add missing columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS challenge_id INTEGER,
ADD COLUMN IF NOT EXISTS challenge_title TEXT,
ADD COLUMN IF NOT EXISTS reflection TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_posts_challenge_id ON public.posts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON public.posts(privacy);

-- Update existing posts to have default values for the new columns
UPDATE posts 
SET 
  likes_count = COALESCE(likes_count, 0),
  comments_count = COALESCE(comments_count, 0),
  shares_count = COALESCE(shares_count, 0),
  views_count = COALESCE(views_count, 0),
  privacy = COALESCE(privacy, 'public'),
  flagged = COALESCE(flagged, false)
WHERE 
  likes_count IS NULL 
  OR comments_count IS NULL 
  OR shares_count IS NULL 
  OR views_count IS NULL
  OR privacy IS NULL
  OR flagged IS NULL;

-- Verify the changes
SELECT 
    'Posts table updated successfully' as status,
    COUNT(*) as total_posts
FROM posts;

-- Show the current posts table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position; 