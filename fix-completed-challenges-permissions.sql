-- FIX COMPLETED_CHALLENGES PERMISSIONS
-- This will properly set up permissions for the authenticated role

-- 1. First, let's check the current state
SELECT '=== CURRENT PERMISSIONS ===' as step;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY grantee, privilege_type;

-- 2. Grant proper permissions to authenticated role
SELECT '=== GRANTING PERMISSIONS ===' as step;

-- Grant all necessary permissions to authenticated role
GRANT ALL ON public.completed_challenges TO authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant specific permissions explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON public.completed_challenges TO authenticated;

-- 3. Check RLS policies
SELECT '=== RLS POLICIES ===' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'completed_challenges';

-- 4. Ensure RLS is enabled and policies are correct
SELECT '=== SETTING UP RLS ===' as step;

-- Enable RLS if not already enabled
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can insert their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can update their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can delete their own completed challenges" ON public.completed_challenges;

-- Create proper RLS policies
CREATE POLICY "Users can view their own completed challenges" ON public.completed_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges" ON public.completed_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed challenges" ON public.completed_challenges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed challenges" ON public.completed_challenges
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Test the insert operation
SELECT '=== TESTING INSERT ===' as step;
DO $$
BEGIN
    -- Test insert with authenticated user context
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
        1,
        'Test Challenge Title',
        'Test Challenge Description',
        'Test reflection text',
        NULL,
        'Test Category',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 6. Verify final permissions
SELECT '=== FINAL PERMISSIONS ===' as step;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
AND grantee = 'authenticated'
ORDER BY privilege_type;

-- 7. Show final RLS policies
SELECT '=== FINAL RLS POLICIES ===' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'completed_challenges';

SELECT 'Permissions and RLS setup completed!' as result; 