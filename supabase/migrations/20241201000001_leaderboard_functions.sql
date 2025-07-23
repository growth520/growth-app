-- =====================================================
-- LEADERBOARD SUPPORT FUNCTIONS
-- =====================================================

-- Function to get leaderboard by challenge count with pagination
CREATE OR REPLACE FUNCTION get_leaderboard_by_challenges(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    user_id UUID,
    xp INTEGER,
    level INTEGER,
    streak INTEGER,
    challenge_count BIGINT,
    profiles JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH challenge_counts AS (
        SELECT 
            cc.user_id,
            COUNT(*) as challenge_count
        FROM completed_challenges cc
        GROUP BY cc.user_id
    ),
    ranked_users AS (
        SELECT 
            up.user_id,
            up.xp,
            up.level,
            up.streak,
            COALESCE(cc.challenge_count, 0) as challenge_count,
            to_jsonb(p.*) as profiles,
            ROW_NUMBER() OVER (ORDER BY COALESCE(cc.challenge_count, 0) DESC, up.xp DESC) as rank
        FROM user_progress up
        LEFT JOIN challenge_counts cc ON up.user_id = cc.user_id
        JOIN profiles p ON up.user_id = p.id
        WHERE p.has_completed_assessment = true
    )
    SELECT 
        ru.user_id,
        ru.xp,
        ru.level,
        ru.streak,
        ru.challenge_count,
        ru.profiles
    FROM ranked_users ru
    ORDER BY ru.rank
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced user rank function (already exists but let's make sure it handles challenges correctly)
CREATE OR REPLACE FUNCTION get_user_leaderboard_rank(p_user_id UUID, p_rank_by TEXT DEFAULT 'xp')
RETURNS TABLE(rank BIGINT, total_count BIGINT) AS $$
BEGIN
    IF p_rank_by = 'xp' THEN
        RETURN QUERY
        WITH ranked_users AS (
            SELECT 
                up.user_id,
                ROW_NUMBER() OVER (ORDER BY up.xp DESC, up.level DESC) as user_rank
            FROM user_progress up
            JOIN profiles p ON up.user_id = p.id
            WHERE p.has_completed_assessment = true
        )
        SELECT 
            ru.user_rank,
            (SELECT COUNT(*) FROM ranked_users)::BIGINT
        FROM ranked_users ru
        WHERE ru.user_id = p_user_id;
        
    ELSIF p_rank_by = 'challenges' THEN
        RETURN QUERY
        WITH challenge_counts AS (
            SELECT 
                cc.user_id,
                COUNT(*) as challenge_count
            FROM completed_challenges cc
            GROUP BY cc.user_id
        ),
        ranked_users AS (
            SELECT 
                up.user_id,
                ROW_NUMBER() OVER (ORDER BY COALESCE(cc.challenge_count, 0) DESC, up.xp DESC) as user_rank
            FROM user_progress up
            LEFT JOIN challenge_counts cc ON up.user_id = cc.user_id
            JOIN profiles p ON up.user_id = p.id
            WHERE p.has_completed_assessment = true
        )
        SELECT 
            ru.user_rank,
            (SELECT COUNT(*) FROM ranked_users)::BIGINT
        FROM ranked_users ru
        WHERE ru.user_id = p_user_id;
        
    ELSE -- streak
        RETURN QUERY
        WITH ranked_users AS (
            SELECT 
                up.user_id,
                ROW_NUMBER() OVER (ORDER BY up.streak DESC, up.xp DESC) as user_rank
            FROM user_progress up
            JOIN profiles p ON up.user_id = p.id
            WHERE p.has_completed_assessment = true
        )
        SELECT 
            ru.user_rank,
            (SELECT COUNT(*) FROM ranked_users)::BIGINT
        FROM ranked_users ru
        WHERE ru.user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performers for homepage/widgets
CREATE OR REPLACE FUNCTION get_top_performers(
    p_rank_by TEXT DEFAULT 'xp',
    p_limit INTEGER DEFAULT 3
)
RETURNS TABLE(
    user_id UUID,
    full_name TEXT,
    username TEXT,
    avatar_url TEXT,
    xp INTEGER,
    level INTEGER,
    streak INTEGER,
    challenge_count BIGINT,
    rank_value BIGINT
) AS $$
BEGIN
    IF p_rank_by = 'challenges' THEN
        RETURN QUERY
        WITH challenge_counts AS (
            SELECT 
                cc.user_id,
                COUNT(*) as challenge_count
            FROM completed_challenges cc
            GROUP BY cc.user_id
        )
        SELECT 
            p.id as user_id,
            p.full_name,
            p.username,
            p.avatar_url,
            up.xp,
            up.level,
            up.streak,
            COALESCE(cc.challenge_count, 0) as challenge_count,
            COALESCE(cc.challenge_count, 0) as rank_value
        FROM profiles p
        JOIN user_progress up ON p.id = up.user_id
        LEFT JOIN challenge_counts cc ON p.id = cc.user_id
        WHERE p.has_completed_assessment = true
        ORDER BY COALESCE(cc.challenge_count, 0) DESC, up.xp DESC
        LIMIT p_limit;
        
    ELSIF p_rank_by = 'streak' THEN
        RETURN QUERY
        SELECT 
            p.id as user_id,
            p.full_name,
            p.username,
            p.avatar_url,
            up.xp,
            up.level,
            up.streak,
            0::BIGINT as challenge_count,
            up.streak::BIGINT as rank_value
        FROM profiles p
        JOIN user_progress up ON p.id = up.user_id
        WHERE p.has_completed_assessment = true
        ORDER BY up.streak DESC, up.xp DESC
        LIMIT p_limit;
        
    ELSE -- xp
        RETURN QUERY
        SELECT 
            p.id as user_id,
            p.full_name,
            p.username,
            p.avatar_url,
            up.xp,
            up.level,
            up.streak,
            0::BIGINT as challenge_count,
            up.xp::BIGINT as rank_value
        FROM profiles p
        JOIN user_progress up ON p.id = up.user_id
        WHERE p.has_completed_assessment = true
        ORDER BY up.xp DESC, up.level DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_leaderboard_by_challenges(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_leaderboard_rank(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performers(TEXT, INTEGER) TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Leaderboard functions created successfully:
-- ✅ get_leaderboard_by_challenges - Paginated challenge-based rankings
-- ✅ Enhanced get_user_leaderboard_rank - User's position in any ranking type
-- ✅ get_top_performers - Top users for widgets and highlights 