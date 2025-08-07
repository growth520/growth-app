-- =====================================================
-- ADD VIEW TRACKING SYSTEM
-- =====================================================
-- This migration adds view tracking functionality for posts

-- 1. Create RPC function for atomic view increment
CREATE OR REPLACE FUNCTION increment_post_view(post_id uuid, viewer_id uuid)
RETURNS void AS $$
BEGIN
  -- Increment view count only if viewer is not the post author
  UPDATE posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id AND user_id <> viewer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_post_view(uuid, uuid) TO authenticated;

-- 3. Ensure posts table has views_count column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'views_count'
    ) THEN
        ALTER TABLE public.posts ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Update existing posts to have correct views_count
UPDATE public.posts 
SET views_count = COALESCE(views_count, 0)
WHERE views_count IS NULL;

-- 5. Create index for performance on view tracking
CREATE INDEX IF NOT EXISTS idx_posts_views_count ON public.posts(views_count);

-- 6. Verify the setup
SELECT 
    'View tracking system created successfully' as status,
    COUNT(*) as total_posts_with_views
FROM public.posts 
WHERE views_count > 0; 