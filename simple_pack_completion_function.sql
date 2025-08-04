-- Simple Pack Completion Function
-- This version avoids jsonb_agg entirely to prevent GROUP BY issues

-- Drop the existing function
DROP FUNCTION IF EXISTS get_pack_completion_details(uuid, bigint);

-- Create a simple function that builds challenges array manually
CREATE OR REPLACE FUNCTION get_pack_completion_details(
    p_user_id UUID,
    p_pack_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pack_record RECORD;
    progress_record RECORD;
    completion_data JSONB;
    challenges_array JSONB;
    challenge_text TEXT;
    i INTEGER;
    challenge_record RECORD;
BEGIN
    -- Get pack details
    SELECT 
        cp.id,
        cp.title,
        cp.description,
        cp.challenges,
        cp.level_required
    INTO pack_record
    FROM public.challenge_packs cp
    WHERE cp.id = p_pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get user's pack progress
    SELECT 
        upp.id,
        upp.user_id,
        upp.pack_id,
        upp.started_at,
        upp.completed_at,
        upp.is_completed,
        upp.completion_percentage,
        upp.reflection,
        upp.image_url,
        upp.visibility
    INTO progress_record
    FROM public.user_pack_progress upp
    WHERE upp.user_id = p_user_id 
    AND upp.pack_id = p_pack_id;
    
    IF progress_record IS NULL THEN
        RAISE EXCEPTION 'Pack progress not found';
    END IF;
    
    -- Check if pack is completed
    IF NOT progress_record.is_completed THEN
        RAISE EXCEPTION 'Pack is not completed';
    END IF;
    
    -- Build challenges array manually
    challenges_array := '[]'::jsonb;
    
    -- Loop through all challenges in the pack
    FOR i IN 0..(jsonb_array_length(pack_record.challenges) - 1) LOOP
        challenge_text := pack_record.challenges->i;
        
        -- Check if this specific challenge was completed
        SELECT completed_at INTO challenge_record
        FROM public.user_pack_challenge_progress
        WHERE user_id = p_user_id 
        AND pack_id = p_pack_id 
        AND challenge_index = i
        LIMIT 1;
        
        -- Add challenge to array with completion info
        challenges_array := challenges_array || jsonb_build_object(
            'index', i,
            'completed_at', COALESCE(challenge_record.completed_at, progress_record.completed_at),
            'challenge_text', challenge_text
        );
    END LOOP;
    
    -- Build completion data
    completion_data := jsonb_build_object(
        'pack_id', pack_record.id,
        'pack_name', pack_record.title,
        'pack_description', pack_record.description,
        'level_required', pack_record.level_required,
        'badge', jsonb_build_object(
            'type', 'PACK_COMPLETION',
            'title', pack_record.title || ' Master',
            'emoji', '🏆',
            'description', 'Completed the ' || pack_record.title || ' challenge pack'
        ),
        'reflection', progress_record.reflection,
        'image_url', progress_record.image_url,
        'visibility', COALESCE(progress_record.visibility, 'private'),
        'started_at', progress_record.started_at,
        'completed_at', progress_record.completed_at,
        'challenges', challenges_array,
        'total_challenges', jsonb_array_length(pack_record.challenges),
        'completed_challenges_count', jsonb_array_length(challenges_array)
    );
    
    RETURN completion_data;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_pack_completion_details(UUID, BIGINT) TO authenticated;

-- Test the function (uncomment and replace with actual values)
/*
SELECT get_pack_completion_details(
    'your-user-id'::uuid,
    1::bigint
);
*/ 