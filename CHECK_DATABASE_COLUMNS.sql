-- Check Database Columns
-- Run these queries to see what columns actually exist

-- 1. Check user_pack_progress table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_pack_progress'
ORDER BY ordinal_position;

-- 2. Check if reflection column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_pack_progress'
AND column_name = 'reflection';

-- 3. Check all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Check auth.users table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position; 