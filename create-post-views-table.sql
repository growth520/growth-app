-- =====================================================
-- CREATE POST VIEWS TABLE FOR TRACKING LINK CLICKS
-- =====================================================
-- This script creates a table to track when people actually click shared post links

-- =====================================================
-- 1. CREATE POST_VIEWS TABLE
-- =====================================================

-- Create post_views table to track actual link clicks
CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL, -- Can be user_id or 'anonymous' for external visitors
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT, -- Optional: for additional tracking
    user_agent TEXT -- Optional: for additional tracking
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_visitor_id ON public.post_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON public.post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_post_views_post_visitor ON public.post_views(post_id, visitor_id);

-- =====================================================
-- 3. SET UP RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own view records
CREATE POLICY "Users can view their own view records" ON public.post_views
FOR SELECT USING (visitor_id = auth.uid()::text OR visitor_id = 'anonymous');

-- Allow insertion of view records (for tracking)
CREATE POLICY "Allow view tracking" ON public.post_views
FOR INSERT WITH CHECK (true);

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Show table structure
SELECT '=== POST_VIEWS TABLE STRUCTURE ===' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'post_views'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show summary
SELECT
    'Post views table created successfully!' as status,
    (SELECT COUNT(*) FROM post_views) as total_views; 