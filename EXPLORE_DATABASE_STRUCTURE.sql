-- Explore Database Structure for Password Management
-- Run this in your Supabase SQL Editor to understand the current structure

-- 1. Check if auth.users table exists and its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if public.users table exists (some setups use this)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check what tables exist in auth schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 4. Check what tables exist in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. Check if there are any existing functions
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%password%'
ORDER BY routine_name;

-- 6. Check if there are any existing functions with 'user' in the name
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- 7. Check the current user's auth metadata (if you're logged in)
-- This will show you what fields are available in the user object
SELECT 
  id,
  email,
  app_metadata,
  raw_app_meta_data,
  raw_user_meta_data,
  encrypted_password,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
LIMIT 5;

-- 8. Check if RLS is enabled on auth.users
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- 9. Check current user's permissions
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- 10. Check if we can access auth.users at all
SELECT COUNT(*) as user_count FROM auth.users;

-- 11. Check what authentication providers are configured
SELECT DISTINCT 
  app_metadata->>'provider' as provider,
  COUNT(*) as user_count
FROM auth.users 
WHERE app_metadata->>'provider' IS NOT NULL
GROUP BY app_metadata->>'provider';

-- 12. Check password status of users
SELECT 
  CASE 
    WHEN encrypted_password IS NOT NULL AND encrypted_password != '' 
    THEN 'has_password'
    ELSE 'no_password'
  END as password_status,
  app_metadata->>'provider' as auth_provider,
  COUNT(*) as user_count
FROM auth.users 
GROUP BY 
  CASE 
    WHEN encrypted_password IS NOT NULL AND encrypted_password != '' 
    THEN 'has_password'
    ELSE 'no_password'
  END,
  app_metadata->>'provider';

-- 13. Check if we can create functions
SELECT has_function_privilege(current_user, 'public', 'CREATE') as can_create_functions;

-- 14. Check current user's role
SELECT current_user, session_user;

-- 15. Check if we're in the right schema
SELECT current_schema(); 