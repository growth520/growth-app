-- =====================================================
-- CREATE POST VIEWS TABLE FOR ANALYTICS
-- =====================================================
-- This migration creates a post_views table for detailed view tracking

-- 1. Create post_views table for detailed analytics
CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    view_type TEXT DEFAULT 'scroll' CHECK (view_type IN ('scroll', 'modal', 'direct')),
    session_id TEXT,
    UNIQUE(post_id, viewer_id, session_id)
);

-- 2. Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
CREATE POLICY "Enable read access for all users" 
ON public.post_views FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users only" 
ON public.post_views FOR INSERT 
WITH CHECK (auth.uid() = viewer_id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewer_id ON public.post_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_post_views_post_viewer ON public.post_views(post_id, viewer_id);

-- 5. Update the RPC function to also insert into post_views table
CREATE OR REPLACE FUNCTION increment_post_view(post_id uuid, viewer_id uuid, view_type text DEFAULT 'scroll')
RETURNS void AS $$
BEGIN
  -- Only increment if viewer is not the post author
  IF viewer_id != (SELECT user_id FROM posts WHERE id = post_id) THEN
    -- Insert into post_views table for analytics
    INSERT INTO public.post_views (post_id, viewer_id, view_type, session_id)
    VALUES (post_id, viewer_id, view_type, gen_random_uuid()::text)
    ON CONFLICT (post_id, viewer_id, session_id) DO NOTHING;
    
    -- Update the posts table views_count
    UPDATE posts 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = post_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT SELECT, INSERT ON public.post_views TO authenticated;
GRANT SELECT ON public.post_views TO anon;

-- 7. Verify the setup
SELECT 
    'Post views table created successfully' as status,
    COUNT(*) as total_views
FROM public.post_views; 