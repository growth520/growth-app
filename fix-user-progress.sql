-- =====================================================
-- FIX MISSING USER_PROGRESS RECORDS
-- =====================================================
-- This script creates user_progress records for profiles that don't have them

-- Temporarily disable RLS to allow admin operations
ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;

-- Insert user_progress records for profiles that don't have them
INSERT INTO public.user_progress (
    user_id,
    xp,
    level,
    streak,
    current_challenge_id,
    challenge_assigned_at,
    last_viewed_notifications,
    xp_to_next_level,
    tokens,
    streak_freezes_used,
    last_streak_freeze_date,
    created_at,
    updated_at
)
SELECT 
    p.id as user_id,
    0 as xp,
    1 as level,
    0 as streak,
    NULL as current_challenge_id,
    NULL as challenge_assigned_at,
    timezone('utc'::text, now()) as last_viewed_notifications,
    100 as xp_to_next_level,
    0 as tokens,
    0 as streak_freezes_used,
    NULL as last_streak_freeze_date,
    timezone('utc'::text, now()) as created_at,
    timezone('utc'::text, now()) as updated_at
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 
    'Profiles count' as metric,
    COUNT(*) as value
FROM public.profiles
UNION ALL
SELECT 
    'User progress count' as metric,
    COUNT(*) as value
FROM public.user_progress
UNION ALL
SELECT 
    'Profiles without progress' as metric,
    COUNT(*) as value
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL;

-- Show sample data
SELECT 
    p.full_name,
    p.username,
    up.xp,
    up.level,
    up.streak,
    up.xp_to_next_level
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
ORDER BY p.created_at DESC
LIMIT 5; 