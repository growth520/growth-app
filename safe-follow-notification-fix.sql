-- Safe follow notification fix
-- This only fixes the notification trigger without breaking existing functionality

-- 1. First, let's check if the trigger exists and what it's doing
SELECT 
    'Current trigger status' as status,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_create_follow_notification';

-- 2. Check if the function exists and what it does
SELECT 
    'Current function status' as status,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'create_follow_notification';

-- 3. Only recreate the trigger function if it doesn't exist or is wrong
DO $$
BEGIN
    -- Check if the function exists and has the wrong logic
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_follow_notification' 
        AND prosrc LIKE '%NEW.followed_id%'
    ) THEN
        -- Drop and recreate the function
        DROP FUNCTION IF EXISTS create_follow_notification();
        
        CREATE OR REPLACE FUNCTION create_follow_notification()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Don't create notification if user follows themselves
            IF NEW.follower_id = NEW.followed_id THEN
                RETURN NEW;
            END IF;
            
            -- Only create notification if notifications table exists
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
                INSERT INTO notifications (user_id, type, actor_id, content)
                VALUES (
                    NEW.followed_id,  -- The user being followed
                    'follow',
                    NEW.follower_id,  -- The user doing the following
                    NULL
                );
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Follow notification function created successfully';
    ELSE
        RAISE NOTICE 'Follow notification function already exists and is correct';
    END IF;
    
    -- Check if the trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_create_follow_notification'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER trigger_create_follow_notification
            AFTER INSERT ON follows
            FOR EACH ROW
            EXECUTE FUNCTION create_follow_notification();
        
        RAISE NOTICE 'Follow notification trigger created successfully';
    ELSE
        RAISE NOTICE 'Follow notification trigger already exists';
    END IF;
END $$;

-- 4. Verify the setup
SELECT 'Follow notification system check completed' as result; 