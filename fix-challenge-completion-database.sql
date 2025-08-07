-- Fix Challenge Completion Database Issues
-- This script resolves the "column does not exist" errors in ChallengeCompletionPage

-- =====================================================
-- 1. FIX POSTS TABLE
-- =====================================================

-- Add missing columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS challenge_id INTEGER,
ADD COLUMN IF NOT EXISTS challenge_title TEXT,
ADD COLUMN IF NOT EXISTS reflection TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_challenge_id ON public.posts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON public.posts(privacy);

-- Update existing posts to have default values
UPDATE posts 
SET 
  likes_count = COALESCE(likes_count, 0),
  comments_count = COALESCE(comments_count, 0),
  shares_count = COALESCE(shares_count, 0),
  views_count = COALESCE(views_count, 0),
  privacy = COALESCE(privacy, 'public'),
  flagged = COALESCE(flagged, false)
WHERE 
  likes_count IS NULL 
  OR comments_count IS NULL 
  OR shares_count IS NULL 
  OR views_count IS NULL
  OR privacy IS NULL
  OR flagged IS NULL;

-- =====================================================
-- 2. FIX COMPLETED_CHALLENGES TABLE
-- =====================================================

-- Add missing columns to completed_challenges table
ALTER TABLE public.completed_challenges 
ADD COLUMN IF NOT EXISTS challenge_title TEXT,
ADD COLUMN IF NOT EXISTS challenge_description TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_extra_challenge BOOLEAN DEFAULT false;

-- Create indexes for completed_challenges table
CREATE INDEX IF NOT EXISTS idx_completed_challenges_category ON public.completed_challenges(category);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_xp_earned ON public.completed_challenges(xp_earned);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_is_extra ON public.completed_challenges(is_extra_challenge);

-- Update existing completed_challenges to have default values
UPDATE completed_challenges 
SET 
  xp_earned = COALESCE(xp_earned, 10),
  is_extra_challenge = COALESCE(is_extra_challenge, false)
WHERE 
  xp_earned IS NULL 
  OR is_extra_challenge IS NULL;

-- =====================================================
-- 3. FIX USER_PROGRESS TABLE
-- =====================================================

-- Add missing columns to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS total_challenges_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS consecutive_login_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_challenge_completed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_freeze_tokens INTEGER DEFAULT 0;

-- Create indexes for user_progress table
CREATE INDEX IF NOT EXISTS idx_user_progress_total_challenges ON public.user_progress(total_challenges_completed);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_challenge_completed_date ON public.user_progress(last_challenge_completed_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_longest_streak ON public.user_progress(longest_streak);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak_freeze_tokens ON public.user_progress(streak_freeze_tokens);

-- Update existing user_progress to have default values
UPDATE user_progress 
SET 
  total_challenges_completed = COALESCE(total_challenges_completed, 0),
  consecutive_login_days = COALESCE(consecutive_login_days, 0),
  longest_streak = COALESCE(longest_streak, 0),
  streak_freeze_tokens = COALESCE(streak_freeze_tokens, 0)
WHERE 
  total_challenges_completed IS NULL 
  OR consecutive_login_days IS NULL
  OR longest_streak IS NULL
  OR streak_freeze_tokens IS NULL;

-- =====================================================
-- 4. CREATE STREAK SYSTEM FUNCTION
-- =====================================================

-- Create the streak update function
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

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

-- Show posts table structure
SELECT '=== POSTS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show completed_challenges table structure
SELECT '=== COMPLETED_CHALLENGES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'completed_challenges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show user_progress table structure
SELECT '=== USER_PROGRESS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show summary
SELECT 
    'Database fixed successfully!' as status,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM completed_challenges) as total_completed_challenges,
    (SELECT COUNT(*) FROM user_progress) as total_user_progress_records; 