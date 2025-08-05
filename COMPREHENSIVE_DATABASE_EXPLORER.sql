-- Comprehensive Database Explorer
-- Run these queries ONE AT A TIME in Supabase SQL Editor

-- 1. List ALL schemas in the database
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;

-- 2. List ALL tables in ALL schemas
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name;

-- 3. List ALL columns in ALL tables (this will be a lot of data)
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name, ordinal_position;

-- 4. Check auth schema specifically
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth'
ORDER BY table_name, ordinal_position;

-- 5. Check public schema specifically
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 6. Check if auth.users table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 7. Check if public.users table exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 8. Check what tables exist in auth schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 9. Check what tables exist in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 10. Check if we can access auth.users at all
SELECT COUNT(*) as user_count FROM auth.users;

-- 11. Check current user and permissions
SELECT 
  current_user,
  session_user,
  current_schema();

-- 12. Check if we can create functions
SELECT has_function_privilege(current_user, 'public', 'CREATE') as can_create_functions;

-- 13. Check RLS status on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname IN ('auth', 'public')
ORDER BY schemaname, tablename;

-- 14. Check all functions in public schema
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 15. Check all views
SELECT 
  table_schema,
  table_name
FROM information_schema.views 
WHERE table_schema IN ('auth', 'public')
ORDER BY table_schema, table_name; 