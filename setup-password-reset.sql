-- =====================================================
-- SETUP PASSWORD RESET FUNCTIONALITY
-- =====================================================
-- This script configures Supabase for password reset functionality

-- =====================================================
-- 1. VERIFY AUTH CONFIGURATION
-- =====================================================

-- Check if auth is properly configured
SELECT '=== AUTH CONFIGURATION ===' as info;

-- Verify auth schema exists
SELECT 
    schema_name,
    'Auth schema exists' as status
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- =====================================================
-- 2. SETUP INSTRUCTIONS FOR SUPABASE DASHBOARD
-- =====================================================

/*
MANUAL SETUP REQUIRED IN SUPABASE DASHBOARD:

1. Go to Authentication > Settings
2. Enable "Enable email confirmations"
3. Enable "Enable email change confirmations" 
4. Set "Secure email change" to true
5. Configure SMTP settings (if using custom email provider)

EMAIL TEMPLATES TO CONFIGURE:
- Password Reset Email Template
- Email Confirmation Template

SMTP SETTINGS (if using custom provider):
- Host: your-smtp-host
- Port: 587 (or your SMTP port)
- Username: your-email@domain.com
- Password: your-app-password
- Sender Name: Growth App
- Sender Email: noreply@yourdomain.com

OR USE SUPABASE DEFAULT EMAIL SERVICE (recommended for testing)
*/

-- =====================================================
-- 3. VERIFY CURRENT AUTH POLICIES
-- =====================================================

-- Check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as info;
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. TEST AUTH FUNCTIONS
-- =====================================================

-- Test if auth functions are available
SELECT '=== AUTH FUNCTIONS TEST ===' as info;

-- This will show if auth functions are accessible
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
AND routine_name LIKE '%password%'
ORDER BY routine_name;

-- =====================================================
-- 5. SUMMARY
-- =====================================================

SELECT 
    'Password reset setup instructions:' as info,
    '1. Configure email templates in Supabase Dashboard' as step1,
    '2. Set up SMTP or use Supabase default email service' as step2,
    '3. Test password reset flow with a test user' as step3; 