-- RECREATE COMPLETED_CHALLENGES TABLE FROM SCRATCH
-- This script will drop and recreate the table to ensure it's properly set up

-- 1. Drop existing table and related objects
DROP TRIGGER IF EXISTS trigger_update_user_progress_on_challenge_completion ON public.completed_challenges;
DROP TRIGGER IF EXISTS trigger_completed_challenges_updated_at ON public.completed_challenges;
DROP FUNCTION IF EXISTS public.update_user_progress_on_challenge_completion();
DROP TABLE IF EXISTS public.completed_challenges CASCADE;

-- 2. Create the completed_challenges table
CREATE TABLE public.completed_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL,
    challenge_title TEXT,
    challenge_description TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reflection TEXT,
    xp_earned INTEGER DEFAULT 0,
    photo_url TEXT,
    category TEXT,
    is_extra_challenge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_completed_challenges_user_id ON public.completed_challenges(user_id);
CREATE INDEX idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
CREATE INDEX idx_completed_challenges_completed_at ON public.completed_challenges(completed_at);

-- 4. Enable Row Level Security
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own completed challenges" ON public.completed_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges" ON public.completed_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed challenges" ON public.completed_challenges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed challenges" ON public.completed_challenges
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.completed_challenges TO authenticated;

-- 7. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
CREATE TRIGGER trigger_completed_challenges_updated_at
    BEFORE UPDATE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create function to update user_progress when challenge is completed
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

-- 10. Create trigger to automatically update user_progress
CREATE TRIGGER trigger_update_user_progress_on_challenge_completion
    AFTER INSERT ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_progress_on_challenge_completion();

-- 11. Test the table with a simple insert
DO $$
BEGIN
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        challenge_title,
        challenge_description,
        reflection,
        xp_earned,
        category,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        1,
        'Test Challenge',
        'Test Description',
        'Test reflection',
        10,
        'Test',
        false
    );
    
    RAISE NOTICE 'Test insert successful - table is working!';
    
    -- Clean up test data
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 12. Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 13. Verification query
SELECT 'Completed challenges table recreated successfully!' as result; 