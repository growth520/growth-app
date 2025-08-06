-- Fix follows table RLS policies
-- This script will enable users to follow each other

-- 1. Enable RLS on follows table if not already enabled
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own follows" ON follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can insert follows" ON follows;
DROP POLICY IF EXISTS "Users can delete follows" ON follows;

-- 3. Create new policies for follows table
-- Policy for viewing follows (users can see who they follow and who follows them)
CREATE POLICY "Users can view follows" ON follows
    FOR SELECT USING (
        auth.uid() = follower_id OR 
        auth.uid() = followed_id
    );

-- Policy for inserting follows (users can follow others)
CREATE POLICY "Users can insert follows" ON follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id AND
        follower_id != followed_id
    );

-- Policy for deleting follows (users can unfollow others)
CREATE POLICY "Users can delete follows" ON follows
    FOR DELETE USING (
        auth.uid() = follower_id
    );

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON follows TO authenticated;

-- 5. Verify the setup
SELECT 'Follows table RLS policies created successfully' as result; 