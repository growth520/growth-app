-- Fix Challenge Packs Structure to Match User's Implementation
-- This aligns the database with the simplified structure created by the user

-- Drop existing complex table if it exists and create the user's version
DROP TABLE IF EXISTS public.challenge_packs CASCADE;

CREATE TABLE IF NOT EXISTS public.challenge_packs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    level_required INT DEFAULT 1,
    challenges JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add user_pack_progress table to track overall pack progress
CREATE TABLE IF NOT EXISTS public.user_pack_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id BIGINT REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0,
    current_day INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
);

-- Add user_pack_challenge_progress table to track individual challenges
CREATE TABLE IF NOT EXISTS public.user_pack_challenge_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id BIGINT REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    challenge_index INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, pack_id, challenge_index)
);

-- Insert the user's challenge packs data
INSERT INTO challenge_packs (title, description, level_required, challenges) VALUES
('Confidence Sprint', 'Build courage and self-trust through daily steps.', 1,
'["Smile at 3 strangers today","Speak up once in a group conversation","Give someone a genuine compliment","Write down 3 strengths you appreciate in yourself","Share your opinion on a topic you care about","Start a short conversation with someone new","Try one thing today that feels slightly outside your comfort zone"]'),

('Mindful Morning', 'Start your day with intention and awareness.', 2,
'["Spend 5 minutes in silence before using your phone","Eat breakfast mindfully without distractions","Write down 3 intentions for the day","Take 3 deep breaths before starting work","Reflect on one thing you''re grateful for this morning"]'),

('Self-Control Boost', 'Strengthen your ability to pause before reacting.', 2,
'["Before eating, pause for 10 seconds and check if you''re truly hungry","Wait 5 extra minutes before checking your phone when you feel the urge","Say no to one unnecessary indulgence today","Practice slow eating for one meal today","When you feel annoyed, take 3 deep breaths before responding","Choose water instead of a sugary drink","Avoid complaining for one full day"]'),

('Resilience Builder', 'Learn to stay steady through challenges.', 3,
'["Write down one past challenge you overcame and what you learned","When something goes wrong, write 3 positive takeaways","Try an uncomfortable task for 10 minutes","Do a physical activity (walk/run) when stressed instead of venting","Say to yourself: This moment will pass during stress","Practice patience when waiting (no phone scrolling)","At the end of the day, note one thing you handled well under pressure"]'),

('Gratitude Growth', 'Shift your focus to what matters most.', 3,
'["Write 3 things you''re grateful for","Thank someone for something specific they did","Notice one positive detail you usually ignore","Send an appreciation message to a friend","Before bed, recall 3 good things that happened today"]'),

('Purpose Path', 'Clarify your why and live with meaning.', 4,
'["Write down one thing that gives you meaning","Spend 15 minutes on an activity that aligns with your values","Remove one distraction and use the time for something purposeful","Ask yourself: Why am I doing this? before your next big task","Do one small act of kindness without expecting anything","Read a quote or short text that inspires you","Reflect on: What would make today meaningful?"]'),

('Communication Upgrade', 'Build better connections through words.', 4,
'["Ask someone a meaningful question and listen fully","Avoid interrupting in a conversation for the whole day","Respond to someone thoughtfully instead of quickly","Practice active listening with one person","Send a kind message to someone you haven''t spoken to in a while"]'),

('Humility & Perspective', 'See yourself honestly and value others.', 5,
'["Acknowledge one mistake today without excuses","Give credit to someone publicly for something they did well","Ask for advice instead of assuming you know best","Spend 10 minutes thinking about something bigger than yourself","Compliment someone on a quality you admire in them"]'),

('Energy & Movement', 'Boost your body and mind with movement.', 5,
'["Walk for 10 minutes today","Take the stairs instead of the elevator","Stretch for 5 minutes after waking up","Do 10 squats or push-ups","Dance to your favorite song for 3 minutes"]'),

('Digital Detox', 'Reclaim your time and attention.', 6,
'["Turn off notifications for 1 hour","No phone for the first 30 minutes after waking","Spend 1 hour without social media","Remove one distracting app for the day","Do one activity today without your phone nearby"]');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_user_id ON public.user_pack_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_pack_id ON public.user_pack_progress(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_challenge_progress_user_pack ON public.user_pack_challenge_progress(user_id, pack_id);

-- Add RLS policies
ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read challenge packs" ON public.challenge_packs FOR SELECT USING (true);

ALTER TABLE public.user_pack_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own pack progress" ON public.user_pack_progress;
CREATE POLICY "Users can manage their own pack progress" ON public.user_pack_progress FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.user_pack_challenge_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own challenge progress" ON public.user_pack_challenge_progress;
CREATE POLICY "Users can manage their own challenge progress" ON public.user_pack_challenge_progress FOR ALL USING (auth.uid() = user_id);

-- Function to get pack completion percentage
CREATE OR REPLACE FUNCTION get_pack_completion_percentage(p_user_id UUID, p_pack_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    total_challenges INTEGER;
    completed_challenges INTEGER;
BEGIN
    -- Get total challenges in pack
    SELECT jsonb_array_length(challenges) INTO total_challenges
    FROM challenge_packs 
    WHERE id = p_pack_id;
    
    IF total_challenges IS NULL OR total_challenges = 0 THEN
        RETURN 0;
    END IF;
    
    -- Get completed challenges count
    SELECT COUNT(*) INTO completed_challenges
    FROM user_pack_challenge_progress
    WHERE user_id = p_user_id AND pack_id = p_pack_id;
    
    -- Return percentage
    RETURN ROUND((completed_challenges::FLOAT / total_challenges::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a challenge in a pack
CREATE OR REPLACE FUNCTION complete_pack_challenge(
    p_user_id UUID,
    p_pack_id BIGINT,
    p_challenge_index INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    completion_percentage INTEGER;
BEGIN
    -- Mark challenge as completed
    INSERT INTO user_pack_challenge_progress (user_id, pack_id, challenge_index)
    VALUES (p_user_id, p_pack_id, p_challenge_index)
    ON CONFLICT (user_id, pack_id, challenge_index) DO NOTHING;
    
    -- Get updated completion percentage
    SELECT get_pack_completion_percentage(p_user_id, p_pack_id) INTO completion_percentage;
    
    -- Update or insert user_pack_progress
    INSERT INTO user_pack_progress (user_id, pack_id, completion_percentage, is_completed)
    VALUES (p_user_id, p_pack_id, completion_percentage, (completion_percentage = 100))
    ON CONFLICT (user_id, pack_id)
    DO UPDATE SET 
        completion_percentage = EXCLUDED.completion_percentage,
        is_completed = (EXCLUDED.completion_percentage = 100),
        completed_at = CASE WHEN EXCLUDED.completion_percentage = 100 THEN NOW() ELSE user_pack_progress.completed_at END,
        updated_at = NOW();
    
    -- If pack is completed, award XP and tokens
    IF completion_percentage = 100 THEN
        -- Award 50 XP for pack completion
        UPDATE user_progress 
        SET xp = xp + 50
        WHERE user_id = p_user_id;
        
        -- Award 2 tokens for pack completion (if function exists)
        BEGIN
            PERFORM award_tokens(p_user_id, 2, 'pack_completion', 'Challenge pack completed');
        EXCEPTION 
            WHEN undefined_function THEN
                -- Ignore if award_tokens function doesn't exist
                NULL;
        END;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pack_completion_percentage(UUID, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_pack_challenge(UUID, BIGINT, INTEGER) TO authenticated; 