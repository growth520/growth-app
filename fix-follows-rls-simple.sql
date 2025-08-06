-- Simple fix for follows table RLS policies
-- This creates very permissive policies to ensure follow functionality works

-- 1. Drop all existing policies
DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can insert follows" ON follows;
DROP POLICY IF EXISTS "Users can delete follows" ON follows;
DROP POLICY IF EXISTS "Users can view their own follows" ON follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can insert follows" ON follows;
DROP POLICY IF EXISTS "Users can delete follows" ON follows;

-- 2. Create simple, permissive policies
-- Allow all authenticated users to view follows
CREATE POLICY "Allow view follows" ON follows
    FOR SELECT USING (true);

-- Allow authenticated users to insert follows (with basic validation)
CREATE POLICY "Allow insert follows" ON follows
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        follower_id = auth.uid() AND
        follower_id != followed_id
    );

-- Allow users to delete their own follows
CREATE POLICY "Allow delete follows" ON follows
    FOR DELETE USING (
        auth.uid() = follower_id
    );

-- 3. Grant permissions
GRANT SELECT, INSERT, DELETE ON follows TO authenticated;

-- 4. Verify the setup
SELECT 'Follows table RLS policies updated with simple policies' as result; 