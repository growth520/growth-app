-- Quadratic Level System
-- Uses exponential growth: XP for next level = 100 × (Level ^ 1.5)

-- First, let's understand the new formula:
-- Level 1: 0-100 XP (100 XP needed)
-- Level 2: 100-283 XP (283 XP needed) 
-- Level 3: 283-520 XP (520 XP needed)
-- Level 4: 520-800 XP (800 XP needed)
-- etc.

-- The pattern is: XP needed for level N = 100 × (N ^ 1.5)
-- Total XP needed to reach level N = sum of all previous levels

-- Let's calculate the total XP needed for each level
WITH level_calculations AS (
    SELECT 
        level,
        ROUND(100 * POWER(level, 1.5)) as xp_for_this_level,
        CASE 
            WHEN level = 1 THEN 0
            ELSE (
                SELECT SUM(ROUND(100 * POWER(series_level, 1.5)))
                FROM generate_series(1, level - 1) as series_level
            )
        END as total_xp_needed
    FROM generate_series(1, 20) as level
)
SELECT 
    level,
    xp_for_this_level,
    total_xp_needed,
    CASE 
        WHEN level = 1 THEN '0-' || (total_xp_needed + xp_for_this_level - 1)
        ELSE (total_xp_needed) || '-' || (total_xp_needed + xp_for_this_level - 1)
    END as xp_range
FROM level_calculations
ORDER BY level;

-- Function to calculate level from total XP using the quadratic formula
CREATE OR REPLACE FUNCTION calculate_level_from_xp_quadratic(p_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    calculated_level INTEGER := 1;
    total_xp_needed INTEGER := 0;
    xp_for_next_level INTEGER;
BEGIN
    -- Calculate level by summing up XP requirements until we exceed the user's XP
    WHILE TRUE LOOP
        -- Calculate XP needed for this level
        xp_for_next_level := ROUND(100 * POWER(calculated_level, 1.5));
        
        -- Add to total XP needed
        total_xp_needed := total_xp_needed + xp_for_next_level;
        
        -- If user has enough XP for this level, continue to next level
        IF p_xp >= total_xp_needed THEN
            calculated_level := calculated_level + 1;
        ELSE
            -- User doesn't have enough XP for this level, so previous level is correct
            calculated_level := calculated_level - 1;
            EXIT;
        END IF;
        
        -- Safety check to prevent infinite loop
        IF calculated_level > 1000 THEN
            calculated_level := 1000;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN GREATEST(1, calculated_level);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total XP needed for a specific level
CREATE OR REPLACE FUNCTION calculate_total_xp_for_level(p_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_xp INTEGER := 0;
    i INTEGER;
BEGIN
    FOR i IN 1..p_level LOOP
        total_xp := total_xp + ROUND(100 * POWER(i, 1.5));
    END LOOP;
    
    RETURN total_xp;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION calculate_xp_for_next_level(p_current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN ROUND(100 * POWER(p_current_level + 1, 1.5));
END;
$$ LANGUAGE plpgsql;

-- Test the new formula
SELECT 
    'Quadratic Formula Test' as test_type,
    'XP' as xp_label,
    'Expected Level' as level_label,
    'Formula Result' as formula_label;

SELECT 
    0 as xp, 1 as expected_level, 
    calculate_level_from_xp_quadratic(0) as formula_result;

SELECT 
    50 as xp, 1 as expected_level, 
    calculate_level_from_xp_quadratic(50) as formula_result;

SELECT 
    100 as xp, 1 as expected_level, 
    calculate_level_from_xp_quadratic(100) as formula_result;

SELECT 
    200 as xp, 2 as expected_level, 
    calculate_level_from_xp_quadratic(200) as formula_result;

SELECT 
    400 as xp, 2 as expected_level, 
    calculate_level_from_xp_quadratic(400) as formula_result;

SELECT 
    500 as xp, 3 as expected_level, 
    calculate_level_from_xp_quadratic(500) as formula_result;

SELECT 
    1000 as xp, 4 as expected_level, 
    calculate_level_from_xp_quadratic(1000) as formula_result;

SELECT 
    320 as xp, 2 as expected_level, 
    calculate_level_from_xp_quadratic(320) as formula_result;

-- Show the progression for first 10 levels
SELECT 
    'Level Progression' as info_type,
    'Level' as level_label,
    'XP for This Level' as xp_for_level,
    'Total XP Needed' as total_xp_needed,
    'XP Range' as xp_range;

SELECT 
    1 as level, 
    ROUND(100 * POWER(1, 1.5)) as xp_for_level,
    0 as total_xp_needed,
    '0-100' as xp_range;

SELECT 
    2 as level, 
    ROUND(100 * POWER(2, 1.5)) as xp_for_level,
    100 as total_xp_needed,
    '100-383' as xp_range;

SELECT 
    3 as level, 
    ROUND(100 * POWER(3, 1.5)) as xp_for_level,
    383 as total_xp_needed,
    '383-903' as xp_range;

SELECT 
    4 as level, 
    ROUND(100 * POWER(4, 1.5)) as xp_for_level,
    903 as total_xp_needed,
    '903-1703' as xp_range;

SELECT 
    5 as level, 
    ROUND(100 * POWER(5, 1.5)) as xp_for_level,
    1703 as total_xp_needed,
    '1703-2918' as xp_range;

-- Now let's see what users have incorrect levels with the new system
SELECT 
    up.user_id,
    up.xp,
    up.level as current_level,
    calculate_level_from_xp_quadratic(up.xp) as correct_level,
    CASE 
        WHEN up.level != calculate_level_from_xp_quadratic(up.xp) THEN 'NEEDS UPDATE'
        ELSE 'CORRECT'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC;

-- Update all users with the correct levels using the quadratic formula
UPDATE user_progress 
SET 
    level = calculate_level_from_xp_quadratic(xp),
    updated_at = NOW()
WHERE user_id IS NOT NULL;

-- Verify the fix worked
SELECT 
    up.user_id,
    up.xp,
    up.level as new_level,
    calculate_level_from_xp_quadratic(up.xp) as expected_level,
    CASE 
        WHEN up.level = calculate_level_from_xp_quadratic(up.xp) THEN 'FIXED'
        ELSE 'STILL WRONG'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_level_from_xp_quadratic(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_xp_for_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_xp_for_next_level(INTEGER) TO authenticated;

-- Show comparison between old and new systems
SELECT 
    'System Comparison' as comparison_type,
    'Level' as level_label,
    'Old System XP' as old_xp,
    'New System XP' as new_xp,
    'Difference' as difference;

SELECT 
    1 as level, 
    50 as old_xp, 
    ROUND(100 * POWER(1, 1.5)) as new_xp,
    ROUND(100 * POWER(1, 1.5)) - 50 as difference;

SELECT 
    2 as level, 
    75 as old_xp, 
    ROUND(100 * POWER(2, 1.5)) as new_xp,
    ROUND(100 * POWER(2, 1.5)) - 75 as difference;

SELECT 
    5 as level, 
    150 as old_xp, 
    ROUND(100 * POWER(5, 1.5)) as new_xp,
    ROUND(100 * POWER(5, 1.5)) - 150 as difference;

SELECT 
    10 as level, 
    275 as old_xp, 
    ROUND(100 * POWER(10, 1.5)) as new_xp,
    ROUND(100 * POWER(10, 1.5)) - 275 as difference; 