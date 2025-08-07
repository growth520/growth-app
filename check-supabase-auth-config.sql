-- =====================================================
-- CHECK SUPABASE AUTH CONFIGURATION
-- =====================================================
-- This script helps diagnose authentication configuration issues

-- =====================================================
-- 1. CHECK AUTH SCHEMA
-- =====================================================

SELECT '=== AUTH SCHEMA CHECK ===' as info;

-- Check if auth schema exists
SELECT 
    schema_name,
    'Auth schema exists' as status
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- =====================================================
-- 2. CHECK AUTH TABLES
-- =====================================================

SELECT '=== AUTH TABLES CHECK ===' as info;

-- List auth tables
SELECT 
    table_name,
    'Auth table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- =====================================================
-- 3. CHECK AUTH FUNCTIONS
-- =====================================================

SELECT '=== AUTH FUNCTIONS CHECK ===' as info;

-- List auth functions
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
AND routine_name LIKE '%password%'
ORDER BY routine_name;

-- =====================================================
-- 4. MANUAL CONFIGURATION CHECK
-- =====================================================

/*
MANUAL STEPS TO CHECK SUPABASE CONFIGURATION:

1. Go to Supabase Dashboard → Authentication → Settings
2. Check "Site URL" - should be: https://www.growthapp.site
3. Check "Redirect URLs" - should include:
   - https://www.growthapp.site/auth/callback
   - https://www.growthapp.site/reset-password
   - https://www.growthapp.site/login

4. Go to Authentication → Email Templates
5. Check "Password Reset" template:
   - Subject should be configured
   - Content should include the reset link
   - Reset link should point to: https://www.growthapp.site/reset-password

6. Go to Authentication → Settings → SMTP Settings
7. Verify email service is configured

COMMON ISSUES:
- Site URL not set correctly
- Redirect URLs missing /reset-password
- Email template not configured
- SMTP not set up
*/

-- =====================================================
-- 5. SUMMARY
-- =====================================================

SELECT 
    'Auth configuration check complete!' as status,
    'Please check the manual steps above for configuration issues.' as next_steps; 