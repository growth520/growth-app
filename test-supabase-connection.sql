-- Test script to verify completed_challenges table accessibility
-- Run this in your Supabase SQL editor

-- 1. Check if table exists in public schema
SELECT '=== TABLE EXISTS IN PUBLIC SCHEMA ===' as step;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'completed_challenges'
) as table_exists_in_public;

-- 2. Check if table exists in any schema
SELECT '=== TABLE EXISTS IN ANY SCHEMA ===' as step;
SELECT 
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_name = 'completed_challenges';

-- 3. Check current search_path
SELECT '=== CURRENT SEARCH PATH ===' as step;
SHOW search_path;

-- 4. Try a simple SELECT to test access
SELECT '=== TEST SELECT ACCESS ===' as step;
SELECT COUNT(*) as total_records FROM public.completed_challenges;

-- 5. Check if there are any other tables with similar names
SELECT '=== SIMILAR TABLE NAMES ===' as step;
SELECT 
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_name LIKE '%challenge%'
ORDER BY table_schema, table_name;

-- 6. Check if the table has any data
SELECT '=== TABLE DATA CHECK ===' as step;
SELECT COUNT(*) as record_count FROM public.completed_challenges;

-- 7. Check table permissions for authenticated role
SELECT '=== TABLE PERMISSIONS ===' as step;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'completed_challenges'
AND table_schema = 'public'
ORDER BY grantee, privilege_type; 