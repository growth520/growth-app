-- =====================================================
-- FIX LEVEL_REWARDS TABLE
-- =====================================================

-- Create level_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.level_rewards (
    id BIGSERIAL PRIMARY KEY,
    level INTEGER NOT NULL UNIQUE,
    tokens_awarded INTEGER DEFAULT 0,
    special_reward_title TEXT,
    special_reward_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default level rewards if table is empty
INSERT INTO public.level_rewards (level, tokens_awarded, special_reward_title, special_reward_description) 
VALUES 
    (1, 5, 'First Steps', 'You''ve taken your first step on your growth journey!'),
    (2, 10, 'Building Momentum', 'Your consistency is building momentum!'),
    (3, 15, 'Growing Stronger', 'You''re developing real strength and resilience!'),
    (4, 20, 'Steady Progress', 'Your steady progress is inspiring!'),
    (5, 25, 'Halfway There', 'You''ve reached a significant milestone!'),
    (6, 30, 'Advanced Growth', 'You''re becoming a growth expert!'),
    (7, 35, 'Mastery Begins', 'True mastery is within your reach!'),
    (8, 40, 'Elite Status', 'You''re among the elite growth practitioners!'),
    (9, 45, 'Near Perfection', 'You''re approaching perfection in your growth!'),
    (10, 50, 'Growth Master', 'You''ve achieved mastery in personal growth!')
ON CONFLICT (level) DO NOTHING;

-- Enable RLS
ALTER TABLE public.level_rewards ENABLE ROW LEVEL SECURITY;

-- Create policy for reading level rewards
DROP POLICY IF EXISTS "Anyone can read level rewards" ON public.level_rewards;
CREATE POLICY "Anyone can read level rewards" ON public.level_rewards FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_level_rewards_level ON public.level_rewards(level);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Level rewards table fixed successfully:
-- ✅ Created level_rewards table if missing
-- ✅ Inserted default level rewards (1-10)
-- ✅ Enabled RLS with proper policies
-- ✅ Added performance indexes