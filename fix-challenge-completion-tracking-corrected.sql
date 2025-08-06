-- Fix challenge completion tracking (CORRECTED VERSION)
-- This script creates a trigger to automatically update total_challenges_completed
-- and provides a function to calculate challenge counts for the leaderboard

-- 1. Create a function to update total_challenges_completed for a user
CREATE OR REPLACE FUNCTION update_user_challenge_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_progress
  SET total_challenges_completed = (
    SELECT COUNT(*)
    FROM completed_challenges
    WHERE completed_challenges.user_id = update_user_challenge_count.user_id
  )
  WHERE user_progress.user_id = update_user_challenge_count.user_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a trigger function that automatically updates total_challenges_completed
CREATE OR REPLACE FUNCTION update_challenge_completion_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's total_challenges_completed count
  UPDATE user_progress
  SET total_challenges_completed = (
    SELECT COUNT(*)
    FROM completed_challenges
    WHERE completed_challenges.user_id = NEW.user_id
  )
  WHERE user_progress.user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger on the completed_challenges table
DROP TRIGGER IF EXISTS update_challenge_completion_trigger ON completed_challenges;
CREATE TRIGGER update_challenge_completion_trigger
  AFTER INSERT ON completed_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_completion_trigger();

-- 4. Create a function to get leaderboard data with correct challenge counts (FIXED)
CREATE OR REPLACE FUNCTION get_leaderboard_by_challenges(p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  user_id UUID,
  xp INTEGER,
  level INTEGER,
  streak INTEGER,
  challenge_count BIGINT,
  profiles JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    up.xp,
    up.level,
    up.streak,
    COALESCE(cc.challenge_count, 0) as challenge_count,
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'username', p.username,
      'avatar_url', p.avatar_url
    ) as profiles
  FROM user_progress up
  LEFT JOIN profiles p ON p.id = up.user_id
  LEFT JOIN (
    SELECT
      completed_challenges.user_id,  -- Explicitly qualify user_id here
      COUNT(*) as challenge_count
    FROM completed_challenges
    GROUP BY completed_challenges.user_id  -- Explicitly qualify user_id here
  ) cc ON cc.user_id = up.user_id
  WHERE p.has_completed_assessment = true
  ORDER BY cc.challenge_count DESC NULLS LAST, up.xp DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 5. Update existing user_progress records with correct challenge counts
UPDATE user_progress
SET total_challenges_completed = (
  SELECT COUNT(*)
  FROM completed_challenges
  WHERE completed_challenges.user_id = user_progress.user_id
);

-- 6. Create a function to get community stats with correct challenge counts (FIXED TYPE CASTING)
CREATE OR REPLACE FUNCTION get_community_challenge_stats()
RETURNS TABLE (
  total_active_members BIGINT,
  total_xp BIGINT,
  total_completed_challenges BIGINT,
  total_active_streaks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM profiles WHERE has_completed_assessment = true) as total_active_members,
    COALESCE(SUM(up.xp), 0)::BIGINT as total_xp,
    COALESCE(SUM(cc.challenge_count), 0)::BIGINT as total_completed_challenges,
    COUNT(CASE WHEN up.streak > 0 THEN 1 END)::BIGINT as total_active_streaks
  FROM user_progress up
  LEFT JOIN (
    SELECT
      completed_challenges.user_id,  -- Explicitly qualify user_id here
      COUNT(*) as challenge_count
    FROM completed_challenges
    GROUP BY completed_challenges.user_id  -- Explicitly qualify user_id here
  ) cc ON cc.user_id = up.user_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Test the functions
SELECT 'Testing update_user_challenge_count function...' as test;
-- This will update all users' challenge counts
SELECT update_user_challenge_count(user_id) FROM user_progress LIMIT 1;

SELECT 'Testing get_leaderboard_by_challenges function...' as test;
SELECT * FROM get_leaderboard_by_challenges(5, 0);

SELECT 'Testing get_community_challenge_stats function...' as test;
SELECT * FROM get_community_challenge_stats();

SELECT 'Challenge completion tracking fixed!' as result; 