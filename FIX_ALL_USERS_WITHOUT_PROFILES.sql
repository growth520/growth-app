-- =====================================================
-- FIX ALL USERS WITHOUT PROFILES - Run this in Supabase SQL Editor
-- =====================================================
-- This creates profiles for ALL users who exist in auth.users but don't have profiles

-- 1. Create profiles for ALL users who don't have them
INSERT INTO public.profiles (id, full_name, has_completed_assessment)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Create user_progress for ALL profiles that don't have them
INSERT INTO public.user_progress (user_id)
SELECT 
    p.id
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Show summary of what was fixed
SELECT 
    'Users without profiles' as issue,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'Profiles without user_progress' as issue,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL

UNION ALL

SELECT 
    'Total users in auth.users' as issue,
    COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
    'Total profiles created' as issue,
    COUNT(*) as count
FROM public.profiles; 