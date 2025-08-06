-- =====================================================
-- FIX STREAK SYSTEM FOR GROWTH APP
-- =====================================================
-- This script adds missing fields to user_progress table and creates
-- the streak update function with proper transaction handling

-- 1. ADD MISSING FIELDS TO USER_PROGRESS TABLE
-- =====================================================

-- Add last_challenge_completed_date if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'last_challenge_completed_date'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN last_challenge_completed_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add longest_streak if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'longest_streak'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN longest_streak INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add streak_freeze_tokens if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' 
        AND column_name = 'streak_freeze_tokens'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN streak_freeze_tokens INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. CREATE INDEXES FOR NEW FIELDS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_progress_last_challenge_completed_date ON public.user_progress(last_challenge_completed_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_longest_streak ON public.user_progress(longest_streak);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak_freeze_tokens ON public.user_progress(streak_freeze_tokens);

-- 3. CREATE THE STREAK UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_streak_on_completion(
    p_user_id UUID,
    p_today_date DATE
)
RETURNS TABLE(
    new_streak INTEGER,
    new_longest_streak INTEGER,
    tokens_used INTEGER,
    message TEXT
) AS $$
DECLARE
    current_streak INTEGER;
    current_longest_streak INTEGER;
    current_tokens INTEGER;
    last_completed_date TIMESTAMP WITH TIME ZONE;
    days_diff INTEGER;
    missed_days INTEGER;
    tokens_to_use INTEGER;
    new_streak_val INTEGER;
    new_longest_streak_val INTEGER;
    tokens_used_val INTEGER;
    result_message TEXT;
BEGIN
    -- Get current user progress data
    SELECT 
        COALESCE(streak, 0),
        COALESCE(longest_streak, 0),
        COALESCE(streak_freeze_tokens, 0),
        last_challenge_completed_date
    INTO 
        current_streak,
        current_longest_streak,
        current_tokens,
        last_completed_date
    FROM public.user_progress 
    WHERE user_id = p_user_id;

    -- If no last completed date, this is the first challenge
    IF last_completed_date IS NULL THEN
        new_streak_val := 1;
        new_longest_streak_val := GREATEST(current_longest_streak, 1);
        tokens_used_val := 0;
        result_message := 'First challenge completed! Streak started.';
    ELSE
        -- Calculate days difference
        days_diff := p_today_date - DATE(last_completed_date);
        
        -- If completed today, do nothing
        IF days_diff = 0 THEN
            new_streak_val := current_streak;
            new_longest_streak_val := current_longest_streak;
            tokens_used_val := 0;
            result_message := 'Challenge already completed today.';
        -- If completed yesterday, increment streak
        ELSIF days_diff = 1 THEN
            new_streak_val := current_streak + 1;
            new_longest_streak_val := GREATEST(current_longest_streak, new_streak_val);
            tokens_used_val := 0;
            result_message := 'Streak continued! +1 day.';
        ELSE
            -- Missed days
            missed_days := days_diff - 1;
            
            -- Check if we can use streak freeze tokens
            IF missed_days <= 2 AND current_tokens >= missed_days THEN
                -- Use streak freeze tokens to maintain streak
                tokens_to_use := missed_days;
                new_streak_val := current_streak + 1; -- Increment after using tokens
                new_longest_streak_val := GREATEST(current_longest_streak, new_streak_val);
                tokens_used_val := tokens_to_use;
                result_message := 'Streak maintained with ' || tokens_to_use || ' streak freeze token(s)!';
            ELSE
                -- Reset streak
                new_streak_val := 1;
                new_longest_streak_val := current_longest_streak;
                tokens_used_val := 0;
                result_message := 'Streak reset. Missed ' || missed_days || ' day(s).';
            END IF;
        END IF;
    END IF;

    -- Update user progress in a single transaction
    UPDATE public.user_progress 
    SET 
        streak = new_streak_val,
        longest_streak = new_longest_streak_val,
        last_challenge_completed_date = p_today_date,
        streak_freeze_tokens = GREATEST(0, current_tokens - tokens_used_val),
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    -- Return results
    RETURN QUERY SELECT 
        new_streak_val,
        new_longest_streak_val,
        tokens_used_val,
        result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE STREAK FREEZE TOKEN FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION use_streak_freeze_token(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_tokens INTEGER;
    current_streak INTEGER;
    last_completed_date TIMESTAMP WITH TIME ZONE;
    days_diff INTEGER;
    missed_days INTEGER;
BEGIN
    -- Get current user data
    SELECT 
        COALESCE(streak_freeze_tokens, 0),
        COALESCE(streak, 0),
        last_challenge_completed_date
    INTO 
        current_tokens,
        current_streak,
        last_completed_date
    FROM public.user_progress 
    WHERE user_id = p_user_id;

    -- Check if streak is at risk
    IF last_completed_date IS NULL OR current_streak = 0 THEN
        RETURN FALSE; -- No streak to protect
    END IF;

    -- Calculate missed days
    days_diff := CURRENT_DATE - DATE(last_completed_date);
    missed_days := GREATEST(0, days_diff - 1);

    -- Check if we can use a token
    IF missed_days > 0 AND missed_days <= 2 AND current_tokens > 0 THEN
        -- Use one token to protect the streak
        UPDATE public.user_progress 
        SET 
            streak_freeze_tokens = current_tokens - 1,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = p_user_id;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE; -- Cannot use token
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE FUNCTION TO AWARD STREAK FREEZE TOKENS
-- =====================================================

CREATE OR REPLACE FUNCTION award_streak_freeze_tokens(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.user_progress 
    SET 
        streak_freeze_tokens = COALESCE(streak_freeze_tokens, 0) + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- =====================================================

-- Update any NULL values with defaults
UPDATE public.user_progress 
SET 
    longest_streak = COALESCE(longest_streak, 0),
    streak_freeze_tokens = COALESCE(streak_freeze_tokens, 0)
WHERE 
    longest_streak IS NULL 
    OR streak_freeze_tokens IS NULL;

-- 7. VERIFY THE FIX
-- =====================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND table_schema = 'public'
AND column_name IN ('streak', 'longest_streak', 'last_challenge_completed_date', 'streak_freeze_tokens')
ORDER BY ordinal_position;

-- Show sample data
SELECT 
    user_id,
    streak,
    longest_streak,
    last_challenge_completed_date,
    streak_freeze_tokens
FROM public.user_progress
LIMIT 5;

SELECT 'Streak system fixed and functions created successfully!' as result; 