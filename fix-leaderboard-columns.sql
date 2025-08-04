-- Fix Leaderboard Columns
-- This script adds the missing total_challenges_completed column and updates existing records

-- 1. Add the missing total_challenges_completed column if it doesn't exist
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0;

-- 2. Update existing records to have some challenge completion data
-- Since we can't determine the actual count from current_challenge_id, 
-- we'll set a reasonable default based on XP and level
UPDATE public.user_progress 
SET total_challenges_completed = CASE 
    WHEN xp >= 500 THEN 25
    WHEN xp >= 300 THEN 15
    WHEN xp >= 100 THEN 8
    ELSE 3
END
WHERE total_challenges_completed = 0 OR total_challenges_completed IS NULL;

-- 3. Add a foreign key relationship between user_progress and profiles
-- This will help with the leaderboard queries
ALTER TABLE public.user_progress 
ADD CONSTRAINT IF NOT EXISTS fk_user_progress_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON public.user_progress(xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON public.user_progress(streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_challenges ON public.user_progress(total_challenges_completed DESC);

-- 5. Verify the changes
SELECT 
    up.user_id,
    p.full_name,
    up.xp,
    up.level,
    up.streak,
    up.total_challenges_completed,
    up.current_challenge_id
FROM public.user_progress up
JOIN public.profiles p ON up.user_id = p.id
ORDER BY up.xp DESC;

-- 6. Test the leaderboard query
SELECT 
    up.user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    up.xp,
    up.level,
    up.streak,
    up.total_challenges_completed
FROM public.user_progress up
JOIN public.profiles p ON up.user_id = p.id
WHERE p.has_completed_assessment = true
ORDER BY up.xp DESC
LIMIT 10; 