-- Add missing columns to posts table for ranked feed functionality
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Update existing posts to have default values
UPDATE posts 
SET 
  likes_count = COALESCE(likes_count, 0),
  comments_count = COALESCE(comments_count, 0),
  shares_count = COALESCE(shares_count, 0),
  views_count = COALESCE(views_count, 0)
WHERE 
  likes_count IS NULL 
  OR comments_count IS NULL 
  OR shares_count IS NULL 
  OR views_count IS NULL;

-- Create triggers to automatically update counts when likes/comments are added/removed
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop if they exist first)
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON likes;
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON comments;

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Initialize counts for existing data
UPDATE posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM likes 
  WHERE likes.post_id = posts.id
)
WHERE likes_count = 0;

UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.post_id = posts.id
)
WHERE comments_count = 0; 