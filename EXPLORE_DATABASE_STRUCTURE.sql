-- Explore Database Structure for Password Management
-- Run these queries ONE AT A TIME in your Supabase SQL Editor

-- Query 1: Check auth.users table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Query 2: Check if public.users table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Query 3: Check what tables exist in auth schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Query 4: Check what tables exist in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Query 5: Check for existing password functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%password%'
ORDER BY routine_name;

-- Query 6: Check for existing user functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Query 7: Check auth.users data structure
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
LIMIT 5;

-- Query 8: Check RLS on auth.users
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- Query 9: Check permissions on auth.users
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- Query 10: Check user count
SELECT COUNT(*) as user_count FROM auth.users;

-- Query 11: Check for metadata columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name LIKE '%meta%';

-- Query 12: Check password status
SELECT 
  CASE 
    WHEN encrypted_password IS NOT NULL AND encrypted_password != '' 
    THEN 'has_password'
    ELSE 'no_password'
  END as password_status,
  COUNT(*) as user_count
FROM auth.users 
GROUP BY 
  CASE 
    WHEN encrypted_password IS NOT NULL AND encrypted_password != '' 
    THEN 'has_password'
    ELSE 'no_password'
  END;

-- Query 13: Check function creation privileges
SELECT has_function_privilege(current_user, 'public', 'CREATE') as can_create_functions;

-- Query 14: Check current user
SELECT current_user, session_user;

-- Query 15: Check current schema
SELECT current_schema();

-- Query 16: Check for JSON columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND data_type LIKE '%json%';

-- Query 17: Check for text columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND data_type = 'text';

-- Query 18: Check basic user data
SELECT 
  id,
  email,
  created_at
FROM auth.users 
LIMIT 3; 