-- Simple Level Fix
-- Direct approach to fix level calculation issues

-- First, let's see what users have incorrect levels
SELECT 
    up.user_id,
    up.xp,
    up.level as current_level,
    CASE 
        WHEN up.xp < 50 THEN 1
        WHEN up.xp < 75 THEN 2
        WHEN up.xp < 100 THEN 3
        WHEN up.xp < 125 THEN 4
        WHEN up.xp < 150 THEN 5
        WHEN up.xp < 175 THEN 6
        WHEN up.xp < 200 THEN 7
        WHEN up.xp < 225 THEN 8
        WHEN up.xp < 250 THEN 9
        WHEN up.xp < 275 THEN 10
        WHEN up.xp < 300 THEN 11
        WHEN up.xp < 325 THEN 12
        WHEN up.xp < 350 THEN 13
        WHEN up.xp < 375 THEN 14
        WHEN up.xp < 400 THEN 15
        ELSE FLOOR((up.xp - 25) / 25) + 1
    END as correct_level,
    CASE 
        WHEN up.level != CASE 
            WHEN up.xp < 50 THEN 1
            WHEN up.xp < 75 THEN 2
            WHEN up.xp < 100 THEN 3
            WHEN up.xp < 125 THEN 4
            WHEN up.xp < 150 THEN 5
            WHEN up.xp < 175 THEN 6
            WHEN up.xp < 200 THEN 7
            WHEN up.xp < 225 THEN 8
            WHEN up.xp < 250 THEN 9
            WHEN up.xp < 275 THEN 10
            WHEN up.xp < 300 THEN 11
            WHEN up.xp < 325 THEN 12
            WHEN up.xp < 350 THEN 13
            WHEN up.xp < 375 THEN 14
            WHEN up.xp < 400 THEN 15
            ELSE FLOOR((up.xp - 25) / 25) + 1
        END THEN 'NEEDS UPDATE'
        ELSE 'CORRECT'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC;

-- Now update all users with the correct levels
UPDATE user_progress 
SET 
    level = CASE 
        WHEN xp < 50 THEN 1
        WHEN xp < 75 THEN 2
        WHEN xp < 100 THEN 3
        WHEN xp < 125 THEN 4
        WHEN xp < 150 THEN 5
        WHEN xp < 175 THEN 6
        WHEN xp < 200 THEN 7
        WHEN xp < 225 THEN 8
        WHEN xp < 250 THEN 9
        WHEN xp < 275 THEN 10
        WHEN xp < 300 THEN 11
        WHEN xp < 325 THEN 12
        WHEN xp < 350 THEN 13
        WHEN xp < 375 THEN 14
        WHEN xp < 400 THEN 15
        ELSE FLOOR((xp - 25) / 25) + 1
    END,
    updated_at = NOW()
WHERE user_id IS NOT NULL;

-- Verify the fix worked
SELECT 
    up.user_id,
    up.xp,
    up.level as new_level,
    CASE 
        WHEN up.xp < 50 THEN 1
        WHEN up.xp < 75 THEN 2
        WHEN up.xp < 100 THEN 3
        WHEN up.xp < 125 THEN 4
        WHEN up.xp < 150 THEN 5
        WHEN up.xp < 175 THEN 6
        WHEN up.xp < 200 THEN 7
        WHEN up.xp < 225 THEN 8
        WHEN up.xp < 250 THEN 9
        WHEN up.xp < 275 THEN 10
        WHEN up.xp < 300 THEN 11
        WHEN up.xp < 325 THEN 12
        WHEN up.xp < 350 THEN 13
        WHEN up.xp < 375 THEN 14
        WHEN up.xp < 400 THEN 15
        ELSE FLOOR((up.xp - 25) / 25) + 1
    END as expected_level,
    CASE 
        WHEN up.level = CASE 
            WHEN up.xp < 50 THEN 1
            WHEN up.xp < 75 THEN 2
            WHEN up.xp < 100 THEN 3
            WHEN up.xp < 125 THEN 4
            WHEN up.xp < 150 THEN 5
            WHEN up.xp < 175 THEN 6
            WHEN up.xp < 200 THEN 7
            WHEN up.xp < 225 THEN 8
            WHEN up.xp < 250 THEN 9
            WHEN up.xp < 275 THEN 10
            WHEN up.xp < 300 THEN 11
            WHEN up.xp < 325 THEN 12
            WHEN up.xp < 350 THEN 13
            WHEN up.xp < 375 THEN 14
            WHEN up.xp < 400 THEN 15
            ELSE FLOOR((up.xp - 25) / 25) + 1
        END THEN 'FIXED'
        ELSE 'STILL WRONG'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC; 