-- =====================================================
-- COMPLETE BADGE SYSTEM SETUP WITH AUTOMATIC AWARDING
-- =====================================================
-- This script creates the badge system with triggers and functions
-- for automatically awarding badges when users meet requirements

-- 1. CREATE BADGE TABLES
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- Create badges table
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_url TEXT,
    criteria_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_badges_created_at ON badges(created_at);

-- 2. INSERT SAMPLE BADGES
-- =====================================================

INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'FIRST_CHALLENGE',
    'Complete your very first challenge',
    NULL,
    '{"type": "challenges_completed", "target": 1, "requirements": [{"description": "Complete 1 challenge", "target": 1}]}'
),
(
    'CHALLENGES_5',
    'Complete 5 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 5, "requirements": [{"description": "Complete 5 challenges", "target": 5}]}'
),
(
    'CHALLENGES_10',
    'Complete 10 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 10, "requirements": [{"description": "Complete 10 challenges", "target": 10}]}'
),
(
    'CHALLENGES_25',
    'Complete 25 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 25, "requirements": [{"description": "Complete 25 challenges", "target": 25}]}'
),
(
    'CHALLENGES_50',
    'Complete 50 challenges',
    NULL,
    '{"type": "challenges_completed", "target": 50, "requirements": [{"description": "Complete 50 challenges", "target": 50}]}'
),
(
    'LEVEL_2',
    'Reach level 2',
    NULL,
    '{"type": "level", "target": 2, "requirements": [{"description": "Reach level 2", "target": 2}]}'
),
(
    'LEVEL_3',
    'Reach level 3',
    NULL,
    '{"type": "level", "target": 3, "requirements": [{"description": "Reach level 3", "target": 3}]}'
),
(
    'LEVEL_4',
    'Reach level 4',
    NULL,
    '{"type": "level", "target": 4, "requirements": [{"description": "Reach level 4", "target": 4}]}'
),
(
    'LEVEL_5',
    'Reach level 5',
    NULL,
    '{"type": "level", "target": 5, "requirements": [{"description": "Reach level 5", "target": 5}]}'
),
(
    'STREAK_7',
    'Maintain a 7-day streak',
    NULL,
    '{"type": "streak", "target": 7, "requirements": [{"description": "Maintain a 7-day streak", "target": 7}]}'
),
(
    'STREAK_30',
    'Maintain a 30-day streak',
    NULL,
    '{"type": "streak", "target": 30, "requirements": [{"description": "Maintain a 30-day streak", "target": 30}]}'
),
(
    'FIRST_REFLECTION',
    'Complete your first reflection',
    NULL,
    '{"type": "reflection", "target": 1, "requirements": [{"description": "Complete 1 reflection", "target": 1}]}'
),
(
    'FIRST_SHARE',
    'Share your first post',
    NULL,
    '{"type": "share", "target": 1, "requirements": [{"description": "Share 1 post", "target": 1}]}'
);

-- 3. CREATE BADGE AWARDING FUNCTIONS
-- =====================================================

-- Function to check and award challenge completion badges
CREATE OR REPLACE FUNCTION check_challenge_completion_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    challenge_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's challenge completion count
    SELECT COUNT(*) INTO challenge_count
    FROM completed_challenges
    WHERE user_id = p_user_id;
    
    -- Check each challenge completion badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'challenges_completed'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF challenge_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (p_user_id, badge_record.id);
            
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                TRUE::BOOLEAN;
        ELSE
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                FALSE::BOOLEAN;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award level badges
CREATE OR REPLACE FUNCTION check_level_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    user_level INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's current level
    SELECT level INTO user_level
    FROM user_progress
    WHERE user_id = p_user_id;
    
    -- Check each level badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'level'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF user_level >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (p_user_id, badge_record.id);
            
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                TRUE::BOOLEAN;
        ELSE
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                FALSE::BOOLEAN;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award streak badges
CREATE OR REPLACE FUNCTION check_streak_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    user_streak INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's current streak
    SELECT streak INTO user_streak
    FROM user_progress
    WHERE user_id = p_user_id;
    
    -- Check each streak badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'streak'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF user_streak >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (p_user_id, badge_record.id);
            
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                TRUE::BOOLEAN;
        ELSE
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                FALSE::BOOLEAN;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award reflection badges
CREATE OR REPLACE FUNCTION check_reflection_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    reflection_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's reflection count
    SELECT COUNT(*) INTO reflection_count
    FROM completed_challenges
    WHERE user_id = p_user_id AND reflection IS NOT NULL AND reflection != '';
    
    -- Check each reflection badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'reflection'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF reflection_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (p_user_id, badge_record.id);
            
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                TRUE::BOOLEAN;
        ELSE
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                FALSE::BOOLEAN;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award share badges
CREATE OR REPLACE FUNCTION check_share_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    share_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's share count (public posts)
    SELECT COUNT(*) INTO share_count
    FROM posts
    WHERE user_id = p_user_id AND (privacy = 'public' OR visibility = 'public');
    
    -- Check each share badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'share'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF share_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (p_user_id, badge_record.id);
            
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                TRUE::BOOLEAN;
        ELSE
            RETURN QUERY SELECT 
                badge_record.name::TEXT,
                badge_record.description::TEXT,
                FALSE::BOOLEAN;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master function to check all badges
CREATE OR REPLACE FUNCTION check_all_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
BEGIN
    -- Check all badge types
    RETURN QUERY SELECT * FROM check_challenge_completion_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_level_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_streak_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_reflection_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_share_badges(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE TRIGGERS FOR AUTOMATIC BADGE AWARDING
-- =====================================================

-- Trigger function for completed_challenges table
CREATE OR REPLACE FUNCTION trigger_badge_check_on_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for new badges when a challenge is completed
    PERFORM check_all_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on completed_challenges
DROP TRIGGER IF EXISTS badge_check_on_challenge_completion ON completed_challenges;
CREATE TRIGGER badge_check_on_challenge_completion
    AFTER INSERT ON completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check_on_challenge_completion();

-- Trigger function for user_progress table (level and streak changes)
CREATE OR REPLACE FUNCTION trigger_badge_check_on_progress_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for new badges when progress is updated
    PERFORM check_all_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_progress
DROP TRIGGER IF EXISTS badge_check_on_progress_update ON user_progress;
CREATE TRIGGER badge_check_on_progress_update
    AFTER UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check_on_progress_update();

-- Trigger function for posts table (sharing)
CREATE OR REPLACE FUNCTION trigger_badge_check_on_post_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for new badges when a post is created
    PERFORM check_all_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on posts
DROP TRIGGER IF EXISTS badge_check_on_post_insert ON posts;
CREATE TRIGGER badge_check_on_post_insert
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check_on_post_insert();

-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for badges (read-only for all authenticated users)
CREATE POLICY "Allow authenticated users to read badges" ON badges
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON badges TO authenticated;
GRANT SELECT, INSERT ON user_badges TO authenticated;

-- Grant execute permissions on badge functions
GRANT EXECUTE ON FUNCTION check_challenge_completion_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_level_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_streak_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_reflection_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_share_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_badges(UUID) TO authenticated;

-- 7. VERIFY THE SETUP
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'badges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample badges
SELECT 
    name,
    description,
    criteria_json->>'type' as badge_type,
    criteria_json->>'target' as target_value
FROM badges
ORDER BY name;

-- Show sample user badges (if any exist)
SELECT 
    ub.user_id,
    b.name as badge_name,
    ub.earned_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
LIMIT 5;

SELECT 'Badge system setup complete with automatic awarding!' as result; 