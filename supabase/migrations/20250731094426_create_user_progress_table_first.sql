-- =====================================================
-- CREATE USER_PROGRESS TABLE MIGRATION (EARLY)
-- =====================================================
-- This table needs to be created before gamification_enhancements.sql
-- because that migration tries to add columns to user_progress

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
    last_login_date DATE,
    consecutive_login_days INTEGER DEFAULT 0,
    total_challenges_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create foreign key constraint to profiles for proper relationship
ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own progress" 
ON public.user_progress FOR ALL 
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON public.user_progress(xp);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON public.user_progress(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON public.user_progress(streak);

-- Trigger for updated_at
CREATE TRIGGER handle_user_progress_updated_at 
    BEFORE UPDATE ON public.user_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to create user progress when profile is created
CREATE OR REPLACE FUNCTION create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user_progress when profile is created
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_progress();
