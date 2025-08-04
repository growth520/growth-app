-- =====================================================
-- FIX CONFIRMED USERS - Run this in Supabase SQL Editor
-- =====================================================
-- This creates profiles for users who confirmed their email but don't have profiles

-- Create profiles for confirmed users who don't have them
INSERT INTO public.profiles (id, full_name, has_completed_assessment)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL 
AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Create user_progress for profiles that don't have them
INSERT INTO public.user_progress (user_id)
SELECT 
    p.id
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Show how many users were fixed
SELECT 
    'Fixed confirmed users without profiles' as action,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NOT NULL 
AND au.email_confirmed_at IS NOT NULL; 