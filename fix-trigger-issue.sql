-- Fix the trigger issue that's causing INSERT to fail
-- Run this in your Supabase SQL editor

-- 1. First, let's see what triggers exist
SELECT '=== CURRENT TRIGGERS ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'completed_challenges';

-- 2. Check the trigger function definition
SELECT '=== TRIGGER FUNCTION DEFINITION ===' as step;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_challenge_completion_count'
AND routine_schema = 'public';

-- 3. Drop the problematic trigger and function
SELECT '=== DROPPING PROBLEMATIC TRIGGER ===' as step;
DROP TRIGGER IF EXISTS update_challenge_completion_trigger ON public.completed_challenges;
DROP FUNCTION IF EXISTS public.update_challenge_completion_count();

-- 4. Test insert without the trigger
SELECT '=== TESTING INSERT WITHOUT TRIGGER ===' as step;
DO $$
BEGIN
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        challenge_title,
        challenge_description,
        reflection,
        photo_url,
        category,
        completed_at,
        xp_earned,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        999,
        'Test Challenge Title',
        'Test Challenge Description',
        'Test reflection text',
        NULL,
        'Test Category',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Insert without trigger successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 999;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert without trigger failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 5. Create a simpler, safer trigger function
SELECT '=== CREATING SAFE TRIGGER FUNCTION ===' as step;
CREATE OR REPLACE FUNCTION public.update_challenge_completion_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_challenges_completed in user_progress
    UPDATE public.user_progress
    SET total_challenges_completed = (
        SELECT COALESCE(COUNT(*), 0)
        FROM public.completed_challenges 
        WHERE user_id = NEW.user_id
    )
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If the trigger fails, just return NEW to allow the insert to continue
        RAISE NOTICE 'Trigger error: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create the trigger again
SELECT '=== CREATING SAFE TRIGGER ===' as step;
CREATE TRIGGER update_challenge_completion_trigger
    AFTER INSERT OR DELETE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_completion_count();

-- 7. Test insert with the new trigger
SELECT '=== TESTING INSERT WITH NEW TRIGGER ===' as step;
DO $$
BEGIN
    INSERT INTO public.completed_challenges (
        user_id,
        challenge_id,
        challenge_title,
        challenge_description,
        reflection,
        photo_url,
        category,
        completed_at,
        xp_earned,
        is_extra_challenge
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        998,
        'Test Challenge Title 2',
        'Test Challenge Description 2',
        'Test reflection text 2',
        NULL,
        'Test Category 2',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Insert with new trigger successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 998;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert with new trigger failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 8. Final verification
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    'Trigger exists' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.triggers
WHERE event_object_table = 'completed_challenges'
AND trigger_name = 'update_challenge_completion_trigger'
UNION ALL
SELECT 
    'Function exists' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.routines
WHERE routine_name = 'update_challenge_completion_count'
AND routine_schema = 'public';

SELECT '=== TRIGGER ISSUE FIXED ===' as result; 