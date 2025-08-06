-- =====================================================
-- COMPLETE FIX FOR CHALLENGE_PACKS TABLE
-- =====================================================
-- This script fixes the challenge_packs table schema and adds sample data

-- 1. DROP AND RECREATE CHALLENGE_PACKS TABLE WITH CORRECT SCHEMA
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.challenge_packs CASCADE;

-- Create challenge_packs table with correct schema
CREATE TABLE public.challenge_packs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) DEFAULT '🎯',
    level_required INTEGER DEFAULT 1,
    pack_type VARCHAR(50) DEFAULT 'standard',
    duration_days INTEGER DEFAULT 7,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    challenges JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_challenge_packs_level_required ON public.challenge_packs(level_required);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_category ON public.challenge_packs(category);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_icon ON public.challenge_packs(icon);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_pack_type ON public.challenge_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_is_active ON public.challenge_packs(is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_sort_order ON public.challenge_packs(sort_order);

-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read challenge packs" ON public.challenge_packs;
DROP POLICY IF EXISTS "Challenge packs are viewable by everyone" ON public.challenge_packs;

-- Create new policy
CREATE POLICY "Anyone can read challenge packs" ON public.challenge_packs
FOR SELECT USING (true);

-- 4. INSERT SAMPLE CHALLENGE PACKS
-- =====================================================

INSERT INTO public.challenge_packs (
    title, 
    description, 
    icon, 
    level_required, 
    pack_type, 
    duration_days, 
    category, 
    is_active, 
    sort_order, 
    challenges
) VALUES 
(
    'Confidence Sprint',
    'Build your confidence with daily challenges designed to push you out of your comfort zone.',
    '🚀',
    1,
    'standard',
    7,
    'Confidence',
    true,
    1,
    '[
        "Start a conversation with someone new today",
        "Share your opinion in a group discussion",
        "Try something you''ve been afraid to do",
        "Ask for help when you need it",
        "Celebrate a small win with others",
        "Speak up in a meeting or class",
        "Take a risk and see what happens"
    ]'::jsonb
),
(
    'Mindful Morning',
    'Begin each day with intention and mindfulness to set a positive tone.',
    '🌅',
    1,
    'standard',
    7,
    'Mindfulness',
    true,
    2,
    '[
        "Spend 5 minutes in quiet reflection",
        "Practice deep breathing exercises",
        "Notice three things you''re grateful for",
        "Take a mindful walk without distractions",
        "Set one intention for your day",
        "Practice mindful eating for one meal",
        "End your day with gratitude"
    ]'::jsonb
),
(
    'Self-Control Boost',
    'Strengthen your willpower and self-discipline through daily practice.',
    '💪',
    1,
    'standard',
    7,
    'Self-Control',
    true,
    3,
    '[
        "Delay gratification for something you want",
        "Complete a task before checking social media",
        "Practice saying no to something tempting",
        "Stick to a healthy habit today",
        "Avoid complaining for the entire day",
        "Finish what you start without interruption",
        "Choose the harder option when given a choice"
    ]'::jsonb
),
(
    'Resilience Builder',
    'Develop mental toughness and bounce back from setbacks more quickly.',
    '🛡️',
    1,
    'standard',
    7,
    'Resilience',
    true,
    4,
    '[
        "Face a fear head-on today",
        "Learn from a mistake without dwelling",
        "Adapt to an unexpected change",
        "Find the silver lining in a challenge",
        "Ask for feedback and use it constructively",
        "Practice self-compassion when you struggle",
        "Celebrate your ability to overcome obstacles"
    ]'::jsonb
),
(
    'Gratitude Growth',
    'Cultivate a grateful mindset and appreciate the good in your life.',
    '🙏',
    1,
    'standard',
    7,
    'Gratitude',
    true,
    5,
    '[
        "Write down three things you''re thankful for",
        "Express appreciation to someone who helped you",
        "Notice the beauty in something ordinary",
        "Thank someone who doesn''t get enough credit",
        "Reflect on a challenge that made you stronger",
        "Appreciate your body and what it can do",
        "Find gratitude in a difficult situation"
    ]'::jsonb
);

-- 5. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_challenge_packs_updated_at ON public.challenge_packs;
CREATE TRIGGER handle_challenge_packs_updated_at 
    BEFORE UPDATE ON public.challenge_packs 
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. VERIFY THE FIX
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'challenge_packs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data
SELECT 
    id,
    title,
    description,
    category,
    icon,
    pack_type,
    level_required,
    duration_days,
    is_active,
    sort_order
FROM public.challenge_packs
ORDER BY sort_order;

-- Count total records
SELECT COUNT(*) as total_challenge_packs FROM public.challenge_packs;

SELECT 'Challenge packs table fixed and populated successfully!' as result; 