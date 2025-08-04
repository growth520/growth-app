-- =====================================================
-- CHECK DATABASE STRUCTURE - Run this in Supabase SQL Editor
-- =====================================================
-- This will show us the actual structure of your tables

-- 1. Check if user_progress table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints on user_progress
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'user_progress';

-- 3. Check if profiles table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if auth.users table exists (should exist by default)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- 5. Check recent auth.users entries
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check recent profiles entries (without created_at)
SELECT id, full_name, has_completed_assessment, updated_at 
FROM public.profiles 
ORDER BY updated_at DESC 
LIMIT 5;

-- 7. Check recent user_progress entries
SELECT id, user_id, xp, level, created_at 
FROM public.user_progress 
ORDER BY created_at DESC 
LIMIT 5; 