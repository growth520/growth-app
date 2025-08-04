-- =====================================================
-- SIMPLE FIX: ADD MISSING COLUMNS ONLY
-- =====================================================
-- This script only adds missing columns to fix the query errors
-- No foreign key constraints to avoid type mismatches

-- 1. ADD MISSING COLUMNS TO USER_PROGRESS TABLE
-- =====================================================
-- Add last_challenge_completed_date if it doesn't exist
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS last_challenge_completed_date TIMESTAMP WITH TIME ZONE;

-- Add longest_streak if it doesn't exist
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- 2. ADD MISSING COLUMNS TO POSTS TABLE
-- =====================================================
-- Add visibility column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';

-- Add flagged column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;

-- 3. VERIFY THE CHANGES
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Added missing columns:';
    RAISE NOTICE '- user_progress.last_challenge_completed_date';
    RAISE NOTICE '- user_progress.longest_streak';
    RAISE NOTICE '- posts.visibility';
    RAISE NOTICE '- posts.flagged';
    RAISE NOTICE 'All missing columns have been added!';
END $$; 