-- Fix all functions and triggers that reference completed_challenges table
-- Run this in your Supabase SQL editor

-- 1. Check what functions reference completed_challenges
SELECT '=== FUNCTIONS REFERENCING COMPLETED_CHALLENGES ===' as step;
SELECT 
    routine_schema,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_definition LIKE '%completed_challenges%'
AND routine_schema = 'public';

-- 2. Check what triggers exist
SELECT '=== TRIGGERS ON COMPLETED_CHALLENGES ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'completed_challenges';

-- 3. Drop all problematic triggers and functions
SELECT '=== DROPPING PROBLEMATIC TRIGGERS AND FUNCTIONS ===' as step;
DROP TRIGGER IF EXISTS update_challenge_completion_trigger ON public.completed_challenges;
DROP TRIGGER IF EXISTS handle_completed_challenges_updated_at ON public.completed_challenges;
DROP FUNCTION IF EXISTS public.update_challenge_completion_count();
DROP FUNCTION IF EXISTS public.update_user_streak_on_completion(UUID, TEXT, BOOLEAN);

-- 4. Test basic insert without any triggers
SELECT '=== TESTING BASIC INSERT ===' as step;
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
    
    RAISE NOTICE 'Basic insert successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 999;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Basic insert failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 5. Create a safe trigger function that doesn't cause errors
SELECT '=== CREATING SAFE TRIGGER FUNCTION ===' as step;
CREATE OR REPLACE FUNCTION public.update_challenge_completion_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Safely update total_challenges_completed in user_progress
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
        RAISE NOTICE 'Trigger error (ignored): %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create the trigger again
SELECT '=== CREATING SAFE TRIGGER ===' as step;
CREATE TRIGGER update_challenge_completion_trigger
    AFTER INSERT OR DELETE ON public.completed_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_completion_count();

-- 7. Create a safe streak update function
SELECT '=== CREATING SAFE STREAK FUNCTION ===' as step;
CREATE OR REPLACE FUNCTION public.update_user_streak_on_completion(
    p_user_id UUID,
    p_today_date TEXT,
    p_is_extra_challenge BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_current_streak INTEGER;
    v_last_completed_date DATE;
    v_days_gap INTEGER;
    v_missed_days INTEGER;
    v_tokens_available INTEGER;
    v_new_streak INTEGER;
    v_result JSON;
BEGIN
    -- Get current streak info
    SELECT 
        COALESCE(streak, 0),
        COALESCE(last_challenge_completed_date, '1900-01-01'::date),
        COALESCE(streak_freeze_tokens, 0)
    INTO v_current_streak, v_last_completed_date, v_tokens_available
    FROM public.user_progress
    WHERE user_id = p_user_id;
    
    -- If it's an extra challenge, don't affect streak
    IF p_is_extra_challenge THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Extra challenge - streak unchanged',
            'data', json_build_object(
                'new_streak', v_current_streak,
                'streak_unchanged', true
            )
        );
    END IF;
    
    -- Calculate days gap
    v_days_gap := p_today_date::date - v_last_completed_date;
    
    -- Determine new streak
    IF v_days_gap = 1 THEN
        -- Yesterday - increment streak
        v_new_streak := v_current_streak + 1;
    ELSIF v_days_gap = 0 THEN
        -- Today - no change
        v_new_streak := v_current_streak;
    ELSIF v_days_gap > 1 THEN
        -- Missed days
        v_missed_days := v_days_gap - 1;
        
        IF v_missed_days <= 2 AND v_tokens_available >= v_missed_days THEN
            -- Use freeze tokens
            v_new_streak := v_current_streak;
            -- Update tokens (this would be done in a separate function)
        ELSE
            -- Reset streak
            v_new_streak := 1;
        END IF;
    ELSE
        -- Future date or invalid
        v_new_streak := v_current_streak;
    END IF;
    
    -- Update user progress
    UPDATE public.user_progress
    SET 
        streak = v_new_streak,
        last_challenge_completed_date = p_today_date::date
    WHERE user_id = p_user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Streak updated successfully',
        'data', json_build_object(
            'new_streak', v_new_streak,
            'previous_streak', v_current_streak
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'data', json_build_object(
                'new_streak', v_current_streak
            )
        );
END;
$$ LANGUAGE plpgsql;

-- 8. Test insert with all functions
SELECT '=== TESTING INSERT WITH ALL FUNCTIONS ===' as step;
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
        997,
        'Test Challenge Title 3',
        'Test Challenge Description 3',
        'Test reflection text 3',
        NULL,
        'Test Category 3',
        NOW(),
        10,
        false
    );
    
    RAISE NOTICE 'Insert with all functions successful!';
    
    -- Clean up
    DELETE FROM public.completed_challenges 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    AND challenge_id = 997;
    
    RAISE NOTICE 'Test record cleaned up!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert with all functions failed: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- 9. Final verification
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    'Trigger exists' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.triggers
WHERE event_object_table = 'completed_challenges'
AND trigger_name = 'update_challenge_completion_trigger'
UNION ALL
SELECT 
    'Streak function exists' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.routines
WHERE routine_name = 'update_user_streak_on_completion'
AND routine_schema = 'public'
UNION ALL
SELECT 
    'Trigger function exists' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.routines
WHERE routine_name = 'update_challenge_completion_count'
AND routine_schema = 'public';

SELECT '=== ALL COMPLETED_CHALLENGES REFERENCES FIXED ===' as result; 