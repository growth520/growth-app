-- Insert missing user_progress records for users who completed assessment
-- This script should be run in Supabase SQL Editor

-- First, let's see what users need records
SELECT 
    p.id as user_id,
    p.full_name,
    p.username,
    p.has_completed_assessment
FROM profiles p
WHERE p.has_completed_assessment = true
AND p.id NOT IN (
    SELECT user_id FROM user_progress
);

-- Now insert the missing records
INSERT INTO user_progress (
    user_id,
    xp,
    level,
    streak,
    current_challenge_id,
    challenge_assigned_at,
    last_viewed_notifications,
    xp_to_next_level,
    tokens,
    streak_freezes_used,
    last_login_date,
    total_challenges_completed,
    created_at,
    updated_at,
    longest_streak,
    last_challenge_completed_date
)
SELECT 
    p.id as user_id,
    0 as xp,
    1 as level,
    0 as streak,
    NULL as current_challenge_id,
    NULL as challenge_assigned_at,
    NOW() as last_viewed_notifications,
    100 as xp_to_next_level,
    0 as tokens,
    0 as streak_freezes_used,
    CURRENT_DATE as last_login_date,
    0 as total_challenges_completed,
    NOW() as created_at,
    NOW() as updated_at,
    0 as longest_streak,
    NULL as last_challenge_completed_date
FROM profiles p
WHERE p.has_completed_assessment = true
AND p.id NOT IN (
    SELECT user_id FROM user_progress
);

-- Verify the records were created
SELECT 
    up.user_id,
    up.xp,
    up.level,
    up.streak,
    up.total_challenges_completed,
    p.full_name,
    p.username
FROM user_progress up
JOIN profiles p ON up.user_id = p.id
WHERE p.has_completed_assessment = true
ORDER BY up.xp DESC, up.level DESC; 