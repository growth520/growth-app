-- Drop and recreate the complete_pack_challenge function with proper column qualification
DROP FUNCTION IF EXISTS complete_pack_challenge(uuid,bigint,text,text,varchar);

-- Create the complete_pack_challenge function with fixed column references
CREATE OR REPLACE FUNCTION complete_pack_challenge(
    p_user_id UUID,
    p_pack_id BIGINT,
    p_final_reflection TEXT,
    p_image_url TEXT DEFAULT NULL,
    p_visibility VARCHAR(20) DEFAULT 'public'
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
    WHERE id = p_pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get current progress
    SELECT * INTO progress_record
    FROM public.user_pack_progress
    WHERE user_pack_progress.user_id = p_user_id 
    AND user_pack_progress.pack_id = p_pack_id;
    
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
        reflection = p_final_reflection,
        image_url = p_image_url,
        visibility = p_visibility,
        completion_percentage = 100,
        updated_at = NOW()
    WHERE user_pack_progress.user_id = p_user_id 
    AND user_pack_progress.pack_id = p_pack_id;
    
    -- Award XP to user
    SELECT user_progress.xp INTO current_xp 
    FROM public.user_progress 
    WHERE user_progress.user_id = p_user_id;
    
    UPDATE public.user_progress
    SET 
        xp = COALESCE(current_xp, 0) + xp_to_award,
        updated_at = NOW()
    WHERE user_progress.user_id = p_user_id;
    
    -- Create community post if visibility is public or friends
    IF p_visibility IN ('public', 'friends') THEN
        INSERT INTO public.posts (
            user_id,
            content,
            photo_url,
            post_type,
            metadata,
            visibility,
            created_at
        ) VALUES (
            p_user_id,
            'I just completed the ' || pack_record.title || ' Challenge Pack! Here''s what I learned: ' || p_final_reflection,
            p_image_url,
            'challenge_pack_completion',
            jsonb_build_object(
                'pack_id', p_pack_id,
                'pack_title', pack_record.title,
                'total_challenges', total_challenges,
                'xp_awarded', xp_to_award
            ),
            p_visibility,
            NOW()
        );
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'pack_title', pack_record.title,
        'total_challenges', total_challenges,
        'xp_awarded', xp_to_award,
        'community_post_created', p_visibility IN ('public', 'friends')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_pack_challenge(UUID, BIGINT, TEXT, TEXT, VARCHAR) TO authenticated; 