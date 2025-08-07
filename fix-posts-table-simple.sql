-- =====================================================
-- SIMPLE FIX FOR POSTS TABLE - ADD SHARE_TO_COMMUNITY FIELD
-- =====================================================
-- This script adds the share_to_community field to the posts table

-- =====================================================
-- 1. ADD SHARE_TO_COMMUNITY FIELD
-- =====================================================

-- Add share_to_community field if it doesn't exist
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS share_to_community BOOLEAN DEFAULT true;

-- =====================================================
-- 2. UPDATE EXISTING POSTS
-- =====================================================

-- Update existing posts to have share_to_community = true if privacy = 'public'
UPDATE posts
SET share_to_community = true
WHERE privacy = 'public' AND share_to_community IS NULL;

-- Update existing posts to have share_to_community = false if privacy = 'private'
UPDATE posts
SET share_to_community = false
WHERE privacy = 'private' AND share_to_community IS NULL;

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Create index for share_to_community queries
CREATE INDEX IF NOT EXISTS idx_posts_share_to_community ON public.posts(share_to_community);

-- =====================================================
-- 4. VERIFICATION
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
    COUNT(*) as post_count
FROM posts
GROUP BY privacy, share_to_community
ORDER BY privacy, share_to_community;

-- Show summary
SELECT
    'Posts table updated successfully!' as status,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM posts WHERE share_to_community = true) as shared_posts,
    (SELECT COUNT(*) FROM posts WHERE share_to_community = false) as private_posts; 