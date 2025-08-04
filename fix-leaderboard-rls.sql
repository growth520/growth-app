-- Fix Leaderboard RLS Policies
-- This script updates RLS policies to allow leaderboard access

-- 1. Check current RLS policies on user_progress
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_progress';

-- 2. Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;

-- 3. Create new policies that allow leaderboard access
-- Policy for viewing: Allow users to see all progress data for leaderboard
CREATE POLICY "Allow leaderboard access" ON public.user_progress
FOR SELECT USING (true);

-- Policy for inserting: Allow users to insert their own progress
CREATE POLICY "Users can insert own progress" ON public.user_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating: Allow users to update their own progress
CREATE POLICY "Users can update own progress" ON public.user_progress
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_progress';

-- 5. Test the leaderboard query
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