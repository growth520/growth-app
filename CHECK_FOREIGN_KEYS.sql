-- =====================================================
-- CHECK FOREIGN KEY RELATIONSHIPS - Run this in Supabase SQL Editor
-- =====================================================

-- Check foreign key constraints for posts table
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
    AND tc.table_name = 'posts';

-- Check if posts table has any data
SELECT 
    'Posts count' as metric,
    COUNT(*) as count
FROM posts

UNION ALL

SELECT 
    'Posts with profiles' as metric,
    COUNT(*) as count
FROM posts p
JOIN profiles pr ON p.user_id = pr.id

UNION ALL

SELECT 
    'Posts without profiles' as metric,
    COUNT(*) as count
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IS NULL;

-- Show sample posts with profile data
SELECT 
    p.id as post_id,
    p.user_id,
    p.reflection,
    p.created_at,
    pr.full_name,
    pr.username
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 5; 