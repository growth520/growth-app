-- Ensure Posts Privacy Feature
-- This script ensures the posts table has all necessary columns for privacy management

-- =====================================================
-- 1. ENSURE POSTS TABLE HAS PRIVACY COLUMN
-- =====================================================

-- Add privacy column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public';

-- Update existing posts to have default privacy
UPDATE posts 
SET privacy = 'public' 
WHERE privacy IS NULL;

-- =====================================================
-- 2. CREATE INDEXES FOR PRIVACY FEATURE
-- =====================================================

-- Create index for privacy filtering
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON public.posts(privacy);

-- Create composite index for user posts with privacy
CREATE INDEX IF NOT EXISTS idx_posts_user_privacy ON public.posts(user_id, privacy);

-- =====================================================
-- 3. ENSURE RLS POLICIES SUPPORT PRIVACY
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;

-- Create policy for users to manage their own posts (all privacy levels)
CREATE POLICY "Users can manage their own posts" ON public.posts 
FOR ALL USING (auth.uid() = user_id);

-- Create policy for users to view public posts from others
CREATE POLICY "Users can view public posts" ON public.posts 
FOR SELECT USING (privacy = 'public' OR auth.uid() = user_id);

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Show posts table structure
SELECT '=== POSTS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show privacy distribution
SELECT '=== PRIVACY DISTRIBUTION ===' as info;
SELECT 
    privacy,
    COUNT(*) as post_count
FROM posts 
GROUP BY privacy
ORDER BY privacy;

-- Show summary
SELECT 
    'Posts privacy feature ready!' as status,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM posts WHERE privacy = 'public') as public_posts,
    (SELECT COUNT(*) FROM posts WHERE privacy = 'private') as private_posts; 