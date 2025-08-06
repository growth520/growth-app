-- Check notifications and follows system status
-- This will help diagnose what's wrong after running the SQL fix

-- 1. Check if notifications table exists
SELECT 
    'notifications table exists' as check_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') as result;

-- 2. Check notifications table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 3. Check if follows table exists and its structure
SELECT 
    'follows table exists' as check_name,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'follows') as result;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'follows' 
ORDER BY ordinal_position;

-- 4. Check if the follow notification trigger exists
SELECT 
    'follow notification trigger exists' as check_name,
    EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'trigger_create_follow_notification'
    ) as result;

-- 5. Check if the create_follow_notification function exists
SELECT 
    'create_follow_notification function exists' as check_name,
    EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'create_follow_notification'
    ) as result;

-- 6. Check RLS policies on follows table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'follows';

-- 7. Check RLS policies on notifications table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 8. Check recent follows data
SELECT 
    'recent follows count' as check_name,
    COUNT(*) as result
FROM follows 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 9. Check recent notifications data
SELECT 
    'recent notifications count' as check_name,
    COUNT(*) as result
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 10. Check if there are any recent follow notifications
SELECT 
    'recent follow notifications' as check_name,
    COUNT(*) as result
FROM notifications 
WHERE type = 'follow' AND created_at > NOW() - INTERVAL '1 hour'; 