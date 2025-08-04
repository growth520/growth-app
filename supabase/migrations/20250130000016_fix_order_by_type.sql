-- Fixed RPC function for ranked feed - resolves ORDER BY type mismatch
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
BEGIN
  RETURN QUERY
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
    -- Simple score calculation
    (
      (COALESCE(p.likes_count, 0) * 2) + 
      (COALESCE(p.comments_count, 0) * 3) + 
      (COALESCE(p.shares_count, 0) * 4) + 
      (COALESCE(p.views_count, 0) * 0.5) +
      (100 / (1 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600))
    ) as score,
    prof.id as profile_id,
    prof.full_name as profile_full_name,
    prof.username as profile_username,
    prof.avatar_url as profile_avatar_url,
    p.category as profile_growth_area
  FROM posts p
  LEFT JOIN profiles prof ON p.user_id = prof.id
  WHERE 
    -- Basic tab filtering
    CASE 
      WHEN p_tab = 'my_posts' AND p_user_id IS NOT NULL THEN p.user_id = p_user_id
      ELSE TRUE
    END
    -- Growth area filter
    AND (p_growth_area = 'all' OR p.category = p_growth_area)
    -- Search filter
    AND (
      p_search_query = '' OR 
      p.reflection ILIKE '%' || p_search_query || '%' OR
      p.challenge_title ILIKE '%' || p_search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN p_filter = 'trending' THEN (
        (COALESCE(p.likes_count, 0) * 2) + 
        (COALESCE(p.comments_count, 0) * 3) + 
        (COALESCE(p.shares_count, 0) * 4) + 
        (COALESCE(p.views_count, 0) * 0.5) +
        (100 / (1 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600))
      )
      WHEN p_filter = 'new' THEN p.created_at::timestamp
      WHEN p_filter = 'most_uplifting' THEN (COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0))
      ELSE (
        (COALESCE(p.likes_count, 0) * 2) + 
        (COALESCE(p.comments_count, 0) * 3) + 
        (COALESCE(p.shares_count, 0) * 4) + 
        (COALESCE(p.views_count, 0) * 0.5) +
        (100 / (1 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600))
      )
    END DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ranked_feed TO authenticated; 