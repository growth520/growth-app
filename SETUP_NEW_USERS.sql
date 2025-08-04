-- =====================================================
-- SETUP NEW USERS - Run this in Supabase SQL Editor
-- =====================================================
-- This ensures new users can be created and have proper profiles

-- 1. First, clean up any existing triggers to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- 2. Drop existing functions to recreate them cleanly
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_user_progress();

-- 3. Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    current_challenge_id INTEGER,
    challenge_assigned_at TIMESTAMP WITH TIME ZONE,
    last_viewed_notifications TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    xp_to_next_level INTEGER DEFAULT 100,
    tokens INTEGER DEFAULT 0,
    streak_freezes_used INTEGER DEFAULT 0,
    last_streak_freeze_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 4. Enable RLS for user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy for user_progress
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
CREATE POLICY "Users can manage their own progress" 
ON public.user_progress FOR ALL 
USING (auth.uid() = user_id);

-- 6. Create function to handle new users (works with existing profiles table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile first
    INSERT INTO public.profiles (id, full_name, has_completed_assessment)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        false
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create user_progress directly here to avoid trigger conflicts
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create profiles for existing users who don't have them
INSERT INTO public.profiles (id, full_name, has_completed_assessment)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Create user_progress for existing profiles who don't have them
INSERT INTO public.user_progress (user_id)
SELECT 
    p.id
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Success message
SELECT 'New user setup completed successfully!' as status; 