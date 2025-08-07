-- Check all columns in completed_challenges table
-- Run this in your Supabase SQL editor

SELECT '=== ALL COLUMNS IN COMPLETED_CHALLENGES ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- Show what the frontend is trying to insert
SELECT '=== FRONTEND INSERT FIELDS ===' as step;
SELECT 'user_id' as field_name, 'UUID' as expected_type
UNION ALL SELECT 'challenge_id', 'INTEGER'
UNION ALL SELECT 'challenge_title', 'TEXT'
UNION ALL SELECT 'challenge_description', 'TEXT'
UNION ALL SELECT 'reflection', 'TEXT'
UNION ALL SELECT 'photo_url', 'TEXT'
UNION ALL SELECT 'category', 'TEXT'
UNION ALL SELECT 'completed_at', 'TIMESTAMP'
UNION ALL SELECT 'xp_earned', 'INTEGER'
UNION ALL SELECT 'is_extra_challenge', 'BOOLEAN'; 