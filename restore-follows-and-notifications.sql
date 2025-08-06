-- Restore follows and notifications system
-- This will ensure both systems are working properly

-- 1. First, let's check what exists
SELECT 'Checking current state...' as status;

-- 2. Create follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);

-- 3. Create indexes for follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- 4. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reply', 'follow')),
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 6. Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for follows table
DROP POLICY IF EXISTS "Allow view follows" ON follows;
DROP POLICY IF EXISTS "Allow insert follows" ON follows;
DROP POLICY IF EXISTS "Allow delete follows" ON follows;

CREATE POLICY "Allow view follows" ON follows
    FOR SELECT USING (true);

CREATE POLICY "Allow insert follows" ON follows
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        follower_id = auth.uid() AND
        follower_id != followed_id
    );

CREATE POLICY "Allow delete follows" ON follows
    FOR DELETE USING (
        auth.uid() = follower_id
    );

-- 8. Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 10. Grant permissions
GRANT SELECT, INSERT, DELETE ON follows TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;

-- 11. Create the get_user_notifications function
CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    type TEXT,
    actor_id UUID,
    actor_name TEXT,
    actor_avatar TEXT,
    post_id UUID,
    post_title TEXT,
    post_photo TEXT,
    comment_id UUID,
    content TEXT,
    is_read BOOLEAN,
    notification_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.actor_id,
        p.full_name as actor_name,
        p.avatar_url as actor_avatar,
        n.post_id,
        posts.title as post_title,
        posts.photo_url as post_photo,
        n.comment_id,
        n.content,
        n.is_read,
        n.created_at as notification_timestamp
    FROM notifications n
    LEFT JOIN profiles p ON n.actor_id = p.id
    LEFT JOIN posts ON n.post_id = posts.id
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create the mark_notifications_as_read function
CREATE OR REPLACE FUNCTION mark_notifications_as_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create the get_unread_notification_count function
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_val INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_val
    FROM notifications
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    RETURN COALESCE(count_val, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create the follow notification trigger function
DROP FUNCTION IF EXISTS create_follow_notification();

CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create notification if user follows themselves
    IF NEW.follower_id = NEW.followed_id THEN
        RETURN NEW;
    END IF;
    
    -- Create notification for the user being followed
    INSERT INTO notifications (user_id, type, actor_id, content)
    VALUES (
        NEW.followed_id,  -- The user being followed
        'follow',
        NEW.follower_id,  -- The user doing the following
        NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Create the follow notification trigger
DROP TRIGGER IF EXISTS trigger_create_follow_notification ON follows;

CREATE TRIGGER trigger_create_follow_notification
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_notification();

-- 16. Grant function permissions
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- 17. Test the setup by creating a sample notification
DO $$
DECLARE
    sample_user_id UUID;
    sample_actor_id UUID;
BEGIN
    -- Get sample user IDs
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    SELECT id INTO sample_actor_id FROM profiles LIMIT 1 OFFSET 1;
    
    -- Only create test notification if we have users
    IF sample_user_id IS NOT NULL AND sample_actor_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, actor_id, content) 
        VALUES (sample_user_id, 'follow', sample_actor_id, NULL)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Test notification created successfully';
    ELSE
        RAISE NOTICE 'No users found for test notification';
    END IF;
END $$;

-- 18. Verify the setup
SELECT 
    'Follows table count' as check_name,
    COUNT(*) as result
FROM follows;

SELECT 
    'Notifications table count' as check_name,
    COUNT(*) as result
FROM notifications;

SELECT 
    'Follow notifications count' as check_name,
    COUNT(*) as result
FROM notifications
WHERE type = 'follow';

SELECT 'Follows and notifications system restored successfully' as result; 