-- =====================================================
-- COMPREHENSIVE USER_PROGRESS FIX
-- =====================================================
-- This script fixes all user_progress table issues

-- 1. First, ensure the table exists with all required columns
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    total_challenges_completed INTEGER DEFAULT 0,
    current_challenge_id INTEGER,
    challenge_assigned_at TIMESTAMP WITH TIME ZONE,
    last_viewed_notifications TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    xp_to_next_level INTEGER DEFAULT 100,
    tokens INTEGER DEFAULT 0,
    streak_freezes_used INTEGER DEFAULT 0,
    last_streak_freeze_date DATE,
    longest_streak INTEGER DEFAULT 0,
    last_challenge_completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Add any missing columns
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0;

ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS last_challenge_completed_date TIMESTAMP WITH TIME ZONE;

-- 3. Ensure foreign key constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_progress_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_progress 
        ADD CONSTRAINT user_progress_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_progress' 
        AND policyname = 'Users can manage their own progress'
    ) THEN
        CREATE POLICY "Users can manage their own progress" 
        ON public.user_progress FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON public.user_progress(xp);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON public.user_progress(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON public.user_progress(streak);

-- 7. Create updated_at trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_user_progress_updated_at'
    ) THEN
        CREATE TRIGGER handle_user_progress_updated_at 
            BEFORE UPDATE ON public.user_progress 
            FOR EACH ROW 
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 8. Temporarily disable RLS to create missing records
ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;

-- 9. Insert user_progress records for profiles that don't have them
INSERT INTO public.user_progress (
    user_id,
    xp,
    level,
    streak,
    total_challenges_completed,
    current_challenge_id,
    challenge_assigned_at,
    last_viewed_notifications,
    xp_to_next_level,
    tokens,
    streak_freezes_used,
    last_streak_freeze_date,
    longest_streak,
    last_challenge_completed_date,
    created_at,
    updated_at
)
SELECT 
    p.id as user_id,
    0 as xp,
    1 as level,
    0 as streak,
    0 as total_challenges_completed,
    NULL as current_challenge_id,
    NULL as challenge_assigned_at,
    timezone('utc'::text, now()) as last_viewed_notifications,
    100 as xp_to_next_level,
    0 as tokens,
    0 as streak_freezes_used,
    NULL as last_streak_freeze_date,
    0 as longest_streak,
    NULL as last_challenge_completed_date,
    timezone('utc'::text, now()) as created_at,
    timezone('utc'::text, now()) as updated_at
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 10. Re-enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 11. Verify the fix
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

-- 12. Show sample data
SELECT 
    p.full_name,
    p.username,
    up.xp,
    up.level,
    up.streak,
    up.xp_to_next_level,
    up.total_challenges_completed
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
ORDER BY p.created_at DESC
LIMIT 5; 