-- DEBUG COLUMN MISMATCH
-- This will help us identify if there's a column mismatch

-- 1. Show all columns in the completed_challenges table
SELECT '=== ACTUAL TABLE COLUMNS ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 2. Show what the frontend is trying to insert
SELECT '=== FRONTEND INSERT FIELDS ===' as step;
SELECT 'user_id' as field_name, 'UUID' as expected_type
UNION ALL SELECT 'challenge_id', 'INTEGER'
UNION ALL SELECT 'challenge_title', 'TEXT'
UNION ALL SELECT 'challenge_description', 'TEXT'
UNION ALL SELECT 'reflection', 'TEXT'
UNION ALL SELECT 'photo_url', 'TEXT'
UNION ALL SELECT 'category', 'TEXT'
UNION ALL SELECT 'completed_at', 'TIMESTAMP'
UNION ALL SELECT 'xp_earned', 'INTEGER'
UNION ALL SELECT 'is_extra_challenge', 'BOOLEAN';

-- 3. Test a minimal insert with only required fields
SELECT '=== TESTING MINIMAL INSERT ===' as step;
DO $$
BEGIN
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        1
    );
    
    RAISE NOTICE 'Minimal insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 4. Test the exact frontend insert structure
SELECT '=== TESTING EXACT FRONTEND INSERT ===' as step;
DO $$
BEGIN
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
    
    RAISE NOTICE 'Exact frontend insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
        RAISE NOTICE 'Error detail: %', SQLERRM;
END $$;

-- 5. Check if there are any triggers that might be causing issues
SELECT '=== TRIGGERS ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'completed_challenges';

-- 6. Check if the table has any constraints that might be causing issues
SELECT '=== CONSTRAINTS ===' as step;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'; 