-- =====================================================
-- FIX LIKES SYSTEM MIGRATION
-- =====================================================
-- This migration fixes the likes system issues including RLS policies and triggers

-- 1. Drop and recreate the likes table with proper structure
DROP TABLE IF EXISTS public.likes CASCADE;

CREATE TABLE public.likes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 2. Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.likes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.likes;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.likes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.likes;

-- 4. Create proper RLS policies
CREATE POLICY "Enable read access for all users" 
ON public.likes FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
ON public.likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" 
ON public.likes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" 
ON public.likes FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at);

-- 6. Create function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts 
        SET likes_count = COALESCE(likes_count, 0) + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers for likes count
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.likes;

CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- 8. Create function to get user's liked posts
CREATE OR REPLACE FUNCTION get_user_liked_posts(p_user_id UUID)
RETURNS TABLE(post_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT l.post_id
    FROM public.likes l
    WHERE l.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO anon;
GRANT EXECUTE ON FUNCTION get_user_liked_posts(UUID) TO authenticated;

-- 10. Ensure posts table has likes_count column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE public.posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 11. Update existing posts to have correct likes_count
UPDATE public.posts 
SET likes_count = COALESCE(
    (SELECT COUNT(*) FROM public.likes WHERE post_id = posts.id), 
    0
)
WHERE likes_count IS NULL OR likes_count = 0; 