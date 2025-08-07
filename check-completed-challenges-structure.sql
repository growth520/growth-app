-- Check the exact structure of completed_challenges table
-- Run this in your Supabase SQL editor

-- 1. Show the exact table structure
SELECT '=== EXACT TABLE STRUCTURE ===' as step;
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

-- 2. Show what the frontend is trying to insert
SELECT '=== FRONTEND INSERT FIELDS ===' as step;
SELECT 'user_id' as field_name, 'UUID' as expected_type, 'Required' as status
UNION ALL SELECT 'challenge_id', 'INTEGER', 'Required'
UNION ALL SELECT 'challenge_title', 'TEXT', 'Required'
UNION ALL SELECT 'challenge_description', 'TEXT', 'Required'
UNION ALL SELECT 'reflection', 'TEXT', 'Required'
UNION ALL SELECT 'photo_url', 'TEXT', 'Optional'
UNION ALL SELECT 'category', 'TEXT', 'Required'
UNION ALL SELECT 'completed_at', 'TIMESTAMP', 'Required'
UNION ALL SELECT 'xp_earned', 'INTEGER', 'Required'
UNION ALL SELECT 'is_extra_challenge', 'BOOLEAN', 'Required';

-- 3. Check if there are any constraints that might be causing issues
SELECT '=== TABLE CONSTRAINTS ===' as step;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'completed_challenges';

-- 4. Check if there are any triggers that might be interfering
SELECT '=== TRIGGERS ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'completed_challenges';

-- 5. Test a minimal insert to see what the actual error is
SELECT '=== TESTING MINIMAL INSERT ===' as step;
DO $$
BEGIN
    -- Try with just the required fields
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
        RAISE NOTICE 'Minimal insert failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 6. Check if the table has an id column and what type it is
SELECT '=== ID COLUMN CHECK ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'completed_challenges'
AND column_name = 'id'; 