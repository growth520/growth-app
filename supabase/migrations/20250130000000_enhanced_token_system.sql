-- Enhanced Token System Migration
-- Add login tracking and token earning functions

-- Add login tracking columns to user_progress
-- Note: These columns are now created in the user_progress table creation migration
-- No need to add them here since they're already included in the table definition

-- Function to award tokens to users
CREATE OR REPLACE FUNCTION award_tokens(
    p_user_id UUID,
    p_amount INTEGER,
    p_source VARCHAR(100),
    p_description TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert or update user tokens
    INSERT INTO user_tokens (user_id, token_type, balance, total_earned)
    VALUES (p_user_id, 'streak_freeze', p_amount, p_amount)
    ON CONFLICT (user_id, token_type)
    DO UPDATE SET 
        balance = user_tokens.balance + p_amount,
        total_earned = user_tokens.total_earned + p_amount,
        updated_at = timezone('utc'::text, now());

    -- Record transaction
    INSERT INTO token_transactions (user_id, token_type, amount, transaction_type, source, description)
    VALUES (p_user_id, 'streak_freeze', p_amount, 'earned', p_source, p_description);

    -- Update user progress tokens (for quick access)
    UPDATE user_progress 
    SET tokens = COALESCE((SELECT balance FROM user_tokens WHERE user_id = p_user_id AND token_type = 'streak_freeze'), 0)
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize user tokens when a new user signs up
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Initialize token balance to 0 for new users
    INSERT INTO user_tokens (user_id, token_type, balance, total_earned, total_spent)
    VALUES (NEW.user_id, 'streak_freeze', 0, 0, 0)
    ON CONFLICT (user_id, token_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically initialize tokens when user_progress is created
-- Note: This trigger is now created in the comprehensive_fixes migration
-- No need to create it here to avoid conflicts

-- Function to update challenge completion count and check for milestones
CREATE OR REPLACE FUNCTION update_challenge_completion(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Increment challenge count
    UPDATE user_progress 
    SET total_challenges_completed = COALESCE(total_challenges_completed, 0) + 1
    WHERE user_id = p_user_id
    RETURNING total_challenges_completed INTO new_count;

    -- Award milestone token every 10 challenges
    IF new_count % 10 = 0 THEN
        PERFORM award_tokens(
            p_user_id,
            1,
            'milestone',
            new_count || ' challenges completed milestone'
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award daily login bonus
CREATE OR REPLACE FUNCTION check_daily_login_bonus(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    last_login DATE;
    consecutive_days INTEGER;
    today DATE := CURRENT_DATE;
    days_diff INTEGER;
    new_consecutive_days INTEGER;
BEGIN
    -- Get current login data
    SELECT last_login_date, consecutive_login_days 
    INTO last_login, consecutive_days
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Calculate consecutive days
    IF last_login IS NULL THEN
        new_consecutive_days := 1;
    ELSE
        days_diff := today - last_login;
        IF days_diff = 1 THEN
            new_consecutive_days := COALESCE(consecutive_days, 0) + 1;
        ELSIF days_diff = 0 THEN
            new_consecutive_days := COALESCE(consecutive_days, 1); -- Same day
            RETURN FALSE; -- Don't process twice in same day
        ELSE
            new_consecutive_days := 1; -- Streak broken, restart
        END IF;
    END IF;

    -- Update login data
    UPDATE user_progress 
    SET 
        last_login_date = today,
        consecutive_login_days = new_consecutive_days
    WHERE user_id = p_user_id;

    -- Award bonus for 7 consecutive days
    IF new_consecutive_days = 7 THEN
        PERFORM award_tokens(
            p_user_id,
            1,
            'login_bonus',
            '7-day consecutive login bonus'
        );
        
        -- Reset consecutive days counter
        UPDATE user_progress 
        SET consecutive_login_days = 0
        WHERE user_id = p_user_id;
        
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION award_tokens(UUID, INTEGER, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_challenge_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_login_bonus(UUID) TO authenticated; 