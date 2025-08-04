-- Enhanced Challenge Packs Migration
-- Add challenges JSON array and individual challenge completion tracking

-- Add challenges column to challenge_packs table
ALTER TABLE public.challenge_packs 
ADD COLUMN IF NOT EXISTS challenges JSONB DEFAULT '[]'::jsonb;

-- Create table to track individual challenge completions within packs
CREATE TABLE IF NOT EXISTS public.user_pack_challenge_progress (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    challenge_index INTEGER NOT NULL, -- Index of challenge in the pack's challenges array
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, pack_id, challenge_index)
);

-- Update existing packs with challenges JSON array
UPDATE public.challenge_packs SET challenges = '[
    "Write down 3 things you''re proud of accomplishing this week",
    "Stand in front of a mirror and give yourself a genuine compliment",
    "Take on a small challenge that pushes you out of your comfort zone",
    "Share an opinion or idea confidently in a conversation",
    "Dress in a way that makes you feel powerful and confident",
    "Practice good posture for an entire day - notice how it affects your mood",
    "End the day by celebrating one small win, no matter how minor"
]'::jsonb
WHERE title = 'Confidence Starter Pack';

UPDATE public.challenge_packs SET challenges = '[
    "Start your morning with 5 minutes of deep breathing",
    "Practice mindful eating - focus on every bite of your breakfast",
    "Take a mindful walk, noticing 5 things you haven''t observed before",
    "Do a 10-minute meditation using a guided app or video",
    "Practice gratitude by writing down 3 specific things you''re thankful for"
]'::jsonb
WHERE title = 'Mindful Morning (5-Day)';

UPDATE public.challenge_packs SET challenges = '[
    "When faced with a setback today, ask: ''What can this teach me?''",
    "Practice the 4-7-8 breathing technique when you feel stressed",
    "Write about a past challenge you overcame and what it taught you",
    "Do something physically challenging (workout, cold shower, etc.)",
    "Reach out to someone who has faced similar challenges for advice",
    "Create a ''bounce-back'' playlist of songs that energize you",
    "Practice positive self-talk - catch and reframe negative thoughts",
    "Set a small, achievable goal and complete it today",
    "Help someone else with their challenge - build connection",
    "Reflect on your growth: write about how you''ve become more resilient"
]'::jsonb
WHERE title = 'Resilience Boost (10-Day)';

UPDATE public.challenge_packs SET challenges = '[
    "Practice active listening - fully focus on someone without interrupting",
    "Give someone a genuine compliment about their character",
    "Express a difficult emotion or need clearly to someone close to you",
    "Ask thoughtful questions to learn more about someone''s perspective",
    "Practice speaking with confident body language and eye contact",
    "Have a meaningful conversation with someone you don''t know well",
    "Express appreciation to someone who has helped or supported you"
]'::jsonb
WHERE title = 'Communication Mastery';

UPDATE public.challenge_packs SET challenges = '[
    "List 10 unique qualities that make you special",
    "Do something kind for yourself without feeling guilty",
    "Set a healthy boundary with someone in your life",
    "Forgive yourself for a past mistake - write yourself a letter",
    "Engage in an activity that brings you pure joy",
    "Practice saying ''no'' to something that doesn''t serve you",
    "Create a vision board of your dreams and goals",
    "Spend time doing something you''re naturally good at",
    "Write a letter to your future self expressing belief in your potential",
    "Celebrate your progress - treat yourself to something special"
]'::jsonb
WHERE title = 'Self-Worth Journey';

UPDATE public.challenge_packs SET challenges = '[
    "Create a morning routine and stick to it for the entire day",
    "Identify your biggest time-waster and avoid it completely today",
    "Complete your most important task first thing in the morning",
    "Practice the 2-minute rule: do anything that takes less than 2 minutes immediately",
    "Plan tomorrow''s priorities before going to bed tonight",
    "Remove one distraction from your workspace or phone",
    "Practice delayed gratification - resist one temptation today",
    "Create a weekly review system to track your progress",
    "Build one new micro-habit that takes less than 1 minute",
    "Set up accountability - tell someone about a goal you''re working on",
    "Practice saying ''no'' to non-essential requests",
    "Create a reward system for completing important tasks",
    "Organize one area of your life (desk, files, schedule)",
    "Reflect on your discipline journey - what has and hasn''t worked?"
]'::jsonb
WHERE title = 'Discipline Blueprint';

UPDATE public.challenge_packs SET challenges = '[
    "Write down 5 specific things you''re grateful for right now",
    "Thank someone who has positively impacted your life",
    "Notice and appreciate something beautiful in your environment",
    "Appreciate a challenge in your life and what it''s teaching you",
    "Express gratitude for your body and what it does for you",
    "Create a gratitude jar - add one note about today",
    "End the day by sharing your gratitude with someone you love"
]'::jsonb
WHERE title = 'Gratitude Garden (7-Day)';

UPDATE public.challenge_packs SET challenges = '[
    "Do 20 minutes of any physical activity you enjoy",
    "Drink 8 glasses of water throughout the day",
    "Take the stairs instead of the elevator whenever possible",
    "Eat a nutritious meal with plenty of vegetables",
    "Get 7-8 hours of quality sleep tonight",
    "Do 10 minutes of stretching or yoga",
    "Take a walk in nature or fresh air",
    "Try a new healthy recipe or food",
    "Do strength exercises: push-ups, squats, or planks",
    "Create a sustainable fitness routine for the future"
]'::jsonb
WHERE title = 'Fitness Foundation';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_pack_challenge_progress_user_pack ON public.user_pack_challenge_progress(user_id, pack_id);
CREATE INDEX IF NOT EXISTS idx_challenge_packs_challenges ON public.challenge_packs USING GIN (challenges);

-- Add RLS policies
ALTER TABLE public.user_pack_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pack challenge progress" 
ON public.user_pack_challenge_progress FOR ALL USING (auth.uid() = user_id);

-- Function to get pack completion percentage
CREATE OR REPLACE FUNCTION get_pack_completion_percentage(p_user_id UUID, p_pack_id UUID)
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
    p_pack_id UUID,
    p_challenge_index INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    completion_percentage INTEGER;
    total_challenges INTEGER;
BEGIN
    -- Mark challenge as completed
    INSERT INTO user_pack_challenge_progress (user_id, pack_id, challenge_index)
    VALUES (p_user_id, p_pack_id, p_challenge_index)
    ON CONFLICT (user_id, pack_id, challenge_index) DO NOTHING;
    
    -- Get updated completion percentage
    SELECT get_pack_completion_percentage(p_user_id, p_pack_id) INTO completion_percentage;
    
    -- Update user_pack_progress
    UPDATE user_pack_progress 
    SET 
        completion_percentage = completion_percentage,
        is_completed = (completion_percentage = 100),
        completed_at = CASE WHEN completion_percentage = 100 THEN timezone('utc'::text, now()) ELSE completed_at END,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id AND pack_id = p_pack_id;
    
    -- If pack is completed, award XP and tokens
    IF completion_percentage = 100 THEN
        -- Award 50 XP for pack completion
        UPDATE user_progress 
        SET xp = xp + 50
        WHERE user_id = p_user_id;
        
        -- Award 2 tokens for pack completion
        PERFORM award_tokens(p_user_id, 2, 'pack_completion', 'Challenge pack completed');
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pack_completion_percentage(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_pack_challenge(UUID, UUID, INTEGER) TO authenticated; 