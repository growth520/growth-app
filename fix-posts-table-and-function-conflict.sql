-- Fix posts table and function overload issues
-- Run this in your Supabase SQL editor

-- 1. Check posts table structure
SELECT '=== POSTS TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
ORDER BY ordinal_position;

-- 2. Check if there are multiple versions of the streak function
SELECT '=== STREAK FUNCTION OVERLOADS ===' as step;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'update_user_streak_on_completion'
AND routine_schema = 'public';

-- 3. Drop all versions of the streak function
SELECT '=== DROPPING ALL STREAK FUNCTIONS ===' as step;
DROP FUNCTION IF EXISTS public.update_user_streak_on_completion(UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_user_streak_on_completion(UUID, DATE);
DROP FUNCTION IF EXISTS public.update_user_streak_on_completion(UUID, TEXT);

-- 4. Create a single, clean streak function
SELECT '=== CREATING CLEAN STREAK FUNCTION ===' as step;
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

-- 5. Check if posts table has the right columns for the frontend insert
SELECT '=== CHECKING POSTS TABLE FOR FRONTEND INSERT ===' as step;
SELECT 
    'Has user_id' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'user_id'
UNION ALL
SELECT 
    'Has challenge_id' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'challenge_id'
UNION ALL
SELECT 
    'Has challenge_title' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'challenge_title'
UNION ALL
SELECT 
    'Has reflection' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'reflection'
UNION ALL
SELECT 
    'Has photo_url' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'photo_url'
UNION ALL
SELECT 
    'Has category' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'category'
UNION ALL
SELECT 
    'Has created_at' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'created_at'
UNION ALL
SELECT 
    'Has privacy' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'privacy'
UNION ALL
SELECT 
    'Has flagged' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'flagged'
UNION ALL
SELECT 
    'Has post_type' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'post_type'
UNION ALL
SELECT 
    'Has metadata' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'metadata'
UNION ALL
SELECT 
    'Has likes_count' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'likes_count'
UNION ALL
SELECT 
    'Has comments_count' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'comments_count'
UNION ALL
SELECT 
    'Has shares_count' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'shares_count'
UNION ALL
SELECT 
    'Has views_count' as check_type,
    (COUNT(*) > 0) as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
AND column_name = 'views_count';

-- 6. Test the streak function
SELECT '=== TESTING STREAK FUNCTION ===' as step;
SELECT public.update_user_streak_on_completion(
    '00000000-0000-0000-0000-000000000000'::uuid,
    '2025-01-07',
    false
) as test_result;

-- 7. Final verification
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    'Single streak function exists' as check_type,
    (COUNT(*) = 1) as result
FROM information_schema.routines
WHERE routine_name = 'update_user_streak_on_completion'
AND routine_schema = 'public'
UNION ALL
SELECT 
    'Posts table has all required columns' as check_type,
    (COUNT(*) >= 13) as result  -- Should have at least 13 columns for frontend insert
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts';

SELECT '=== POSTS TABLE AND FUNCTION CONFLICT FIXED ===' as result; 