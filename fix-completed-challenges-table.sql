-- FIX COMPLETED_CHALLENGES TABLE
-- This script fixes the completed_challenges table based on the actual database schema

-- 1. First, let's check if the completed_challenges table exists and what columns it has
-- (This is just for verification - the table should already exist)

-- 2. Add the pack_id foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_completed_challenges_pack_id' 
        AND table_name = 'completed_challenges'
    ) THEN
        -- Add foreign key constraint to pack_id column
        ALTER TABLE public.completed_challenges 
        ADD CONSTRAINT fk_completed_challenges_pack_id 
        FOREIGN KEY (pack_id) REFERENCES public.challenge_packs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user_id ON public.completed_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_completed_at ON public.completed_challenges(completed_at);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_pack_id ON public.completed_challenges(pack_id);

-- 4. Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (drop existing ones first to avoid conflicts)
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

-- 6. Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS trigger_completed_challenges_updated_at ON public.completed_challenges;
CREATE TRIGGER trigger_completed_challenges_updated_at
    BEFORE UPDATE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Create function to update user_progress when challenge is completed
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

-- 9. Create trigger to automatically update user_progress
DROP TRIGGER IF EXISTS trigger_update_user_progress_on_challenge_completion ON public.completed_challenges;
CREATE TRIGGER trigger_update_user_progress_on_challenge_completion
    AFTER INSERT ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_progress_on_challenge_completion();

-- 10. Create function to get user's completed challenges
CREATE OR REPLACE FUNCTION public.get_user_completed_challenges(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    challenge_id TEXT,
    challenge_title TEXT,
    challenge_description TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    reflection TEXT,
    xp_earned INTEGER,
    pack_id UUID,
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
        cc.pack_id,
        cc.is_extra_challenge
    FROM public.completed_challenges cc
    WHERE cc.user_id = p_user_id
    ORDER BY cc.completed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to check if user has completed a specific challenge today
CREATE OR REPLACE FUNCTION public.has_user_completed_challenge_today(p_user_id UUID, p_challenge_id TEXT)
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

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.completed_challenges TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_completed_challenges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_completed_challenge_today(UUID, TEXT) TO authenticated;

-- 13. Verification query
SELECT 'Completed challenges table fixed successfully!' as result; 