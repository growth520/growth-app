-- TEST THE EXACT FRONTEND INSERT OPERATION
-- This will help us identify what's wrong with the insert

-- 1. First, let's see what columns the table actually has
SELECT '=== ACTUAL TABLE COLUMNS ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 2. Test the exact insert that the frontend is trying to do
SELECT '=== TESTING FRONTEND INSERT ===' as step;
DO $$
BEGIN
    -- This is the exact insert from the frontend
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
    
    RAISE NOTICE 'Frontend-style insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
        RAISE NOTICE 'Error detail: %', SQLERRM;
END $$;

-- 3. Check if there are any RLS policies that might be blocking the insert
SELECT '=== RLS POLICIES ===' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'completed_challenges';

-- 4. Check if the table has the correct permissions
SELECT '=== TABLE PERMISSIONS ===' as step;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'; 