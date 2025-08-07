-- Fix completed_challenges table access issues
-- This script ensures the table exists and has proper RLS policies

-- 1. First, let's check if the table exists and show its structure
SELECT '=== CURRENT TABLE STATUS ===' as step;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges';

-- 2. Show current table structure
SELECT '=== CURRENT TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 3. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'completed_challenges';

-- 4. Drop existing RLS policies if they exist
SELECT '=== DROPPING EXISTING POLICIES ===' as step;
DROP POLICY IF EXISTS "Users can view their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can insert their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can update their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can delete their own completed challenges" ON public.completed_challenges;

-- 5. Enable RLS on the table
SELECT '=== ENABLING RLS ===' as step;
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- 6. Create new RLS policies
SELECT '=== CREATING NEW POLICIES ===' as step;

-- Policy for SELECT (users can view their own completed challenges)
CREATE POLICY "Users can view their own completed challenges"
ON public.completed_challenges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for INSERT (users can insert their own completed challenges)
CREATE POLICY "Users can insert their own completed challenges"
ON public.completed_challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (users can update their own completed challenges)
CREATE POLICY "Users can update their own completed challenges"
ON public.completed_challenges
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (users can delete their own completed challenges)
CREATE POLICY "Users can delete their own completed challenges"
ON public.completed_challenges
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Grant necessary permissions
SELECT '=== GRANTING PERMISSIONS ===' as step;
GRANT ALL ON public.completed_challenges TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 8. Verify the policies were created
SELECT '=== VERIFYING POLICIES ===' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'completed_challenges'
ORDER BY policyname;

-- 9. Test insert with a dummy record (will be cleaned up)
SELECT '=== TESTING INSERT ===' as step;
DO $$
BEGIN
    -- Try to insert a test record
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        challenge_title,
        challenge_description,
        reflection,
        photo_url,
        category,
        completed_at,
        xp_earned,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        999,
        'Test Challenge',
        'Test Description',
        'Test reflection',
        NULL,
        'Test Category',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Clean up the test record
    DELETE FROM public.completed_challenges 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 999;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 10. Final verification
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    'Table exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'completed_challenges'
    ) as result
UNION ALL
SELECT 
    'RLS enabled' as check_type,
    rowsecurity as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'completed_challenges'
UNION ALL
SELECT 
    'Policies created' as check_type,
    (COUNT(*) > 0) as result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'completed_challenges';

SELECT '=== COMPLETED_CHALLENGES TABLE FIXED ===' as result; 