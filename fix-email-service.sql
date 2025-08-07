-- =====================================================
-- CHECK AND FIX EMAIL SERVICE CONFIGURATION
-- =====================================================
-- This script helps diagnose email service issues

-- =====================================================
-- 1. CHECK AUTH CONFIGURATION
-- =====================================================

-- Check if auth is properly configured
SELECT '=== AUTH CONFIGURATION CHECK ===' as info;

-- Verify auth schema exists
SELECT 
    schema_name,
    'Auth schema exists' as status
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- =====================================================
-- 2. CHECK EMAIL SETTINGS
-- =====================================================

-- Check if email confirmations are enabled
SELECT '=== EMAIL SETTINGS CHECK ===' as info;

-- This query checks if email confirmations are enabled
-- Note: This is a manual check - you need to verify in Supabase Dashboard

/*
MANUAL STEPS TO FIX EMAIL ISSUE:

1. Go to Supabase Dashboard → Authentication → Settings
2. Enable "Enable email confirmations"
3. Enable "Enable email change confirmations"
4. Set "Secure email change" to true

5. Go to Authentication → Email Templates
6. Configure the "Password Reset" template:
   - Subject: "Reset your Growth App password"
   - Content: Include the reset link and your app branding

7. Go to Authentication → Settings → SMTP Settings
8. Either:
   - Use Supabase default email service (recommended for testing)
   - Or configure custom SMTP with your email provider

COMMON ISSUES:
- Email confirmations not enabled
- SMTP not configured
- Email templates not set up
- Project in paused state
- Rate limiting exceeded
*/

-- =====================================================
-- 3. VERIFY PROJECT STATUS
-- =====================================================

-- Check if project is active
SELECT '=== PROJECT STATUS CHECK ===' as info;

-- This would normally check project status, but we can't access that via SQL
-- Instead, check in Supabase Dashboard → Settings → General

/*
PROJECT STATUS CHECK:
1. Go to Supabase Dashboard → Settings → General
2. Verify project is not paused
3. Check if you're on a paid plan (free tier has limitations)
4. Verify project is in an active region
*/

-- =====================================================
-- 4. SUMMARY
-- =====================================================

SELECT 
    'Email configuration check complete!' as status,
    'Please follow the manual steps above to fix email issues.' as next_steps; 