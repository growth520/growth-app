-- Test Database State
-- This script checks the current state of the database to identify issues

-- =====================================================
-- 1. CHECK POSTS TABLE STRUCTURE
-- =====================================================

SELECT '=== POSTS TABLE COLUMNS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 2. CHECK USER_PROGRESS TABLE STRUCTURE
-- =====================================================

SELECT '=== USER_PROGRESS TABLE COLUMNS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK COMPLETED_CHALLENGES TABLE STRUCTURE
-- =====================================================

SELECT '=== COMPLETED_CHALLENGES TABLE COLUMNS ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'completed_challenges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK STREAK FUNCTIONS
-- =====================================================

SELECT '=== STREAK FUNCTIONS ===' as info;
SELECT 
    routine_name,
    routine_type,
    data_type,
    parameter_name,
    parameter_mode,
    parameter_default
FROM information_schema.parameters 
WHERE specific_name LIKE '%update_user_streak_on_completion%'
ORDER BY ordinal_position;

-- =====================================================
-- 5. TEST STREAK FUNCTION
-- =====================================================

SELECT '=== TESTING STREAK FUNCTION ===' as info;
-- This will only work if there's a user_progress record
SELECT 
    'Function exists' as status,
    COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_name = 'update_user_streak_on_completion'
AND routine_schema = 'public';

-- =====================================================
-- 6. CHECK FOR ANY TRIGGERS ON POSTS TABLE
-- =====================================================

SELECT '=== POSTS TABLE TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'posts'
AND trigger_schema = 'public';

-- =====================================================
-- 7. SUMMARY
-- =====================================================

SELECT '=== DATABASE SUMMARY ===' as info;
SELECT 
    'Posts table' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'User_progress table' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND table_schema = 'public'

UNION ALL

SELECT 
    'Completed_challenges table' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'completed_challenges' 
AND table_schema = 'public'; 