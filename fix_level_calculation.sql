-- Fix Level Calculation Function
-- This function recalculates and updates user levels based on their current XP

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    calculated_level INTEGER := 1;
    xp_required INTEGER;
BEGIN
    -- Calculate level based on XP formula: 50 + (level - 1) * 25
    -- Level 1: 0-49 XP
    -- Level 2: 50-74 XP  
    -- Level 3: 75-99 XP
    -- Level 4: 100-124 XP
    -- etc.
    
    WHILE TRUE LOOP
        xp_required := 50 + (calculated_level - 1) * 25;
        
        -- If user has enough XP for this level, continue to next level
        IF p_xp >= xp_required THEN
            calculated_level := calculated_level + 1;
        ELSE
            -- User doesn't have enough XP for this level, so previous level is correct
            calculated_level := calculated_level - 1;
            EXIT;
        END IF;
        
        -- Safety check to prevent infinite loop
        IF calculated_level > 100 THEN
            calculated_level := 100;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN GREATEST(1, calculated_level);
END;
$$ LANGUAGE plpgsql;

-- Function to update all user levels based on their current XP
CREATE OR REPLACE FUNCTION update_all_user_levels()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    new_level INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all users and update their levels
    FOR user_record IN 
        SELECT user_id, xp, level 
        FROM user_progress 
        WHERE user_id IS NOT NULL
    LOOP
        -- Calculate correct level based on XP
        new_level := calculate_level_from_xp(user_record.xp);
        
        -- Update if level is incorrect
        IF new_level != user_record.level THEN
            UPDATE user_progress 
            SET 
                level = new_level,
                updated_at = NOW()
            WHERE user_id = user_record.user_id;
            
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Updated user % from level % to level % (XP: %)', 
                user_record.user_id, user_record.level, new_level, user_record.xp;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated levels for % users', updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update a specific user's level
CREATE OR REPLACE FUNCTION update_user_level(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_xp INTEGER;
    current_level INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current user data
    SELECT xp, level INTO user_xp, current_level
    FROM user_progress 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User progress not found for user %', p_user_id;
    END IF;
    
    -- Calculate correct level
    new_level := calculate_level_from_xp(user_xp);
    
    -- Update if level is incorrect
    IF new_level != current_level THEN
        UPDATE user_progress 
        SET 
            level = new_level,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RAISE NOTICE 'Updated user % from level % to level % (XP: %)', 
            p_user_id, current_level, new_level, user_xp;
    END IF;
    
    RETURN new_level;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_level_from_xp(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_user_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_level(UUID) TO authenticated;

-- Test the level calculation
SELECT 
    'Level 1 (0-49 XP)' as test_case,
    calculate_level_from_xp(0) as level_0,
    calculate_level_from_xp(25) as level_25,
    calculate_level_from_xp(49) as level_49;

SELECT 
    'Level 2 (50-74 XP)' as test_case,
    calculate_level_from_xp(50) as level_50,
    calculate_level_from_xp(60) as level_60,
    calculate_level_from_xp(74) as level_74;

SELECT 
    'Level 3 (75-99 XP)' as test_case,
    calculate_level_from_xp(75) as level_75,
    calculate_level_from_xp(85) as level_85,
    calculate_level_from_xp(99) as level_99;

SELECT 
    'High XP Test' as test_case,
    calculate_level_from_xp(320) as level_320,
    calculate_level_from_xp(500) as level_500,
    calculate_level_from_xp(1000) as level_1000;

-- Check current users with incorrect levels
SELECT 
    up.user_id,
    up.xp,
    up.level as current_level,
    calculate_level_from_xp(up.xp) as correct_level,
    CASE 
        WHEN up.level != calculate_level_from_xp(up.xp) THEN 'NEEDS UPDATE'
        ELSE 'CORRECT'
    END as status
FROM user_progress up
WHERE up.user_id IS NOT NULL
ORDER BY up.xp DESC; 