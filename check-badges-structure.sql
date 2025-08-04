-- Check current table structure
-- Run this in Supabase SQL Editor to see what exists

-- Check if badges table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'badges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if user_badges table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_badges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if tables exist at all
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('badges', 'user_badges'); 