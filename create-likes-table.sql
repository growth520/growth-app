-- =====================================================
-- CREATE LIKES TABLE
-- =====================================================
-- This script creates the likes table to track user likes on posts

-- 1. Create the likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 2. Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DO $$
BEGIN
    -- Policy for users to view likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'likes' 
        AND policyname = 'Users can view likes'
    ) THEN
        CREATE POLICY "Users can view likes" 
        ON public.likes FOR SELECT 
        USING (true);
    END IF;
    
    -- Policy for users to manage their own likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'likes' 
        AND policyname = 'Users can manage their own likes'
    ) THEN
        CREATE POLICY "Users can manage their own likes" 
        ON public.likes FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);

-- 5. Create updated_at trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_likes_updated_at'
    ) THEN
        CREATE TRIGGER handle_likes_updated_at 
            BEFORE UPDATE ON public.likes 
            FOR EACH ROW 
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- 6. Verify the table was created
SELECT 
    'Likes table created successfully' as status,
    COUNT(*) as total_likes
FROM public.likes; 