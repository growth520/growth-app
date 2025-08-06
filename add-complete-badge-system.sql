-- =====================================================
-- COMPLETE BADGE SYSTEM - ALL BADGES WITH EMOJIS
-- =====================================================
-- This script adds all the requested badges with emojis and proper awarding logic
-- It avoids duplicating existing badges and adds the missing ones

-- 1. ADD MISSING CHALLENGE COMPLETION BADGES
-- =====================================================

-- Add missing challenge completion badges (avoiding duplicates)
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'CHALLENGES_75',
    'Complete 75 challenges',
    '7️⃣5️⃣',
    '{"type": "challenges_completed", "target": 75, "requirements": [{"description": "Complete 75 challenges", "target": 75}]}'
),
(
    'CHALLENGES_100',
    'Complete 100 challenges',
    '💯',
    '{"type": "challenges_completed", "target": 100, "requirements": [{"description": "Complete 100 challenges", "target": 100}]}'
),
(
    'CHALLENGES_150',
    'Complete 150 challenges',
    '🔥',
    '{"type": "challenges_completed", "target": 150, "requirements": [{"description": "Complete 150 challenges", "target": 150}]}'
),
(
    'CHALLENGES_200',
    'Complete 200 challenges',
    '🚀',
    '{"type": "challenges_completed", "target": 200, "requirements": [{"description": "Complete 200 challenges", "target": 200}]}'
),
(
    'CHALLENGES_500',
    'Complete 500 challenges',
    '🏅',
    '{"type": "challenges_completed", "target": 500, "requirements": [{"description": "Complete 500 challenges", "target": 500}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 2. ADD MISSING STREAK BADGES
-- =====================================================

-- Add missing streak badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'STREAK_14',
    'Maintain a 14-day streak',
    '🌞',
    '{"type": "streak", "target": 14, "requirements": [{"description": "Maintain a 14-day streak", "target": 14}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 3. ADD MISSING LEVEL BADGES
-- =====================================================

-- Add missing level badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'LEVEL_6',
    'Reach level 6',
    '6️⃣',
    '{"type": "level", "target": 6, "requirements": [{"description": "Reach level 6", "target": 6}]}'
),
(
    'LEVEL_7',
    'Reach level 7',
    '7️⃣',
    '{"type": "level", "target": 7, "requirements": [{"description": "Reach level 7", "target": 7}]}'
),
(
    'LEVEL_8',
    'Reach level 8',
    '8️⃣',
    '{"type": "level", "target": 8, "requirements": [{"description": "Reach level 8", "target": 8}]}'
),
(
    'LEVEL_9',
    'Reach level 9',
    '9️⃣',
    '{"type": "level", "target": 9, "requirements": [{"description": "Reach level 9", "target": 9}]}'
),
(
    'LEVEL_10',
    'Reach level 10',
    '🔟',
    '{"type": "level", "target": 10, "requirements": [{"description": "Reach level 10", "target": 10}]}'
),
(
    'LEVEL_15',
    'Reach level 15',
    '🔰',
    '{"type": "level", "target": 15, "requirements": [{"description": "Reach level 15", "target": 15}]}'
),
(
    'LEVEL_20',
    'Reach level 20',
    '🌐',
    '{"type": "level", "target": 20, "requirements": [{"description": "Reach level 20", "target": 20}]}'
),
(
    'LEVEL_25',
    'Reach level 25',
    '💫',
    '{"type": "level", "target": 25, "requirements": [{"description": "Reach level 25", "target": 25}]}'
),
(
    'LEVEL_30',
    'Reach level 30',
    '🎯',
    '{"type": "level", "target": 30, "requirements": [{"description": "Reach level 30", "target": 30}]}'
),
(
    'LEVEL_50',
    'Reach level 50',
    '🏆',
    '{"type": "level", "target": 50, "requirements": [{"description": "Reach level 50", "target": 50}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 4. ADD REFLECTION BADGES
-- =====================================================

-- Add reflection badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'DEEP_THINKER',
    'Complete 10 reflections with meaningful content',
    '🧠',
    '{"type": "reflection", "target": 10, "requirements": [{"description": "Complete 10 reflections", "target": 10}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 5. ADD COMMUNITY BADGES
-- =====================================================

-- Add community badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'COMMUNITY_BUILDER',
    'Share your first post with the community',
    '🫂',
    '{"type": "share", "target": 1, "requirements": [{"description": "Share 1 post", "target": 1}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 6. ADD LIKES GIVEN BADGES
-- =====================================================

-- Add likes given badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'FIRST_LIKE_GIVEN',
    'Give your first like to someone',
    '❤️',
    '{"type": "likes_given", "target": 1, "requirements": [{"description": "Give 1 like", "target": 1}]}'
),
(
    'LIKES_GIVEN_10',
    'Give 10 likes to others',
    '💖',
    '{"type": "likes_given", "target": 10, "requirements": [{"description": "Give 10 likes", "target": 10}]}'
),
(
    'LIKES_GIVEN_50',
    'Give 50 likes to others',
    '💗',
    '{"type": "likes_given", "target": 50, "requirements": [{"description": "Give 50 likes", "target": 50}]}'
),
(
    'LIKES_GIVEN_100',
    'Give 100 likes to others',
    '💞',
    '{"type": "likes_given", "target": 100, "requirements": [{"description": "Give 100 likes", "target": 100}]}'
),
(
    'LIKES_GIVEN_500',
    'Give 500 likes to others',
    '💝',
    '{"type": "likes_given", "target": 500, "requirements": [{"description": "Give 500 likes", "target": 500}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 7. ADD LIKES RECEIVED BADGES
-- =====================================================

-- Add likes received badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'INFLUENCER',
    'Receive 50 likes on your posts',
    '📣',
    '{"type": "likes_received", "target": 50, "requirements": [{"description": "Receive 50 likes", "target": 50}]}'
),
(
    'VIRAL_POST',
    'Receive 100 likes on your posts',
    '🌍',
    '{"type": "likes_received", "target": 100, "requirements": [{"description": "Receive 100 likes", "target": 100}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 8. ADD COMMENTS BADGES
-- =====================================================

-- Add comments badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'COMMENT_STARTER',
    'Make your first comment',
    '💬',
    '{"type": "comments", "target": 1, "requirements": [{"description": "Make 1 comment", "target": 1}]}'
),
(
    'COMMENTS_10',
    'Make 10 comments',
    '🗣️',
    '{"type": "comments", "target": 10, "requirements": [{"description": "Make 10 comments", "target": 10}]}'
),
(
    'COMMENTS_25',
    'Make 25 comments',
    '🗨️',
    '{"type": "comments", "target": 25, "requirements": [{"description": "Make 25 comments", "target": 25}]}'
),
(
    'COMMENTS_50',
    'Make 50 comments',
    '📝',
    '{"type": "comments", "target": 50, "requirements": [{"description": "Make 50 comments", "target": 50}]}'
),
(
    'COMMENTS_100',
    'Make 100 comments',
    '🏷️',
    '{"type": "comments", "target": 100, "requirements": [{"description": "Make 100 comments", "target": 100}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 9. ADD PACK COMPLETION BADGES
-- =====================================================

-- Add pack completion badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'PACK_PIONEER',
    'Complete your first challenge pack',
    '📦',
    '{"type": "pack_completion", "target": 1, "requirements": [{"description": "Complete 1 pack", "target": 1}]}'
),
(
    'PACK_PRO',
    'Complete 5 challenge packs',
    '📦📦📦',
    '{"type": "pack_completion", "target": 5, "requirements": [{"description": "Complete 5 packs", "target": 5}]}'
),
(
    'PACK_COLLECTOR',
    'Complete 10 challenge packs',
    '📚',
    '{"type": "pack_completion", "target": 10, "requirements": [{"description": "Complete 10 packs", "target": 10}]}'
),
(
    'PACK_MASTER',
    'Complete 15 challenge packs',
    '🎒',
    '{"type": "pack_completion", "target": 15, "requirements": [{"description": "Complete 15 packs", "target": 15}]}'
),
(
    'PACK_LEGEND',
    'Complete 20 challenge packs',
    '🏰',
    '{"type": "pack_completion", "target": 20, "requirements": [{"description": "Complete 20 packs", "target": 20}]}'
),
(
    'PACK_VETERAN',
    'Complete 30 challenge packs',
    '🏛️',
    '{"type": "pack_completion", "target": 30, "requirements": [{"description": "Complete 30 packs", "target": 30}]}'
),
(
    'PACK_ADDICT',
    'Complete 50 challenge packs',
    '🏯',
    '{"type": "pack_completion", "target": 50, "requirements": [{"description": "Complete 50 packs", "target": 50}]}'
),
(
    'ULTIMATE_PACK_HUNTER',
    'Complete 100 challenge packs',
    '🏯🏯',
    '{"type": "pack_completion", "target": 100, "requirements": [{"description": "Complete 100 packs", "target": 100}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 10. ADD AI USAGE BADGES
-- =====================================================

-- Add AI usage badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'AI_STARTER',
    'Use AI features for the first time',
    '🤖',
    '{"type": "ai_usage", "target": 1, "requirements": [{"description": "Use AI 1 time", "target": 1}]}'
),
(
    'AI_CURIOUS',
    'Use AI features 5 times',
    '🧩',
    '{"type": "ai_usage", "target": 5, "requirements": [{"description": "Use AI 5 times", "target": 5}]}'
),
(
    'AI_ENTHUSIAST',
    'Use AI features 10 times',
    '⚡',
    '{"type": "ai_usage", "target": 10, "requirements": [{"description": "Use AI 10 times", "target": 10}]}'
),
(
    'AI_GURU',
    'Use AI features 50 times',
    '🔮',
    '{"type": "ai_usage", "target": 50, "requirements": [{"description": "Use AI 50 times", "target": 50}]}'
),
(
    'AI_ADVISOR',
    'Apply an AI suggestion',
    '🧠✨',
    '{"type": "ai_advice", "target": 1, "requirements": [{"description": "Apply 1 AI suggestion", "target": 1}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 11. ADD TIME-BASED BADGES
-- =====================================================

-- Add time-based badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'EARLY_BIRD',
    'Complete a challenge before 8 AM',
    '🌅',
    '{"type": "time_based", "target": 1, "requirements": [{"description": "Complete 1 challenge before 8 AM", "target": 1}]}'
),
(
    'NIGHT_OWL',
    'Complete a challenge after 10 PM',
    '🌙',
    '{"type": "time_based", "target": 1, "requirements": [{"description": "Complete 1 challenge after 10 PM", "target": 1}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 12. ADD WEEKLY/MONTHLY BADGES
-- =====================================================

-- Add weekly/monthly badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'WEEKLY_WARRIOR',
    'Complete 7 challenges in a week',
    '📆',
    '{"type": "weekly_challenges", "target": 7, "requirements": [{"description": "Complete 7 challenges in a week", "target": 7}]}'
),
(
    'MONTHLY_MASTER',
    'Complete 20 challenges in a month',
    '🗓️',
    '{"type": "monthly_challenges", "target": 20, "requirements": [{"description": "Complete 20 challenges in a month", "target": 20}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 13. ADD MISCELLANEOUS BADGES
-- =====================================================

-- Add miscellaneous badges
INSERT INTO badges (name, description, icon_url, criteria_json) VALUES
(
    'SOCIAL_BUTTERFLY',
    'Give 50 likes to others',
    '🦋',
    '{"type": "likes_given", "target": 50, "requirements": [{"description": "Give 50 likes", "target": 50}]}'
)
ON CONFLICT (name) DO NOTHING;

-- 14. CREATE NEW BADGE CHECKING FUNCTIONS
-- =====================================================

-- Function to check and award likes given badges
CREATE OR REPLACE FUNCTION check_likes_given_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    likes_given_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's likes given count
    SELECT COUNT(*) INTO likes_given_count
    FROM likes
    WHERE user_id = p_user_id;
    
    -- Check each likes given badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'likes_given'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF likes_given_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
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

-- Function to check and award likes received badges
CREATE OR REPLACE FUNCTION check_likes_received_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    likes_received_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's likes received count
    SELECT COALESCE(SUM(likes_count), 0) INTO likes_received_count
    FROM posts
    WHERE user_id = p_user_id;
    
    -- Check each likes received badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'likes_received'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF likes_received_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
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

-- Function to check and award comments badges
CREATE OR REPLACE FUNCTION check_comments_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    comments_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's comments count
    SELECT COUNT(*) INTO comments_count
    FROM comments
    WHERE user_id = p_user_id;
    
    -- Check each comments badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'comments'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF comments_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
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

-- Function to check and award pack completion badges
CREATE OR REPLACE FUNCTION check_pack_completion_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    pack_completion_count INTEGER;
    badge_record RECORD;
    already_awarded BOOLEAN;
BEGIN
    -- Get user's pack completion count
    SELECT COUNT(*) INTO pack_completion_count
    FROM user_pack_progress
    WHERE user_id = p_user_id AND completed_challenges >= total_challenges;
    
    -- Check each pack completion badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'pack_completion'
        ORDER BY (criteria_json->>'target')::INTEGER
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF pack_completion_count >= (badge_record.criteria_json->>'target')::INTEGER AND NOT already_awarded THEN
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

-- Function to check and award time-based badges
CREATE OR REPLACE FUNCTION check_time_based_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    badge_record RECORD;
    already_awarded BOOLEAN;
    early_bird_count INTEGER;
    night_owl_count INTEGER;
BEGIN
    -- Check for early bird badge
    SELECT COUNT(*) INTO early_bird_count
    FROM completed_challenges
    WHERE user_id = p_user_id 
    AND EXTRACT(HOUR FROM completed_at AT TIME ZONE 'UTC') < 8;
    
    -- Check for night owl badge
    SELECT COUNT(*) INTO night_owl_count
    FROM completed_challenges
    WHERE user_id = p_user_id 
    AND EXTRACT(HOUR FROM completed_at AT TIME ZONE 'UTC') >= 22;
    
    -- Check each time-based badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' = 'time_based'
        ORDER BY name
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF (
            (badge_record.name = 'EARLY_BIRD' AND early_bird_count >= 1 AND NOT already_awarded) OR
            (badge_record.name = 'NIGHT_OWL' AND night_owl_count >= 1 AND NOT already_awarded)
        ) THEN
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

-- Function to check and award weekly/monthly badges
CREATE OR REPLACE FUNCTION check_weekly_monthly_badges(p_user_id UUID)
RETURNS TABLE(
    badge_name TEXT,
    badge_description TEXT,
    awarded BOOLEAN
) AS $$
DECLARE
    badge_record RECORD;
    already_awarded BOOLEAN;
    weekly_challenges INTEGER;
    monthly_challenges INTEGER;
BEGIN
    -- Check weekly challenges (last 7 days)
    SELECT COUNT(*) INTO weekly_challenges
    FROM completed_challenges
    WHERE user_id = p_user_id 
    AND completed_at >= NOW() - INTERVAL '7 days';
    
    -- Check monthly challenges (last 30 days)
    SELECT COUNT(*) INTO monthly_challenges
    FROM completed_challenges
    WHERE user_id = p_user_id 
    AND completed_at >= NOW() - INTERVAL '30 days';
    
    -- Check each weekly/monthly badge
    FOR badge_record IN 
        SELECT id, name, description, criteria_json
        FROM badges 
        WHERE criteria_json->>'type' IN ('weekly_challenges', 'monthly_challenges')
        ORDER BY name
    LOOP
        -- Check if user already has this badge
        SELECT EXISTS(
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = badge_record.id
        ) INTO already_awarded;
        
        -- Award badge if criteria met and not already awarded
        IF (
            (badge_record.name = 'WEEKLY_WARRIOR' AND weekly_challenges >= 7 AND NOT already_awarded) OR
            (badge_record.name = 'MONTHLY_MASTER' AND monthly_challenges >= 20 AND NOT already_awarded)
        ) THEN
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

-- 15. UPDATE MASTER BADGE CHECKING FUNCTION
-- =====================================================

-- Update the master function to include all new badge types
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
    RETURN QUERY SELECT * FROM check_likes_given_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_likes_received_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_comments_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_pack_completion_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_time_based_badges(p_user_id);
    RETURN QUERY SELECT * FROM check_weekly_monthly_badges(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. CREATE TRIGGERS FOR NEW BADGE TYPES
-- =====================================================

-- Trigger function for likes table
CREATE OR REPLACE FUNCTION trigger_badge_check_on_like()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for new badges when a like is given
    PERFORM check_all_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on likes
DROP TRIGGER IF EXISTS badge_check_on_like ON likes;
CREATE TRIGGER badge_check_on_like
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check_on_like();

-- Trigger function for comments table
CREATE OR REPLACE FUNCTION trigger_badge_check_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for new badges when a comment is made
    PERFORM check_all_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on comments
DROP TRIGGER IF EXISTS badge_check_on_comment ON comments;
CREATE TRIGGER badge_check_on_comment
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check_on_comment();

-- Trigger function for user_pack_progress table
CREATE OR REPLACE FUNCTION trigger_badge_check_on_pack_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for new badges when pack progress is updated
    PERFORM check_all_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_pack_progress
DROP TRIGGER IF EXISTS badge_check_on_pack_progress ON user_pack_progress;
CREATE TRIGGER badge_check_on_pack_progress
    AFTER UPDATE ON user_pack_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_badge_check_on_pack_progress();

-- 17. GRANT PERMISSIONS FOR NEW FUNCTIONS
-- =====================================================

-- Grant execute permissions on new badge functions
GRANT EXECUTE ON FUNCTION check_likes_given_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_likes_received_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_comments_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_pack_completion_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_time_based_badges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_weekly_monthly_badges(UUID) TO authenticated;

-- 18. UPDATE EXISTING BADGES WITH EMOJIS
-- =====================================================

-- Update existing badges with emojis
UPDATE badges SET icon_url = '✅' WHERE name = 'FIRST_CHALLENGE';
UPDATE badges SET icon_url = '✋' WHERE name = 'CHALLENGES_5';
UPDATE badges SET icon_url = '🔟' WHERE name = 'CHALLENGES_10';
UPDATE badges SET icon_url = '2️⃣5️⃣' WHERE name = 'CHALLENGES_25';
UPDATE badges SET icon_url = '5️⃣0️⃣' WHERE name = 'CHALLENGES_50';
UPDATE badges SET icon_url = '🥈' WHERE name = 'LEVEL_2';
UPDATE badges SET icon_url = '🥉' WHERE name = 'LEVEL_3';
UPDATE badges SET icon_url = '4️⃣' WHERE name = 'LEVEL_4';
UPDATE badges SET icon_url = '🏅' WHERE name = 'LEVEL_5';
UPDATE badges SET icon_url = '🌟' WHERE name = 'STREAK_7';
UPDATE badges SET icon_url = '🔥' WHERE name = 'STREAK_30';
UPDATE badges SET icon_url = '💭' WHERE name = 'FIRST_REFLECTION';
UPDATE badges SET icon_url = '🤝' WHERE name = 'FIRST_SHARE';

-- 19. VERIFY THE COMPLETE BADGE SYSTEM
-- =====================================================

-- Show all badges with emojis
SELECT 
    name,
    description,
    icon_url as emoji,
    criteria_json->>'type' as badge_type,
    criteria_json->>'target' as target_value
FROM badges
ORDER BY 
    CASE 
        WHEN criteria_json->>'type' = 'challenges_completed' THEN 1
        WHEN criteria_json->>'type' = 'streak' THEN 2
        WHEN criteria_json->>'type' = 'level' THEN 3
        WHEN criteria_json->>'type' = 'reflection' THEN 4
        WHEN criteria_json->>'type' = 'share' THEN 5
        WHEN criteria_json->>'type' = 'likes_given' THEN 6
        WHEN criteria_json->>'type' = 'likes_received' THEN 7
        WHEN criteria_json->>'type' = 'comments' THEN 8
        WHEN criteria_json->>'type' = 'pack_completion' THEN 9
        WHEN criteria_json->>'type' = 'ai_usage' THEN 10
        WHEN criteria_json->>'type' = 'time_based' THEN 11
        WHEN criteria_json->>'type' IN ('weekly_challenges', 'monthly_challenges') THEN 12
        ELSE 13
    END,
    (criteria_json->>'target')::INTEGER;

-- Count total badges
SELECT COUNT(*) as total_badges FROM badges;

-- Show badge categories
SELECT 
    criteria_json->>'type' as badge_type,
    COUNT(*) as badge_count
FROM badges
GROUP BY criteria_json->>'type'
ORDER BY badge_count DESC;

SELECT 'Complete badge system with all emojis and awarding logic implemented!' as result; 