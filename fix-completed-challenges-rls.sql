-- FIX COMPLETED_CHALLENGES RLS POLICIES
-- This script fixes the Row Level Security policies for the completed_challenges table

-- 1. Enable Row Level Security
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can insert their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can update their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Users can delete their own completed challenges" ON public.completed_challenges;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.completed_challenges;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.completed_challenges;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.completed_challenges;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.completed_challenges;

-- 3. Create new RLS policies
CREATE POLICY "Users can view their own completed challenges" ON public.completed_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges" ON public.completed_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed challenges" ON public.completed_challenges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed challenges" ON public.completed_challenges
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.completed_challenges TO authenticated;

-- 5. Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS trigger_completed_challenges_updated_at ON public.completed_challenges;
CREATE TRIGGER trigger_completed_challenges_updated_at
    BEFORE UPDATE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Create function to update user_progress when challenge is completed
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

-- 8. Create trigger to automatically update user_progress
DROP TRIGGER IF EXISTS trigger_update_user_progress_on_challenge_completion ON public.completed_challenges;
CREATE TRIGGER trigger_update_user_progress_on_challenge_completion
    AFTER INSERT ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_progress_on_challenge_completion();

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user_id ON public.completed_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_completed_at ON public.completed_challenges(completed_at);

-- 10. Test the policies by showing current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'completed_challenges';

-- 11. Verification query
SELECT 'Completed challenges RLS policies fixed successfully!' as result; 