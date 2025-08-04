-- Setup Comprehensive Notifications System
-- This script creates the notifications table and related functions

-- Drop existing notifications table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
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

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create function to get user notifications
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

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification count
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

-- Create triggers to automatically create notifications

-- Trigger function for likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create notification if user likes their own post
    IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO notifications (user_id, type, actor_id, post_id, content)
    SELECT 
        posts.user_id,
        'like',
        NEW.user_id,
        NEW.post_id,
        NULL
    FROM posts 
    WHERE posts.id = NEW.post_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for comments
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create notification if user comments on their own post
    IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO notifications (user_id, type, actor_id, post_id, content)
    SELECT 
        posts.user_id,
        'comment',
        NEW.user_id,
        NEW.post_id,
        NEW.content
    FROM posts 
    WHERE posts.id = NEW.post_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for replies
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create notification if user replies to their own comment
    IF NEW.user_id = (SELECT user_id FROM comments WHERE id = NEW.parent_comment_id) THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, content)
    SELECT 
        comments.user_id,
        'reply',
        NEW.user_id,
        comments.post_id,
        NEW.id,
        NEW.content
    FROM comments 
    WHERE comments.id = NEW.parent_comment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for follows
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create notification if user follows themselves
    IF NEW.follower_id = NEW.following_id THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO notifications (user_id, type, actor_id, content)
    SELECT 
        NEW.following_id,
        'follow',
        NEW.follower_id,
        NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_create_like_notification ON likes;
CREATE TRIGGER trigger_create_like_notification
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION create_like_notification();

DROP TRIGGER IF EXISTS trigger_create_comment_notification ON comments;
CREATE TRIGGER trigger_create_comment_notification
    AFTER INSERT ON comments
    FOR EACH ROW
    WHEN (NEW.parent_comment_id IS NULL)
    EXECUTE FUNCTION create_comment_notification();

DROP TRIGGER IF EXISTS trigger_create_reply_notification ON comments;
CREATE TRIGGER trigger_create_reply_notification
    AFTER INSERT ON comments
    FOR EACH ROW
    WHEN (NEW.parent_comment_id IS NOT NULL)
    EXECUTE FUNCTION create_reply_notification();

DROP TRIGGER IF EXISTS trigger_create_follow_notification ON follows;
CREATE TRIGGER trigger_create_follow_notification
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_notification();

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- Verify the setup
SELECT 'Notifications system created successfully' as result; 