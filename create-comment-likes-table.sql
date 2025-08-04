-- =====================================================
-- CREATE COMMENT LIKES TABLE
-- =====================================================
-- This script creates the comment_likes table to track user likes on comments

-- 1. Create the comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, comment_id)
);

-- 2. Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DO $$
BEGIN
    -- Policy for users to view comment likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Users can view comment likes'
    ) THEN
        CREATE POLICY "Users can view comment likes" 
        ON public.comment_likes FOR SELECT 
        USING (true);
    END IF;
    
    -- Policy for users to manage their own comment likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Users can manage their own comment likes'
    ) THEN
        CREATE POLICY "Users can manage their own comment likes" 
        ON public.comment_likes FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_comment ON public.comment_likes(user_id, comment_id);

-- 5. Create updated_at trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_comment_likes_updated_at'
    ) THEN
        CREATE TRIGGER handle_comment_likes_updated_at 
            BEFORE UPDATE ON public.comment_likes 
            FOR EACH ROW 
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 6. Add likes_count column to comments table if it doesn't exist
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 7. Verify the table was created
SELECT 
    'Comment likes table created successfully' as status,
    COUNT(*) as total_comment_likes
FROM public.comment_likes; 