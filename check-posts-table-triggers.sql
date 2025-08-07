-- Check for triggers on posts table that might reference completed_challenges
-- Run this in your Supabase SQL editor

-- 1. Check all triggers on posts table
SELECT '=== TRIGGERS ON POSTS TABLE ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'posts'
AND event_object_schema = 'public';

-- 2. Check if any functions called by posts triggers reference completed_challenges
SELECT '=== FUNCTIONS CALLED BY POSTS TRIGGERS ===' as step;
SELECT DISTINCT
    t.trigger_name,
    t.action_statement,
    r.routine_name,
    r.routine_definition
FROM information_schema.triggers t
LEFT JOIN information_schema.routines r ON r.routine_name = (
    CASE 
        WHEN t.action_statement LIKE '%EXECUTE FUNCTION%' 
        THEN SUBSTRING(t.action_statement FROM 'EXECUTE FUNCTION ([^(]+)')
        WHEN t.action_statement LIKE '%EXECUTE PROCEDURE%'
        THEN SUBSTRING(t.action_statement FROM 'EXECUTE PROCEDURE ([^(]+)')
        ELSE NULL
    END
)
WHERE t.event_object_table = 'posts'
AND t.event_object_schema = 'public'
AND r.routine_definition LIKE '%completed_challenges%';

-- 3. Check posts table structure
SELECT '=== POSTS TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
ORDER BY ordinal_position;

-- 4. Test a simple insert into posts to see the exact error
SELECT '=== TESTING POSTS INSERT ===' as step;
DO $$
BEGIN
    INSERT INTO public.posts (
        user_id,
        challenge_id,
        challenge_title,
        reflection,
        photo_url,
        category,
        created_at,
        privacy,
        flagged,
        post_type,
        metadata,
        likes_count,
        comments_count,
        shares_count,
        views_count
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        999,
        'Test Challenge Title',
        'Test reflection text',
        NULL,
        'Test Category',
        NOW(),
        'public',
        false,
        'challenge_completion',
        '{"challenge_id": 999, "completion_type": "daily_challenge"}',
        0,
        0,
        0,
        0
    );
    
    RAISE NOTICE 'Posts insert successful!';
    
    -- Clean up
    DELETE FROM public.posts 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 999;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Posts insert failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

SELECT '=== POSTS TABLE DIAGNOSTIC COMPLETE ===' as result; 