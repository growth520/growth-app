-- =====================================================
-- CREATE CHALLENGES TABLE
-- =====================================================
-- This migration creates the challenges table for the user's 11,000 challenges

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id INTEGER PRIMARY KEY,
    category VARCHAR(100),
    challenge_id_text VARCHAR(50),
    title TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Anyone can read challenges" ON public.challenges;
CREATE POLICY "Anyone can read challenges" ON public.challenges FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON public.challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_id_text ON public.challenges(challenge_id_text);

-- Insert some sample challenges to test
INSERT INTO challenges (id, category, challenge_id_text, title, description) VALUES
(1, 'Confidence', 'CON-001', 'Make eye contact with someone for at least 3 seconds.', 'Make eye contact with someone for at least 3 seconds.'),
(2, 'Confidence', 'CON-002', 'Start a conversation with a stranger.', 'Start a conversation with a stranger.'),
(3, 'Confidence', 'CON-003', 'Give a genuine compliment to someone today.', 'Give a genuine compliment to someone today.'),
(4, 'Confidence', 'CON-004', 'Raise your hand or speak once in a group setting.', 'Raise your hand or speak once in a group setting.'),
(5, 'Confidence', 'CON-005', 'Record yourself saying something positive about yourself.', 'Record yourself saying something positive about yourself.')
ON CONFLICT (id) DO NOTHING;
