-- =====================================================
-- ENABLE REALTIME FOR POSTS TABLE
-- =====================================================
-- This script enables real-time subscriptions for the posts table

-- Enable real-time for the posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Verify real-time is enabled
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'posts' AND pubname = 'supabase_realtime'; 