-- FIX COMPLETED_CHALLENGES TABLE (CORRECTED)
-- This script fixes the completed_challenges table based on the actual database schema
-- Table has: id (UUID), challenge_id (INT4), user_id, etc.

-- 1. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user_id ON public.completed_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_completed_at ON public.completed_challenges(completed_at);

-- 2. Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can insert their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can update their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can delete their own completed challenges" ON public.completed_challenges;

-- Create new policies
CREATE POLICY "Users can view their own completed challenges" ON public.completed_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges" ON public.completed_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed challenges" ON public.completed_challenges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed challenges" ON public.completed_challenges
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS trigger_completed_challenges_updated_at ON public.completed_challenges;
CREATE TRIGGER trigger_completed_challenges_updated_at
    BEFORE UPDATE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Create function to update user_progress when challenge is completed
CREATE OR REPLACE FUNCTION public.update_user_progress_on_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_challenges_completed in user_progress
    UPDATE public.user_progress 
    SET 
        total_challenges_completed = total_challenges_completed + 1,
        xp = xp + COALESCE(NEW.xp_earned, 0),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Update level if XP threshold is met
    UPDATE public.user_progress 
    SET level = GREATEST(1, FLOOR(xp / 100) + 1)
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically update user_progress
DROP TRIGGER IF EXISTS trigger_update_user_progress_on_challenge_completion ON public.completed_challenges;
CREATE TRIGGER trigger_update_user_progress_on_challenge_completion
    AFTER INSERT ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_progress_on_challenge_completion();

-- 8. Create function to get user's completed challenges
CREATE OR REPLACE FUNCTION public.get_user_completed_challenges(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    challenge_id INTEGER,
    challenge_title TEXT,
    challenge_description TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    reflection TEXT,
    xp_earned INTEGER,
    is_extra_challenge BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.challenge_id,
        cc.challenge_title,
        cc.challenge_description,
        cc.completed_at,
        cc.reflection,
        cc.xp_earned,
        cc.is_extra_challenge
    FROM public.completed_challenges cc
    WHERE cc.user_id = p_user_id
    ORDER BY cc.completed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to check if user has completed a specific challenge today
CREATE OR REPLACE FUNCTION public.has_user_completed_challenge_today(p_user_id UUID, p_challenge_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    completed_today BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.completed_challenges 
        WHERE user_id = p_user_id 
        AND challenge_id = p_challenge_id 
        AND DATE(completed_at) = CURRENT_DATE
    ) INTO completed_today;
    
    RETURN completed_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.completed_challenges TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_completed_challenges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_completed_challenge_today(UUID, INTEGER) TO authenticated;

-- 11. Verification query
SELECT 'Completed challenges table fixed successfully!' as result; 