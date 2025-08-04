-- =====================================================
-- COMPREHENSIVE FIXES MIGRATION
-- =====================================================
-- This migration fixes all the database issues in the correct order

-- 1. CREATE USER_PROGRESS TABLE FIRST
-- =====================================================
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
ADD CONSTRAINT IF NOT EXISTS user_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
CREATE POLICY "Users can manage their own progress" 
ON public.user_progress FOR ALL 
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON public.user_progress(xp);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON public.user_progress(level);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON public.user_progress(streak);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_user_progress_updated_at ON public.user_progress;
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
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_progress();

-- 2. FIX MISSING PROFILES AND USER_PROGRESS
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

-- 3. CREATE TOKEN SYSTEM TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) DEFAULT 'streak_freeze',
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, token_type)
);

CREATE TABLE IF NOT EXISTS public.token_transactions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) DEFAULT 'streak_freeze',
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    source VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for token tables
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tokens
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.user_tokens;
CREATE POLICY "Users can manage their own tokens" ON public.user_tokens FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own token transactions" ON public.token_transactions;
CREATE POLICY "Users can read their own token transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert token transactions" ON public.token_transactions;
CREATE POLICY "System can insert token transactions" ON public.token_transactions FOR INSERT WITH CHECK (true);

-- 4. CREATE TOKEN FUNCTIONS
-- =====================================================
-- Function to award tokens to users
CREATE OR REPLACE FUNCTION award_tokens(
    p_user_id UUID,
    p_amount INTEGER,
    p_source VARCHAR(100),
    p_description TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert or update user tokens
    INSERT INTO user_tokens (user_id, token_type, balance, total_earned)
    VALUES (p_user_id, 'streak_freeze', p_amount, p_amount)
    ON CONFLICT (user_id, token_type)
    DO UPDATE SET 
        balance = user_tokens.balance + p_amount,
        total_earned = user_tokens.total_earned + p_amount,
        updated_at = timezone('utc'::text, now());

    -- Record transaction
    INSERT INTO token_transactions (user_id, token_type, amount, transaction_type, source, description)
    VALUES (p_user_id, 'streak_freeze', p_amount, 'earned', p_source, p_description);

    -- Update user progress tokens (for quick access)
    UPDATE user_progress 
    SET tokens = COALESCE((SELECT balance FROM user_tokens WHERE user_id = p_user_id AND token_type = 'streak_freeze'), 0)
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize user tokens when a new user signs up
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize token balance to 0 for new users
    INSERT INTO user_tokens (user_id, token_type, balance, total_earned, total_spent)
    VALUES (NEW.user_id, 'streak_freeze', 0, 0, 0)
    ON CONFLICT (user_id, token_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically initialize tokens when user_progress is created
DROP TRIGGER IF EXISTS initialize_user_tokens_trigger ON public.user_progress;
CREATE TRIGGER initialize_user_tokens_trigger
    AFTER INSERT ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION initialize_user_tokens();

-- Function to update challenge completion count and check for milestones
CREATE OR REPLACE FUNCTION update_challenge_completion(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Increment challenge count
    UPDATE user_progress 
    SET total_challenges_completed = COALESCE(total_challenges_completed, 0) + 1
    WHERE user_id = p_user_id
    RETURNING total_challenges_completed INTO new_count;

    -- Award milestone token every 10 challenges
    IF new_count % 10 = 0 THEN
        PERFORM award_tokens(
            p_user_id,
            1,
            'milestone',
            new_count || ' challenges completed milestone'
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award daily login bonus
CREATE OR REPLACE FUNCTION check_daily_login_bonus(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_login DATE;
    consecutive_days INTEGER;
    today DATE := CURRENT_DATE;
    days_diff INTEGER;
    new_consecutive_days INTEGER;
BEGIN
    -- Get current login data
    SELECT last_login_date, consecutive_login_days 
    INTO last_login, consecutive_days
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Calculate consecutive days
    IF last_login IS NULL THEN
        new_consecutive_days := 1;
    ELSE
        days_diff := today - last_login;
        IF days_diff = 1 THEN
            new_consecutive_days := COALESCE(consecutive_days, 0) + 1;
        ELSIF days_diff = 0 THEN
            new_consecutive_days := COALESCE(consecutive_days, 1); -- Same day
            RETURN FALSE; -- Don't process twice in same day
        ELSE
            new_consecutive_days := 1; -- Streak broken, restart
        END IF;
    END IF;

    -- Update login data
    UPDATE user_progress 
    SET 
        last_login_date = today,
        consecutive_login_days = new_consecutive_days
    WHERE user_id = p_user_id;

    -- Award bonus for 7 consecutive days
    IF new_consecutive_days = 7 THEN
        PERFORM award_tokens(
            p_user_id,
            1,
            'login_bonus',
            '7-day consecutive login bonus'
        );
        
        -- Reset consecutive days counter
        UPDATE user_progress 
        SET consecutive_login_days = 0
        WHERE user_id = p_user_id;
        
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION award_tokens(UUID, INTEGER, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_challenge_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_login_bonus(UUID) TO authenticated;

-- 5. SUMMARY
-- =====================================================
-- Show summary of fixes applied
SELECT 
    'Database fixes completed' as status,
    COUNT(*) as total_users_with_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NOT NULL;
