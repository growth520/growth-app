-- TEST TABLE EXISTENCE
-- This script will check if the completed_challenges table exists and can be accessed

-- 1. Check if table exists in pg_tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'completed_challenges';

-- 2. Check if table exists in information_schema
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_name = 'completed_challenges';

-- 3. Try to describe the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 4. Try a simple SELECT to see if we can access it
SELECT COUNT(*) as total_records FROM public.completed_challenges;

-- 5. Check if we can insert a test record
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
    
    RAISE NOTICE 'Insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 6. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'completed_challenges';

-- 7. Final result
SELECT 'Table existence test completed!' as result; 