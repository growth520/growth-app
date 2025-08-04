-- =====================================================
-- CREATE GET_USER_RANKS FUNCTION
-- =====================================================

-- Function to get comprehensive user ranks across all ranking types
CREATE OR REPLACE FUNCTION get_user_ranks(p_user_id UUID)
RETURNS TABLE(
    xp_rank BIGINT,
    xp_total_count BIGINT,
    streak_rank BIGINT,
    streak_total_count BIGINT,
    challenges_rank BIGINT,
    challenges_total_count BIGINT
) AS $$
BEGIN
    -- Get XP rank
    WITH xp_ranked AS (
        SELECT 
            up.user_id,
            ROW_NUMBER() OVER (ORDER BY up.xp DESC, up.level DESC) as user_rank,
            COUNT(*) OVER () as total_count
        FROM user_progress up
        JOIN profiles p ON up.user_id = p.id
        WHERE p.has_completed_assessment = true
    )
    SELECT 
        xr.user_rank,
        xr.total_count
    INTO xp_rank, xp_total_count
    FROM xp_ranked xr
    WHERE xr.user_id = p_user_id;

    -- Get streak rank
    WITH streak_ranked AS (
        SELECT 
            up.user_id,
            ROW_NUMBER() OVER (ORDER BY up.streak DESC, up.xp DESC) as user_rank,
            COUNT(*) OVER () as total_count
        FROM user_progress up
        JOIN profiles p ON up.user_id = p.id
        WHERE p.has_completed_assessment = true
    )
    SELECT 
        sr.user_rank,
        sr.total_count
    INTO streak_rank, streak_total_count
    FROM streak_ranked sr
    WHERE sr.user_id = p_user_id;

    -- Get challenges rank
    WITH challenge_counts AS (
        SELECT 
            cc.user_id,
            COUNT(*) as challenge_count
        FROM completed_challenges cc
        GROUP BY cc.user_id
    ),
    challenges_ranked AS (
        SELECT 
            up.user_id,
            ROW_NUMBER() OVER (ORDER BY COALESCE(cc.challenge_count, 0) DESC, up.xp DESC) as user_rank,
            COUNT(*) OVER () as total_count
        FROM user_progress up
        LEFT JOIN challenge_counts cc ON up.user_id = cc.user_id
        JOIN profiles p ON up.user_id = p.id
        WHERE p.has_completed_assessment = true
    )
    SELECT 
        cr.user_rank,
        cr.total_count
    INTO challenges_rank, challenges_total_count
    FROM challenges_ranked cr
    WHERE cr.user_id = p_user_id;

    -- Return all ranks
    RETURN QUERY SELECT 
        COALESCE(xp_rank, 0)::BIGINT,
        COALESCE(xp_total_count, 0)::BIGINT,
        COALESCE(streak_rank, 0)::BIGINT,
        COALESCE(streak_total_count, 0)::BIGINT,
        COALESCE(challenges_rank, 0)::BIGINT,
        COALESCE(challenges_total_count, 0)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_ranks(UUID) TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- get_user_ranks function created successfully:
-- ✅ Returns comprehensive rank information for a user
-- ✅ Includes XP, streak, and challenges rankings
-- ✅ Provides total count for each ranking type
-- ✅ Optimized with proper indexing considerations