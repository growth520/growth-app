-- Test script to verify post_views table structure
-- Run this in Supabase SQL Editor to check if the table exists and has correct columns

-- 1. Check if the table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_views' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check table structure
\d public.post_views;

-- 3. Test inserting a sample record
INSERT INTO public.post_views (post_id, viewer_id, view_type, session_id)
VALUES (
    (SELECT id FROM posts LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'test',
    'test-session-123'
);

-- 4. Check if the record was inserted
SELECT * FROM public.post_views ORDER BY viewed_at DESC LIMIT 5;

-- 5. Clean up test data
DELETE FROM public.post_views WHERE session_id = 'test-session-123'; 