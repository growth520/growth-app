-- Check if the trigger is causing the INSERT issue
-- Run this in your Supabase SQL editor

-- 1. Check if the trigger exists and what it does
SELECT '=== TRIGGER CHECK ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'completed_challenges';

-- 2. Check the trigger function
SELECT '=== TRIGGER FUNCTION ===' as step;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_challenge_completion_count'
AND routine_schema = 'public';

-- 3. Temporarily disable the trigger to test
SELECT '=== DISABLING TRIGGER ===' as step;
ALTER TABLE public.completed_challenges DISABLE TRIGGER update_challenge_completion_trigger;

-- 4. Test insert without trigger
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

-- 5. Re-enable the trigger
SELECT '=== RE-ENABLING TRIGGER ===' as step;
ALTER TABLE public.completed_challenges ENABLE TRIGGER update_challenge_completion_trigger;

-- 6. Check if user_progress table has the right structure
SELECT '=== USER_PROGRESS STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_progress'
AND column_name = 'total_challenges_completed'; 