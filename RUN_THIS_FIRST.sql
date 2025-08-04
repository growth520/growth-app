-- =====================================================
-- RUN THIS FIRST - Fix missing profiles causing 400 errors
-- =====================================================
-- Run this in Supabase SQL Editor to fix the 400 Bad Request errors

-- Create profiles for ALL users who don't have them
INSERT INTO public.profiles (id, full_name, has_completed_assessment)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create user_progress for ALL profiles that don't have them
INSERT INTO public.user_progress (user_id)
SELECT 
    p.id
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Show summary
SELECT 
    'Fixed users without profiles' as action,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NOT NULL; 