-- Check for field name conflicts that might cause the error
-- Run this in your Supabase SQL editor

-- 1. Check if there's a field called 'completed_challenges' in any table
SELECT '=== FIELD NAME CONFLICTS ===' as step;
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name LIKE '%completed%'
ORDER BY table_schema, table_name, column_name;

-- 2. Check user_progress table specifically for completed_challenges field
SELECT '=== USER_PROGRESS FIELDS ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_progress'
ORDER BY ordinal_position;

-- 3. Check if there are any views or functions that might be causing issues
SELECT '=== VIEWS WITH COMPLETED_CHALLENGES ===' as step;
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name LIKE '%completed%'
OR table_name LIKE '%challenge%';

-- 4. Check if there are any functions that reference completed_challenges
SELECT '=== FUNCTIONS REFERENCING COMPLETED_CHALLENGES ===' as step;
SELECT 
    routine_schema,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_definition LIKE '%completed_challenges%'
OR routine_definition LIKE '%completed_challenges%';

-- 5. Check the exact error by trying to access the table directly
SELECT '=== DIRECT TABLE ACCESS TEST ===' as step;
SELECT 
    'Table exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'completed_challenges'
    ) as result
UNION ALL
SELECT 
    'Can select from table' as check_type,
    (SELECT COUNT(*) FROM public.completed_challenges LIMIT 1) >= 0 as result; 