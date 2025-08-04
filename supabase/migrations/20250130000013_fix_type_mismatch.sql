-- Fixed RPC function for ranked feed that resolves type mismatch issues
CREATE OR REPLACE FUNCTION get_ranked_feed(
  p_user_id uuid DEFAULT NULL,
  p_filter text DEFAULT 'trending',
  p_tab text DEFAULT 'all',
  p_growth_area text DEFAULT 'all',
  p_search_query text DEFAULT '',
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  reflection text,
  photo_url text,
  category text,
  challenge_title text,
  post_type text,
  created_at timestamptz,
  user_id uuid,
  likes_count int,
  comments_count int,
  shares_count int,
  views_count int,
  score numeric,
  profile_id uuid,
  profile_full_name text,
  profile_username text,
  profile_avatar_url text,
  profile_growth_area text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_liked_posts uuid[];
  v_commented_posts uuid[];
  v_following uuid[];
BEGIN
  -- Get user's liked posts
  IF p_tab = 'liked' AND p_user_id IS NOT NULL THEN
    SELECT array_agg(post_id) INTO v_liked_posts
    FROM likes
    WHERE user_id = p_user_id;
    
    IF v_liked_posts IS NULL OR array_length(v_liked_posts, 1) = 0 THEN
      RETURN;
    END IF;
  END IF;

  -- Get user's commented posts
  IF p_tab = 'commented' AND p_user_id IS NOT NULL THEN
    SELECT array_agg(post_id) INTO v_commented_posts
    FROM comments
    WHERE user_id = p_user_id;
    
    IF v_commented_posts IS NULL OR array_length(v_commented_posts, 1) = 0 THEN
      RETURN;
    END IF;
  END IF;

  -- Get user's following list
  IF p_tab = 'friends' AND p_user_id IS NOT NULL THEN
    SELECT array_agg(followed_id) INTO v_following
    FROM follows
    WHERE follower_id = p_user_id;
    
    IF v_following IS NULL OR array_length(v_following, 1) = 0 THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  WITH ranked_posts AS (
    SELECT 
      p.id,
      p.reflection,
      p.photo_url,
      p.category,
      p.challenge_title,
      p.post_type,
      p.created_at,
      p.user_id,
      COALESCE(p.likes_count, 0) as likes_count,
      COALESCE(p.comments_count, 0) as comments_count,
      COALESCE(p.shares_count, 0) as shares_count,
      COALESCE(p.views_count, 0) as views_count,
      -- Calculate score using the specified formula
      (
        (COALESCE(p.likes_count, 0) * 2) + 
        (COALESCE(p.comments_count, 0) * 3) + 
        (COALESCE(p.shares_count, 0) * 4) + 
        (COALESCE(p.views_count, 0) * 0.5) +
        (100 / (1 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600)) -
        (50 * (ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.created_at DESC) - 1))
      ) as score,
      prof.id as profile_id,
      prof.full_name as profile_full_name,
      prof.username as profile_username,
      prof.avatar_url as profile_avatar_url,
      p.category as profile_growth_area
    FROM posts p
    LEFT JOIN profiles prof ON p.user_id = prof.id
    WHERE 
      -- Apply tab filters
      CASE 
        WHEN p_tab = 'liked' THEN p.id = ANY(v_liked_posts)
        WHEN p_tab = 'commented' THEN p.id = ANY(v_commented_posts)
        WHEN p_tab = 'friends' THEN p.user_id = ANY(v_following)
        WHEN p_tab = 'my_posts' THEN p.user_id = p_user_id
        ELSE TRUE
      END
      -- Apply growth area filter
      AND (p_growth_area = 'all' OR p.category = p_growth_area)
      -- Apply search filter
      AND (
        p_search_query = '' OR 
        p.reflection ILIKE '%' || p_search_query || '%' OR
        p.challenge_title ILIKE '%' || p_search_query || '%'
      )
      -- Apply growth like me filter (simplified - use post category)
      AND (
        p_filter != 'growth_like_me' OR 
        (p.category IS NOT NULL AND p.category != '')
      )
  )
  SELECT 
    rp.id,
    rp.reflection,
    rp.photo_url,
    rp.category,
    rp.challenge_title,
    rp.post_type,
    rp.created_at,
    rp.user_id,
    rp.likes_count,
    rp.comments_count,
    rp.shares_count,
    rp.views_count,
    rp.score,
    rp.profile_id,
    rp.profile_full_name,
    rp.profile_username,
    rp.profile_avatar_url,
    rp.profile_growth_area
  FROM ranked_posts rp
  ORDER BY 
    CASE 
      WHEN p_filter = 'trending' THEN rp.score
      WHEN p_filter = 'new' THEN EXTRACT(EPOCH FROM rp.created_at)
      WHEN p_filter = 'most_uplifting' THEN (rp.likes_count + rp.comments_count)
      ELSE rp.score
    END DESC,
    rp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ranked_feed TO authenticated; 