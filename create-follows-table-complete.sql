-- Complete follows table setup
-- This script creates the follows table from scratch with proper structure and RLS policies

-- 1. Drop existing follows table if it exists
DROP TABLE IF EXISTS follows CASCADE;

-- 2. Create follows table with proper structure
CREATE TABLE follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);

-- 4. Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
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

-- 6. Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON follows TO authenticated;

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follows_updated_at
    BEFORE UPDATE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follows_updated_at();

-- 8. Verify the setup
SELECT 'Follows table created successfully with proper RLS policies' as result; 