-- CHECK COMPLETED_CHALLENGES TABLE STRUCTURE
-- This script will show us the exact structure of the completed_challenges table

-- 1. Check if the table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges';

-- 2. Show all columns in the completed_challenges table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 3. Show table constraints
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'completed_challenges';

-- 4. Show indexes on the table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'completed_challenges';

-- 5. Check RLS policies
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

-- 6. Show triggers on the table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table = 'completed_challenges';

-- 7. Test a simple insert to see what the actual error is
-- (This will help us understand what columns are expected)
SELECT 'Table structure check completed!' as result; 