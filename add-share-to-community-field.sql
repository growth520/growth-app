-- =====================================================
-- ADD SHARE_TO_COMMUNITY FIELD TO POSTS TABLE
-- =====================================================
-- This script adds the share_to_community field to the posts table if it doesn't exist

-- =====================================================
-- 1. CHECK CURRENT POSTS TABLE STRUCTURE
-- =====================================================

-- Show current posts table structure
SELECT '=== CURRENT POSTS TABLE STRUCTURE ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'posts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. ADD SHARE_TO_COMMUNITY FIELD IF NOT EXISTS
-- =====================================================

-- Add share_to_community field if it doesn't exist
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS share_to_community BOOLEAN DEFAULT true;

-- Add is_public field if it doesn't exist (for backward compatibility)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- =====================================================
-- 3. UPDATE EXISTING POSTS
-- =====================================================

-- Update existing posts to have share_to_community = true if privacy = 'public'
UPDATE posts
SET share_to_community = true
WHERE privacy = 'public' AND share_to_community IS NULL;

-- Update existing posts to have share_to_community = false if privacy = 'private'
UPDATE posts
SET share_to_community = false
WHERE privacy = 'private' AND share_to_community IS NULL;

-- Update is_public field based on privacy
UPDATE posts
SET is_public = (privacy = 'public')
WHERE is_public IS NULL;

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Create index for share_to_community queries
CREATE INDEX IF NOT EXISTS idx_posts_share_to_community ON public.posts(share_to_community);

-- Create index for is_public queries
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON public.posts(is_public);

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

-- Show updated posts table structure
SELECT '=== UPDATED POSTS TABLE STRUCTURE ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'posts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show privacy and share_to_community distribution
SELECT '=== PRIVACY AND SHARE DISTRIBUTION ===' as info;
SELECT
    privacy,
    share_to_community,
    is_public,
    COUNT(*) as post_count
FROM posts
GROUP BY privacy, share_to_community, is_public
ORDER BY privacy, share_to_community;

-- Show summary
SELECT
    'Posts table updated successfully!' as status,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM posts WHERE share_to_community = true) as shared_posts,
    (SELECT COUNT(*) FROM posts WHERE share_to_community = false) as private_posts; 