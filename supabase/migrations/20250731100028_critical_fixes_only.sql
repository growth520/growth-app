-- =====================================================
-- CRITICAL FIXES ONLY
-- =====================================================
-- This migration applies only the most critical fixes

-- 1. FIX MISSING PROFILES AND USER_PROGRESS
-- =====================================================
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

-- 2. FIX USER_PROGRESS FOREIGN KEY
-- =====================================================
-- Ensure user_progress has correct foreign key to profiles
ALTER TABLE public.user_progress
DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

ALTER TABLE public.user_progress
ADD CONSTRAINT user_progress_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. CREATE MISSING TABLES
-- =====================================================
-- Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    post_type VARCHAR(50) DEFAULT 'general',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create completed_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.completed_challenges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reflection TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ENABLE RLS AND POLICIES
-- =====================================================
-- Enable RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
CREATE POLICY "Users can manage their own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for completed_challenges
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own completed challenges" ON public.completed_challenges;
CREATE POLICY "Users can manage their own completed challenges" ON public.completed_challenges FOR ALL USING (auth.uid() = user_id);

-- 5. SUMMARY
-- =====================================================
-- Show summary of fixes applied
SELECT 
    'Critical fixes completed' as status,
    COUNT(*) as total_users_with_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NOT NULL;
