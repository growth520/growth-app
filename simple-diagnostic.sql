-- SIMPLE DIAGNOSTIC FOR COMPLETED_CHALLENGES
-- This will show us exactly what's happening

-- 1. Check if table exists in pg_tables
SELECT '=== CHECKING PG_TABLES ===' as step;
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'completed_challenges';

-- 2. Check if table exists in information_schema
SELECT '=== CHECKING INFORMATION_SCHEMA ===' as step;
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_name = 'completed_challenges';

-- 3. Check all tables with 'completed' in the name
SELECT '=== ALL TABLES WITH "COMPLETED" ===' as step;
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE tablename LIKE '%completed%';

-- 4. Check current user and database
SELECT '=== CURRENT USER AND DATABASE ===' as step;
SELECT current_user, current_database();

-- 5. Try to describe the table structure
SELECT '=== TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 6. Check RLS status
SELECT '=== RLS STATUS ===' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'completed_challenges';

-- 7. Check RLS policies
SELECT '=== RLS POLICIES ===' as step;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'completed_challenges';

-- 8. Try a simple SELECT
SELECT '=== TRYING SELECT ===' as step;
SELECT COUNT(*) as total_records FROM public.completed_challenges;

-- 9. Try to create the table if it doesn't exist
SELECT '=== CREATING TABLE IF NOT EXISTS ===' as step;
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'completed_challenges'
    ) THEN
        -- Create the table
        CREATE TABLE public.completed_challenges (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
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
        
        -- Add foreign key
        ALTER TABLE public.completed_challenges 
        ADD CONSTRAINT fk_completed_challenges_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Create indexes
        CREATE INDEX idx_completed_challenges_user_id ON public.completed_challenges(user_id);
        CREATE INDEX idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
        CREATE INDEX idx_completed_challenges_completed_at ON public.completed_challenges(completed_at);
        
        -- Enable RLS
        ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own completed challenges" ON public.completed_challenges
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own completed challenges" ON public.completed_challenges
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own completed challenges" ON public.completed_challenges
            FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own completed challenges" ON public.completed_challenges
            FOR DELETE USING (auth.uid() = user_id);
        
        -- Grant permissions
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT ALL ON public.completed_challenges TO authenticated;
        
        RAISE NOTICE 'Table created successfully!';
    ELSE
        RAISE NOTICE 'Table already exists!';
    END IF;
END $$;

-- 10. Test insert
SELECT '=== TESTING INSERT ===' as step;
DO $$
BEGIN
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        challenge_title,
        challenge_description,
        reflection,
        category,
        completed_at,
        xp_earned,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        1,
        'Test Challenge',
        'Test Description',
        'Test reflection',
        'Test',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 11. Final check
SELECT '=== FINAL CHECK ===' as step;
SELECT COUNT(*) as total_records FROM public.completed_challenges; 