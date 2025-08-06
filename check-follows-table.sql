-- Check follows table structure and RLS policies
-- This script will help diagnose the 400 error when trying to follow users

-- 1. Check if follows table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'follows' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies on follows table
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
WHERE tablename = 'follows';

-- 3. Check if follows table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'follows';

-- 4. Show sample data from follows table
SELECT * FROM follows LIMIT 5;

-- 5. Check if there are any constraints
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'follows'::regclass; 