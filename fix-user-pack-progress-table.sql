-- Fix user_pack_progress table missing columns
-- This script adds the missing completed_challenges column that the frontend expects

-- =====================================================
-- 1. ADD MISSING COLUMNS TO USER_PACK_PROGRESS TABLE
-- =====================================================

-- Add missing columns to user_pack_progress table
ALTER TABLE public.user_pack_progress 
ADD COLUMN IF NOT EXISTS completed_challenges INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_challenges INTEGER DEFAULT 0;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_completed_challenges ON public.user_pack_progress(completed_challenges);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_total_challenges ON public.user_pack_progress(total_challenges);

-- Update existing records to have default values
UPDATE user_pack_progress 
SET 
  completed_challenges = COALESCE(completed_challenges, 0),
  total_challenges = COALESCE(total_challenges, 0)
WHERE 
  completed_challenges IS NULL 
  OR total_challenges IS NULL;

-- =====================================================
-- 2. VERIFICATION
-- =====================================================

-- Show user_pack_progress table structure
SELECT '=== USER_PACK_PROGRESS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_pack_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show summary
SELECT 
    'User pack progress table fixed successfully!' as status,
    (SELECT COUNT(*) FROM user_pack_progress) as total_user_pack_progress_records; 