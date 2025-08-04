-- Check Previous Pack Completions and Award Missing Tokens
-- This script will check for completed packs and award tokens if they're missing

-- First, let's see what packs you've completed
SELECT 
    'Your Completed Packs' as info_type,
    'Pack ID' as pack_id_label,
    'Pack Title' as pack_title_label,
    'Completed Date' as completed_date_label,
    'Tokens Awarded' as tokens_awarded_label;

SELECT 
    upp.pack_id,
    cp.title as pack_title,
    upp.completed_at,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM token_transactions tt 
            WHERE tt.user_id = upp.user_id 
            AND tt.source = 'pack_completion' 
            AND tt.description LIKE '%' || cp.title || '%'
        ) THEN 'YES'
        ELSE 'NO'
    END as tokens_awarded
FROM user_pack_progress upp
JOIN challenge_packs cp ON upp.pack_id = cp.id
WHERE upp.user_id = auth.uid()
AND upp.is_completed = true
ORDER BY upp.completed_at DESC;

-- Check your current token balance
SELECT 
    'Current Token Status' as info_type,
    'Token Balance' as balance_label,
    'Total Earned' as earned_label,
    'Total Spent' as spent_label;

SELECT 
    COALESCE(ut.balance, 0) as current_balance,
    COALESCE(ut.total_earned, 0) as total_earned,
    COALESCE(ut.total_spent, 0) as total_spent
FROM user_tokens ut
WHERE ut.user_id = auth.uid()
AND ut.token_type = 'streak_freeze';

-- Check recent token transactions
SELECT 
    'Recent Token Transactions' as info_type,
    'Amount' as amount_label,
    'Source' as source_label,
    'Description' as description_label,
    'Date' as date_label;

SELECT 
    CASE 
        WHEN tt.amount > 0 THEN '+' || tt.amount
        ELSE tt.amount::text
    END as amount,
    tt.source,
    tt.description,
    tt.created_at
FROM token_transactions tt
WHERE tt.user_id = auth.uid()
AND tt.token_type = 'streak_freeze'
ORDER BY tt.created_at DESC
LIMIT 10;

-- Function to award missing tokens for completed packs
CREATE OR REPLACE FUNCTION award_missing_pack_tokens()
RETURNS TEXT AS $$
DECLARE
    pack_record RECORD;
    tokens_awarded INTEGER := 0;
    total_tokens INTEGER := 0;
BEGIN
    -- Loop through all completed packs that don't have token transactions
    FOR pack_record IN 
        SELECT 
            upp.user_id,
            upp.pack_id,
            cp.title as pack_title,
            upp.completed_at
        FROM user_pack_progress upp
        JOIN challenge_packs cp ON upp.pack_id = cp.id
        WHERE upp.user_id = auth.uid()
        AND upp.is_completed = true
        AND NOT EXISTS (
            SELECT 1 FROM token_transactions tt 
            WHERE tt.user_id = upp.user_id 
            AND tt.source = 'pack_completion' 
            AND tt.description LIKE '%' || cp.title || '%'
        )
    LOOP
        -- Award 2 tokens for this pack completion
        INSERT INTO user_tokens (user_id, token_type, balance, total_earned)
        VALUES (pack_record.user_id, 'streak_freeze', 2, 2)
        ON CONFLICT (user_id, token_type) DO UPDATE SET
            balance = user_tokens.balance + 2,
            total_earned = user_tokens.total_earned + 2,
            updated_at = timezone('utc'::text, now());
            
        -- Record the transaction
        INSERT INTO token_transactions (user_id, token_type, amount, transaction_type, source, description)
        VALUES (pack_record.user_id, 'streak_freeze', 2, 'earned', 'pack_completion', 'Challenge pack completed: ' || pack_record.pack_title || ' (retroactive)');
        
        tokens_awarded := tokens_awarded + 1;
        total_tokens := total_tokens + 2;
    END LOOP;
    
    -- Update user progress tokens (for quick access)
    UPDATE user_progress 
    SET tokens = COALESCE((SELECT balance FROM user_tokens WHERE user_id = auth.uid() AND token_type = 'streak_freeze'), 0)
    WHERE user_id = auth.uid();
    
    RETURN 'Awarded ' || total_tokens || ' tokens for ' || tokens_awarded || ' completed packs';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to run the function
GRANT EXECUTE ON FUNCTION award_missing_pack_tokens() TO authenticated;

-- Check if you have any missing tokens
SELECT 
    'Missing Token Check' as info_type,
    'Completed Packs Without Tokens' as missing_tokens_label;

SELECT 
    COUNT(*) as packs_without_tokens
FROM user_pack_progress upp
JOIN challenge_packs cp ON upp.pack_id = cp.id
WHERE upp.user_id = auth.uid()
AND upp.is_completed = true
AND NOT EXISTS (
    SELECT 1 FROM token_transactions tt 
    WHERE tt.user_id = upp.user_id 
    AND tt.source = 'pack_completion' 
    AND tt.description LIKE '%' || cp.title || '%'
);

-- If you want to award missing tokens, run this:
-- SELECT award_missing_pack_tokens(); 