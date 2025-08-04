-- =====================================================
-- DIAGNOSE USER ISSUE - Run this in Supabase SQL Editor
-- =====================================================
-- This helps identify issues with specific users

-- 1. Check all users and their profile status
SELECT 
    au.id as user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at as auth_created,
    CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'Missing Profile' END as profile_status,
    p.has_completed_assessment,
    p.assessment_results IS NOT NULL as has_assessment_results,
    up.user_id IS NOT NULL as has_progress
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_progress up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- 2. Check for users with incomplete data
SELECT 
    'Users without profiles' as issue,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Users without user_progress' as issue,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL

UNION ALL

SELECT 
    'Users with profiles but no assessment' as issue,
    COUNT(*) as count
FROM public.profiles p
WHERE p.has_completed_assessment = false OR p.has_completed_assessment IS NULL;

-- 3. Check for any constraint violations
SELECT 
    'Total auth users' as metric,
    COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
    'Total profiles' as metric,
    COUNT(*) as count
FROM public.profiles

UNION ALL

SELECT 
    'Total user_progress' as metric,
    COUNT(*) as count
FROM public.user_progress; 