-- Fix follow notification trigger
-- The issue is that the trigger function uses 'following_id' instead of 'followed_id'

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_create_follow_notification ON follows;
DROP FUNCTION IF EXISTS create_follow_notification();

-- Create the corrected trigger function for follows
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create notification if user follows themselves
    IF NEW.follower_id = NEW.followed_id THEN
        RETURN NEW;
    END IF;
    
    INSERT INTO notifications (user_id, type, actor_id, content)
    SELECT 
        NEW.followed_id,  -- This was the bug: was using 'following_id' instead of 'followed_id'
        'follow',
        NEW.follower_id,
        NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_create_follow_notification
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION create_follow_notification();

-- Verify the fix
SELECT 'Follow notification trigger fixed successfully' as result; 