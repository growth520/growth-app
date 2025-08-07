-- CHECK COMPLETED_CHALLENGES TABLE STRUCTURE
-- This will show us exactly what columns exist

-- 1. Check if table exists
SELECT '=== TABLE EXISTS ===' as step;
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'completed_challenges';

-- 2. Show all columns in the table
SELECT '=== TABLE COLUMNS ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 3. Show table constraints
SELECT '=== TABLE CONSTRAINTS ===' as step;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges';

-- 4. Show foreign key constraints
SELECT '=== FOREIGN KEYS ===' as step;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'completed_challenges';

-- 5. Try a test insert with minimal data
SELECT '=== TEST INSERT ===' as step;
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

-- 6. Show sample data structure
SELECT '=== SAMPLE DATA ===' as step;
SELECT * FROM public.completed_challenges LIMIT 1; 