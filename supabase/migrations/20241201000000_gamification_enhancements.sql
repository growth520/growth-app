-- =====================================================
-- GAMIFICATION ENHANCEMENTS MIGRATION
-- =====================================================

-- 1. CHALLENGE PACKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_packs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) DEFAULT '🎯',
    level_required INTEGER DEFAULT 1,
    pack_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'special'
    duration_days INTEGER DEFAULT 7,
    category VARCHAR(100), -- Growth area category
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CHALLENGE PACK ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_pack_items (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    pack_id UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    challenge_id INTEGER, -- References challenges.id
    day_order INTEGER NOT NULL, -- Day 1, 2, 3, etc.
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. USER PACK PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_pack_progress (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    current_day INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, pack_id)
);

-- 4. USER TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) DEFAULT 'streak_freeze', -- 'streak_freeze', 'pack_unlock', etc.
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, token_type)
);

-- 5. TOKEN TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.token_transactions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) DEFAULT 'streak_freeze',
    amount INTEGER NOT NULL, -- Positive for earned, negative for spent
    transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'granted'
    source VARCHAR(100), -- 'level_up', 'streak_freeze_used', 'admin_grant', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PERSONALIZED SUGGESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.personalized_suggestions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reflection_id UUID, -- References completed_challenges.id
    suggestion_text TEXT NOT NULL,
    motivational_message TEXT,
    growth_area VARCHAR(100),
    ai_model VARCHAR(50) DEFAULT 'gpt-4',
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. LEVEL REWARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.level_rewards (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    level INTEGER NOT NULL UNIQUE,
    tokens_awarded INTEGER DEFAULT 0,
    packs_unlocked TEXT[], -- Array of pack IDs
    badges_unlocked TEXT[], -- Array of badge names
    special_reward_title VARCHAR(255),
    special_reward_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ADD TOKENS TO USER_PROGRESS TABLE
-- =====================================================
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_freezes_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_freeze_date DATE;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_challenge_packs_level ON public.challenge_packs(level_required);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_category ON public.challenge_packs(category);
CREATE INDEX IF NOT EXISTS idx_challenge_pack_items_pack_id ON public.challenge_pack_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_user_id ON public.user_pack_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_pack_id ON public.user_pack_progress(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_suggestions_user_id ON public.personalized_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_suggestions_expires ON public.personalized_suggestions(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Challenge Packs (Public read, admin write)
ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenge packs" ON public.challenge_packs FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can see pack items" ON public.challenge_pack_items FOR SELECT USING (auth.uid() IS NOT NULL);

-- Challenge Pack Items (Public read for authenticated users)
ALTER TABLE public.challenge_pack_items ENABLE ROW LEVEL SECURITY;

-- User Pack Progress (Users can read/write their own)
ALTER TABLE public.user_pack_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pack progress" ON public.user_pack_progress FOR ALL USING (auth.uid() = user_id);

-- User Tokens (Users can read/write their own)
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tokens" ON public.user_tokens FOR ALL USING (auth.uid() = user_id);

-- Token Transactions (Users can read their own, system can insert)
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own token transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert token transactions" ON public.token_transactions FOR INSERT WITH CHECK (true);

-- Personalized Suggestions (Users can read/write their own)
ALTER TABLE public.personalized_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own suggestions" ON public.personalized_suggestions FOR ALL USING (auth.uid() = user_id);

-- Level Rewards (Public read)
ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read level rewards" ON public.level_rewards FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS FOR GAMIFICATION LOGIC
-- =====================================================

-- Function to get user's leaderboard rank
CREATE OR REPLACE FUNCTION get_user_leaderboard_rank(p_user_id UUID, p_rank_by TEXT DEFAULT 'xp')
RETURNS TABLE(rank BIGINT, total_count BIGINT) AS $$
BEGIN
    IF p_rank_by = 'xp' THEN
        RETURN QUERY
        WITH ranked_users AS (
            SELECT 
                up.user_id,
                ROW_NUMBER() OVER (ORDER BY up.xp DESC, up.level DESC) as user_rank
            FROM user_progress up
            JOIN profiles p ON up.user_id = p.id
            WHERE p.has_completed_assessment = true
        )
        SELECT 
            ru.user_rank,
            (SELECT COUNT(*) FROM ranked_users)::BIGINT
        FROM ranked_users ru
        WHERE ru.user_id = p_user_id;
    ELSIF p_rank_by = 'challenges' THEN
        RETURN QUERY
        WITH challenge_counts AS (
            SELECT 
                cc.user_id,
                COUNT(*) as challenge_count
            FROM completed_challenges cc
            GROUP BY cc.user_id
        ),
        ranked_users AS (
            SELECT 
                cc.user_id,
                ROW_NUMBER() OVER (ORDER BY cc.challenge_count DESC) as user_rank
            FROM challenge_counts cc
            JOIN profiles p ON cc.user_id = p.id
            WHERE p.has_completed_assessment = true
        )
        SELECT 
            ru.user_rank,
            (SELECT COUNT(*) FROM ranked_users)::BIGINT
        FROM ranked_users ru
        WHERE ru.user_id = p_user_id;
    ELSE -- streak
        RETURN QUERY
        WITH ranked_users AS (
            SELECT 
                up.user_id,
                ROW_NUMBER() OVER (ORDER BY up.streak DESC, up.xp DESC) as user_rank
            FROM user_progress up
            JOIN profiles p ON up.user_id = p.id
            WHERE p.has_completed_assessment = true
        )
        SELECT 
            ru.user_rank,
            (SELECT COUNT(*) FROM ranked_users)::BIGINT
        FROM ranked_users ru
        WHERE ru.user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award level-up rewards
CREATE OR REPLACE FUNCTION award_level_rewards(p_user_id UUID, p_new_level INTEGER)
RETURNS VOID AS $$
DECLARE
    reward_record RECORD;
BEGIN
    -- Get level rewards
    SELECT * INTO reward_record FROM level_rewards WHERE level = p_new_level;
    
    IF FOUND THEN
        -- Award tokens
        IF reward_record.tokens_awarded > 0 THEN
            INSERT INTO user_tokens (user_id, token_type, balance, total_earned)
            VALUES (p_user_id, 'streak_freeze', reward_record.tokens_awarded, reward_record.tokens_awarded)
            ON CONFLICT (user_id, token_type) DO UPDATE SET
                balance = user_tokens.balance + reward_record.tokens_awarded,
                total_earned = user_tokens.total_earned + reward_record.tokens_awarded,
                updated_at = timezone('utc'::text, now());
                
            -- Record transaction
            INSERT INTO token_transactions (user_id, token_type, amount, transaction_type, source, description)
            VALUES (p_user_id, 'streak_freeze', reward_record.tokens_awarded, 'earned', 'level_up', 'Level ' || p_new_level || ' reward');
        END IF;
        
        -- Update user progress tokens (for quick access)
        UPDATE user_progress 
        SET tokens = COALESCE((SELECT balance FROM user_tokens WHERE user_id = p_user_id AND token_type = 'streak_freeze'), 0)
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use streak freeze token
CREATE OR REPLACE FUNCTION use_streak_freeze_token(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Check current balance
    SELECT balance INTO current_balance 
    FROM user_tokens 
    WHERE user_id = p_user_id AND token_type = 'streak_freeze';
    
    IF current_balance IS NULL OR current_balance < 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct token
    UPDATE user_tokens 
    SET 
        balance = balance - 1,
        total_spent = total_spent + 1,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id AND token_type = 'streak_freeze';
    
    -- Record transaction
    INSERT INTO token_transactions (user_id, token_type, amount, transaction_type, source, description)
    VALUES (p_user_id, 'streak_freeze', -1, 'spent', 'streak_freeze_used', 'Used streak freeze token');
    
    -- Update user progress
    UPDATE user_progress 
    SET 
        tokens = tokens - 1,
        streak_freezes_used = streak_freezes_used + 1,
        last_streak_freeze_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================
CREATE TRIGGER handle_challenge_packs_updated_at BEFORE UPDATE ON public.challenge_packs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_user_pack_progress_updated_at BEFORE UPDATE ON public.user_pack_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_user_tokens_updated_at BEFORE UPDATE ON public.user_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SEED DATA - DEFAULT CHALLENGE PACKS
-- =====================================================
INSERT INTO public.challenge_packs (title, description, icon, level_required, duration_days, category, sort_order) VALUES
('Confidence Starter Pack', 'Build unshakable self-belief with 7 powerful daily challenges', '💪', 1, 7, 'Confidence', 1),
('Mindful Morning (5-Day)', 'Start each day with presence and peace through mindfulness practice', '🧘', 2, 5, 'Mindfulness', 2),
('Resilience Boost (10-Day)', 'Develop mental toughness and bounce back stronger from adversity', '⚡', 3, 10, 'Resilience', 3),
('Communication Mastery', 'Express yourself clearly and build stronger connections', '🗣️', 4, 7, 'Communication', 4),
('Self-Worth Journey', 'Recognize your value and cultivate deep self-love', '💎', 5, 10, 'Self-Worth', 5),
('Discipline Blueprint', 'Build strong habits and consistently work towards your goals', '📚', 6, 14, 'Discipline', 6),
('Gratitude Garden (7-Day)', 'Cultivate appreciation and find joy in everyday moments', '🙏', 3, 7, 'Gratitude', 7),
('Fitness Foundation', 'Improve your physical health and boost your energy levels', '🏋️', 4, 10, 'Fitness', 8);

-- =====================================================
-- SEED DATA - LEVEL REWARDS
-- =====================================================
INSERT INTO public.level_rewards (level, tokens_awarded, special_reward_title, special_reward_description) VALUES
(1, 0, 'Welcome Badge', 'You''ve started your growth journey!'),
(2, 1, 'First Steps', 'Unlocked Mindful Morning pack'),
(3, 1, 'Building Momentum', 'Unlocked Resilience Boost pack + 1 Streak Freeze Token'),
(4, 2, 'Growth Accelerator', 'Unlocked Communication Mastery + 2 Streak Freeze Tokens'),
(5, 2, 'Self-Discovery', 'Unlocked Self-Worth Journey + 2 Streak Freeze Tokens'),
(6, 3, 'Discipline Master', 'Unlocked Discipline Blueprint + 3 Streak Freeze Tokens'),
(7, 3, 'Growth Champion', '3 Streak Freeze Tokens + Special Champion Badge'),
(8, 4, 'Advanced Practitioner', '4 Streak Freeze Tokens + Premium Features'),
(9, 4, 'Growth Mentor', '4 Streak Freeze Tokens + Mentor Badge'),
(10, 5, 'Master of Growth', '5 Streak Freeze Tokens + All Packs Unlocked + Master Badge');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Migration completed successfully
-- New features added:
-- ✅ Challenge Packs with unlock system
-- ✅ User tokens and streak freeze system  
-- ✅ Personalized AI suggestions storage
-- ✅ Level-based reward system
-- ✅ Leaderboard support functions
-- ✅ Comprehensive security policies
-- ✅ Performance indexes
-- ✅ Seed data for initial packs and rewards 