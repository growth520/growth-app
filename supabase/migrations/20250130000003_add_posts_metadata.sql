-- Add metadata support to posts table for challenge pack completions

-- Add metadata column to store challenge pack information
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS post_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for post_type queries
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_metadata ON public.posts USING GIN (metadata);

-- Add some sample post types and their meanings:
-- 'general' - Regular community posts
-- 'challenge_completion' - Daily challenge completions  
-- 'challenge_pack_completion' - Challenge pack challenge completions
-- 'level_up' - Level up celebrations
-- 'pack_completion' - Full pack completion celebrations

-- Example metadata structure for challenge_pack_completion:
-- {
--   "pack_id": 1,
--   "pack_title": "Confidence Sprint", 
--   "challenge_index": 0,
--   "challenge_text": "Smile at 3 strangers today"
-- } 