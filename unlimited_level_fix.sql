-- Unlimited Level Fix
-- Uses mathematical formula to calculate levels for any XP amount

-- First, let's understand the XP formula:
-- Level 1: 0-49 XP (50 XP needed)
-- Level 2: 50-74 XP (75 XP needed) 
-- Level 3: 75-99 XP (100 XP needed)
-- Level 4: 100-124 XP (125 XP needed)
-- etc.

-- The pattern is: XP needed for level N = 50 + (N-1) * 25
-- So: XP = 50 + (level-1) * 25
-- Rearranging: level = (XP - 25) / 25 + 1
-- But we need to handle the case where XP < 50 (level 1)

-- Mathematical formula for level calculation:
-- If XP < 50: Level = 1
-- If XP >= 50: Level = FLOOR((XP - 25) / 25) + 1

-- Let's test the formula first
SELECT 
    'Formula Test' as test_type,
    0 as xp, FLOOR((0 - 25) / 25) + 1 as calculated_level,
    25 as xp2, FLOOR((25 - 25) / 25) + 1 as calculated_level2,
    49 as xp3, FLOOR((49 - 25) / 25) + 1 as calculated_level3,
    50 as xp4, FLOOR((50 - 25) / 25) + 1 as calculated_level4,
    75 as xp5, FLOOR((75 - 25) / 25) + 1 as calculated_level5,
    100 as xp6, FLOOR((100 - 25) / 25) + 1 as calculated_level6,
    320 as xp7, FLOOR((320 - 25) / 25) + 1 as calculated_level7,
    1000 as xp8, FLOOR((1000 - 25) / 25) + 1 as calculated_level8,
    10000 as xp9, FLOOR((10000 - 25) / 25) + 1 as calculated_level9;

-- Now let's see what users have incorrect levels
SELECT 
    up.user_id,
    up.xp,
    up.level as current_level,
    CASE 
        WHEN up.xp < 50 THEN 1
        ELSE FLOOR((up.xp - 25) / 25) + 1
    END as correct_level,
    CASE 
        WHEN up.level != CASE 
            WHEN up.xp < 50 THEN 1
            ELSE FLOOR((up.xp - 25) / 25) + 1
        END THEN 'NEEDS UPDATE'
        ELSE 'CORRECT'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC;

-- Update all users with the correct levels using the mathematical formula
UPDATE user_progress 
SET 
    level = CASE 
        WHEN xp < 50 THEN 1
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
        ELSE FLOOR((up.xp - 25) / 25) + 1
    END as expected_level,
    CASE 
        WHEN up.level = CASE 
            WHEN up.xp < 50 THEN 1
            ELSE FLOOR((up.xp - 25) / 25) + 1
        END THEN 'FIXED'
        ELSE 'STILL WRONG'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC;

-- Test the formula with various XP amounts to show it works for any level
SELECT 
    'Level Formula Verification' as test_type,
    'XP' as xp_label,
    'Expected Level' as level_label,
    'Formula Result' as formula_label;

SELECT 
    0 as xp, 1 as expected_level, 
    CASE WHEN 0 < 50 THEN 1 ELSE FLOOR((0 - 25) / 25) + 1 END as formula_result;

SELECT 
    25 as xp, 1 as expected_level, 
    CASE WHEN 25 < 50 THEN 1 ELSE FLOOR((25 - 25) / 25) + 1 END as formula_result;

SELECT 
    49 as xp, 1 as expected_level, 
    CASE WHEN 49 < 50 THEN 1 ELSE FLOOR((49 - 25) / 25) + 1 END as formula_result;

SELECT 
    50 as xp, 2 as expected_level, 
    CASE WHEN 50 < 50 THEN 1 ELSE FLOOR((50 - 25) / 25) + 1 END as formula_result;

SELECT 
    75 as xp, 3 as expected_level, 
    CASE WHEN 75 < 50 THEN 1 ELSE FLOOR((75 - 25) / 25) + 1 END as formula_result;

SELECT 
    100 as xp, 4 as expected_level, 
    CASE WHEN 100 < 50 THEN 1 ELSE FLOOR((100 - 25) / 25) + 1 END as formula_result;

SELECT 
    320 as xp, 12 as expected_level, 
    CASE WHEN 320 < 50 THEN 1 ELSE FLOOR((320 - 25) / 25) + 1 END as formula_result;

SELECT 
    1000 as xp, 40 as expected_level, 
    CASE WHEN 1000 < 50 THEN 1 ELSE FLOOR((1000 - 25) / 25) + 1 END as formula_result;

SELECT 
    10000 as xp, 400 as expected_level, 
    CASE WHEN 10000 < 50 THEN 1 ELSE FLOOR((10000 - 25) / 25) + 1 END as formula_result;

-- Show XP requirements for next few levels
SELECT 
    'XP Requirements' as info_type,
    'Level' as level_label,
    'XP Required' as xp_required,
    'XP Range' as xp_range;

SELECT 1 as level, 50 as xp_required, '0-49' as xp_range;
SELECT 2 as level, 75 as xp_required, '50-74' as xp_range;
SELECT 3 as level, 100 as xp_required, '75-99' as xp_range;
SELECT 4 as level, 125 as xp_required, '100-124' as xp_range;
SELECT 5 as level, 150 as xp_required, '125-149' as xp_range;
SELECT 10 as level, 275 as xp_required, '250-274' as xp_range;
SELECT 12 as level, 325 as xp_required, '300-324' as xp_range;
SELECT 50 as level, 1275 as xp_required, '1250-1274' as xp_range;
SELECT 100 as level, 2525 as xp_required, '2500-2524' as xp_range; 