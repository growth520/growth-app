-- =====================================================
-- ADD MISSING COLUMNS TO USER_PROGRESS TABLE
-- =====================================================
-- This script adds any missing columns that the progress page expects

-- Add total_challenges_completed column if it doesn't exist
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0;

-- Add longest_streak column if it doesn't exist
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Add last_challenge_completed_date column if it doesn't exist
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS last_challenge_completed_date TIMESTAMP WITH TIME ZONE;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position; 