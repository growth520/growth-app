-- Rebuild completed_challenges table with correct structure
-- This will drop the existing table and recreate it with all required columns

-- 1. Drop the existing table (this will also drop all policies and triggers)
DROP TABLE IF EXISTS public.completed_challenges CASCADE;

-- 2. Create the table with the correct structure
CREATE TABLE public.completed_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    challenge_title TEXT NOT NULL,
    challenge_description TEXT,
    reflection TEXT,
    photo_url TEXT,
    category TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    xp_earned INTEGER DEFAULT 10,
    is_extra_challenge BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_completed_challenges_user_id ON public.completed_challenges(user_id);
CREATE INDEX idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
CREATE INDEX idx_completed_challenges_completed_at ON public.completed_challenges(completed_at);
CREATE INDEX idx_completed_challenges_user_challenge ON public.completed_challenges(user_id, challenge_id);

-- 4. Enable RLS
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own completed challenges"
ON public.completed_challenges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completed challenges"
ON public.completed_challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed challenges"
ON public.completed_challenges
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed challenges"
ON public.completed_challenges
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT ALL ON public.completed_challenges TO authenticated;

-- 7. Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_completed_challenges_updated_at
    BEFORE UPDATE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Create trigger to update user_progress.total_challenges_completed
CREATE OR REPLACE FUNCTION public.update_challenge_completion_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_challenges_completed in user_progress
    UPDATE public.user_progress
    SET total_challenges_completed = (
        SELECT COUNT(*) 
        FROM public.completed_challenges 
        WHERE user_id = NEW.user_id
    )
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_challenge_completion_trigger
    AFTER INSERT OR DELETE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_completion_count();

-- 9. Test the table structure
SELECT '=== TESTING TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 10. Test insert with the exact data structure the frontend uses
SELECT '=== TESTING INSERT ===' as step;
DO $$
BEGIN
    -- Try to insert a test record with the exact structure the frontend uses
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        challenge_title,
        challenge_description,
        reflection,
        photo_url,
        category,
        completed_at,
        xp_earned,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        999,
        'Test Challenge Title',
        'Test Challenge Description',
        'Test reflection text',
        NULL,
        'Test Category',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Test insert successful! All columns exist and work correctly.';
    
    -- Clean up the test record
    DELETE FROM public.completed_challenges 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 999;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 11. Final verification
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    'Table exists' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'completed_challenges'
    ) as result
UNION ALL
SELECT 
    'All required columns exist' as check_type,
    (COUNT(*) = 12) as result  -- 12 columns total (id + 11 frontend columns)
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'completed_challenges'
UNION ALL
SELECT 
    'RLS enabled' as check_type,
    rowsecurity as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'completed_challenges'
UNION ALL
SELECT 
    'Policies created' as check_type,
    (COUNT(*) = 4) as result  -- 4 policies (SELECT, INSERT, UPDATE, DELETE)
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'completed_challenges';

SELECT '=== COMPLETED_CHALLENGES TABLE REBUILT SUCCESSFULLY ===' as result; 