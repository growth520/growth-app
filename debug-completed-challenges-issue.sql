-- DEBUG COMPLETED_CHALLENGES ISSUE
-- This script will help us identify the exact problem

-- 1. Check if the table exists in the public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'completed_challenges';

-- 2. Check all tables that contain 'completed' in the name
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%completed%';

-- 3. Check if there are any case sensitivity issues
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name ILIKE '%completed%';

-- 4. Check the exact column structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 5. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'completed_challenges';

-- 6. Check current RLS policies
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
WHERE tablename = 'completed_challenges';

-- 7. Test a simple SELECT to see if the table is accessible
SELECT COUNT(*) as total_records FROM public.completed_challenges;

-- 8. Check if there are any triggers that might be causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table = 'completed_challenges';

-- 9. Check if the user has proper permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges';

-- 10. Try to insert a test record to see the exact error
-- (This will help us understand what's wrong)
DO $$
BEGIN
    -- This will show us the exact error if there is one
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        completed_at,
        reflection,
        photo_url,
        category,
        challenge_title,
        challenge_description,
        xp_earned,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        1,
        NOW(),
        'Test reflection',
        NULL,
        'Test',
        'Test Challenge',
        'Test Description',
        10,
        false
    );
    
    RAISE NOTICE 'Test insert successful';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 11. Verification query
SELECT 'Debug completed successfully!' as result; 