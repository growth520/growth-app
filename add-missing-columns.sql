-- =====================================================
-- ADD MISSING COLUMNS TO FIX REMAINING ERRORS
-- =====================================================

-- 1. ADD MISSING COLUMNS TO USER_PROGRESS TABLE
-- =====================================================
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- 2. ADD MISSING COLUMNS TO POSTS TABLE
-- =====================================================
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;

-- 3. VERIFY THE CHANGES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Added missing columns:';
    RAISE NOTICE '- user_progress.longest_streak';
    RAISE NOTICE '- posts.visibility';
    RAISE NOTICE '- posts.flagged';
    RAISE NOTICE 'All database schema issues should now be resolved!';
END $$; 