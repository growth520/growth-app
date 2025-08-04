-- Manual insert for user_progress records
-- Run this in Supabase SQL Editor

-- First, let's see what users need records
SELECT 
    p.id as user_id,
    p.full_name,
    p.username,
    p.has_completed_assessment
FROM profiles p
WHERE p.has_completed_assessment = true;

-- Now manually insert the records for both users
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
) VALUES 
(
    '41d9bffe-75c1-4aaf-b8ba-2850a3491728', -- jeremy davis
    10, -- XP
    1, -- level
    1, -- streak
    NULL, -- current_challenge_id
    NULL, -- challenge_assigned_at
    NOW(), -- last_viewed_notifications
    100, -- xp_to_next_level
    0, -- tokens
    0, -- streak_freezes_used
    CURRENT_DATE, -- last_login_date
    0, -- total_challenges_completed
    NOW(), -- created_at
    NOW(), -- updated_at
    1, -- longest_streak
    NULL -- last_challenge_completed_date
),
(
    '6b18fb7e-5821-4a30-bad7-0d3c6873cc77', -- Yanki Davis
    50, -- XP
    1, -- level
    5, -- streak
    NULL, -- current_challenge_id
    NULL, -- challenge_assigned_at
    NOW(), -- last_viewed_notifications
    100, -- xp_to_next_level
    0, -- tokens
    0, -- streak_freezes_used
    CURRENT_DATE, -- last_login_date
    0, -- total_challenges_completed
    NOW(), -- created_at
    NOW(), -- updated_at
    5, -- longest_streak
    NULL -- last_challenge_completed_date
)
ON CONFLICT (user_id) DO NOTHING;

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