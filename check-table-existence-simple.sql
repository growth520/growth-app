-- Simple diagnostic to check if completed_challenges table exists
-- Run this in your Supabase SQL editor

-- 1. Check if table exists
SELECT '=== TABLE EXISTS CHECK ===' as step;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'completed_challenges'
) as table_exists;

-- 2. If table exists, show its structure
SELECT '=== TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT '=== RLS STATUS ===' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'completed_challenges';

-- 4. Check RLS policies
SELECT '=== RLS POLICIES ===' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'completed_challenges';

-- 5. Try a simple SELECT to test access
SELECT '=== TEST SELECT ===' as step;
SELECT COUNT(*) as total_records FROM public.completed_challenges LIMIT 1;

-- 6. Check if we can see the table in the schema
SELECT '=== SCHEMA TABLES ===' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%challenge%'
ORDER BY table_name; 