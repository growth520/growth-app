-- Drop all existing versions of the pack completion function
DROP FUNCTION IF EXISTS complete_pack_challenge(uuid,bigint,text,text,varchar);
DROP FUNCTION IF EXISTS complete_pack_with_enhanced_logic(uuid,bigint,text,text,varchar);

-- Create the function with exact parameter names matching JavaScript call
CREATE OR REPLACE FUNCTION complete_pack_challenge(
    user_id UUID,
    pack_id BIGINT,
    final_reflection TEXT,
    image_url TEXT DEFAULT NULL,
    visibility VARCHAR(20) DEFAULT 'public'
)
RETURNS JSONB AS $$
DECLARE
    pack_record RECORD;
    progress_record RECORD;
    total_challenges INTEGER;
    completed_count INTEGER;
    xp_to_award INTEGER;
    current_xp INTEGER;
    result JSONB;
    error_message TEXT;
BEGIN
    -- Get pack details
    SELECT * INTO pack_record 
    FROM public.challenge_packs 
    WHERE challenge_packs.id = pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get current progress
    SELECT * INTO progress_record
    FROM public.user_pack_progress
    WHERE user_pack_progress.user_id = complete_pack_challenge.user_id 
    AND user_pack_progress.pack_id = complete_pack_challenge.pack_id;
    
    IF progress_record IS NULL THEN
        RAISE EXCEPTION 'Pack progress not found';
    END IF;
    
    -- Calculate totals
    total_challenges := jsonb_array_length(pack_record.challenges);
    completed_count := COALESCE(jsonb_array_length(progress_record.challenge_reflections), 0);
    
    -- Check if all challenges are completed
    IF completed_count < total_challenges THEN
        error_message := format('Not all challenges completed. Completed: %s, Total: %s', completed_count, total_challenges);
        RAISE EXCEPTION '%', error_message;
    END IF;
    
    -- Calculate XP to award (challenges * 20)
    xp_to_award := total_challenges * 20;
    
    -- Update pack progress with completion details
    UPDATE public.user_pack_progress
    SET 
        is_completed = true,
        completed_at = NOW(),
        reflection = complete_pack_challenge.final_reflection,
        image_url = complete_pack_challenge.image_url,
        visibility = complete_pack_challenge.visibility,
        completion_percentage = 100,
        updated_at = NOW()
    WHERE user_pack_progress.user_id = complete_pack_challenge.user_id 
    AND user_pack_progress.pack_id = complete_pack_challenge.pack_id;
    
    -- Award XP to user
    SELECT user_progress.xp INTO current_xp 
    FROM public.user_progress 
    WHERE user_progress.user_id = complete_pack_challenge.user_id;
    
    UPDATE public.user_progress
    SET 
        xp = COALESCE(current_xp, 0) + xp_to_award,
        updated_at = NOW()
    WHERE user_progress.user_id = complete_pack_challenge.user_id;
    
    -- Create community post if visibility is public or friends
    IF complete_pack_challenge.visibility IN ('public', 'friends') THEN
        INSERT INTO public.posts (
            user_id,
            content,
            photo_url,
            post_type,
            metadata,
            visibility,
            created_at
        ) VALUES (
            complete_pack_challenge.user_id,
            'I just completed the ' || pack_record.title || ' Challenge Pack! Here''s what I learned: ' || complete_pack_challenge.final_reflection,
            complete_pack_challenge.image_url,
            'challenge_pack_completion',
            jsonb_build_object(
                'pack_id', complete_pack_challenge.pack_id,
                'pack_title', pack_record.title,
                'total_challenges', total_challenges,
                'xp_awarded', xp_to_award
            ),
            complete_pack_challenge.visibility,
            NOW()
        );
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'pack_title', pack_record.title,
        'total_challenges', total_challenges,
        'xp_awarded', xp_to_award,
        'community_post_created', complete_pack_challenge.visibility IN ('public', 'friends')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_pack_challenge(UUID, BIGINT, TEXT, TEXT, VARCHAR) TO authenticated; 