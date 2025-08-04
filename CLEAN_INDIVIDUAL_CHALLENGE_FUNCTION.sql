-- Drop all existing versions of the function completely
DROP FUNCTION IF EXISTS complete_individual_challenge(uuid,bigint,text);
DROP FUNCTION IF EXISTS complete_individual_challenge(uuid,bigint,integer,text,text);
DROP FUNCTION IF EXISTS public.complete_individual_challenge(uuid,bigint,text);

-- Create the function with prefixed parameters to avoid ANY ambiguity
CREATE OR REPLACE FUNCTION complete_individual_challenge(
    p_user_id UUID,
    p_pack_id BIGINT,
    p_reflection TEXT
)
RETURNS JSONB AS $$
DECLARE
    pack_record RECORD;
    progress_record RECORD;
    new_reflections JSONB;
    total_challenges INTEGER;
    completed_count INTEGER;
    result JSONB;
    current_index INTEGER;
BEGIN
    -- Get pack details
    SELECT * INTO pack_record 
    FROM public.challenge_packs 
    WHERE challenge_packs.id = p_pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get total challenges
    total_challenges := jsonb_array_length(pack_record.challenges);
    
    -- Get current progress
    SELECT * INTO progress_record
    FROM public.user_pack_progress
    WHERE user_pack_progress.user_id = p_user_id 
    AND user_pack_progress.pack_id = p_pack_id;
    
    IF progress_record IS NULL THEN
        RAISE EXCEPTION 'Pack progress not found';
    END IF;
    
    -- Get current challenge index from progress
    current_index := COALESCE(progress_record.current_challenge_index, 0);
    
    -- Check if challenge already completed
    IF progress_record.challenge_reflections IS NOT NULL THEN
        FOR i IN 0..jsonb_array_length(progress_record.challenge_reflections)-1 LOOP
            IF (progress_record.challenge_reflections->i->>'challenge_index')::INTEGER = current_index THEN
                RAISE EXCEPTION 'Challenge already completed';
            END IF;
        END LOOP;
    END IF;
    
    -- Create new reflection entry
    new_reflections := COALESCE(progress_record.challenge_reflections, '[]'::jsonb);
    new_reflections := new_reflections || jsonb_build_array(
        jsonb_build_object(
            'challenge_index', current_index,
            'reflection', p_reflection,
            'completed_at', NOW()
        )
    );
    
    -- Calculate completed count
    completed_count := jsonb_array_length(new_reflections);
    
    -- Update progress
    UPDATE public.user_pack_progress
    SET 
        challenge_reflections = new_reflections,
        current_challenge_index = LEAST(completed_count, total_challenges - 1),
        completion_percentage = ROUND((completed_count::DECIMAL / total_challenges::DECIMAL) * 100),
        updated_at = NOW()
    WHERE user_pack_progress.user_id = p_user_id 
    AND user_pack_progress.pack_id = p_pack_id;
    
    -- Also insert into user_pack_challenge_progress for compatibility
    INSERT INTO public.user_pack_challenge_progress (
        user_id,
        pack_id,
        challenge_index,
        completed_at
    ) VALUES (
        p_user_id,
        p_pack_id,
        current_index,
        NOW()
    ) ON CONFLICT (user_id, pack_id, challenge_index) DO NOTHING;
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'completed_count', completed_count,
        'total_challenges', total_challenges,
        'is_pack_complete', completed_count >= total_challenges,
        'completion_percentage', ROUND((completed_count::DECIMAL / total_challenges::DECIMAL) * 100),
        'current_challenge_index', current_index,
        'next_challenge_index', CASE 
            WHEN completed_count >= total_challenges THEN null 
            ELSE completed_count 
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_individual_challenge(UUID, BIGINT, TEXT) TO authenticated;