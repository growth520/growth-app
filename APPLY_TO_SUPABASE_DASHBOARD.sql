-- ============================================================================
-- CHALLENGE PACK COMPLETION FUNCTIONS
-- Execute this SQL directly in your Supabase Dashboard -> SQL Editor
-- ============================================================================

-- First, ensure the user_pack_progress table has the challenge_reflections column
ALTER TABLE public.user_pack_progress 
ADD COLUMN IF NOT EXISTS challenge_reflections JSONB DEFAULT '[]'::jsonb;

-- Create index for challenge reflections queries
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_challenge_reflections 
ON public.user_pack_progress USING GIN (challenge_reflections);

-- ============================================================================
-- Function 1: Complete Individual Challenge
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_individual_challenge(
    user_id UUID,
    pack_id BIGINT,
    reflection TEXT
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
    WHERE id = pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get total challenges
    total_challenges := jsonb_array_length(pack_record.challenges);
    
    -- Get current progress
    SELECT * INTO progress_record
    FROM public.user_pack_progress
    WHERE user_pack_progress.user_id = complete_individual_challenge.user_id 
    AND user_pack_progress.pack_id = complete_individual_challenge.pack_id;
    
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
            'reflection', reflection,
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
    WHERE user_pack_progress.user_id = complete_individual_challenge.user_id 
    AND user_pack_progress.pack_id = complete_individual_challenge.pack_id;
    
    -- Also insert into user_pack_challenge_progress for compatibility
    INSERT INTO public.user_pack_challenge_progress (
        user_id,
        pack_id,
        challenge_index,
        completed_at
    ) VALUES (
        complete_individual_challenge.user_id,
        complete_individual_challenge.pack_id,
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

-- ============================================================================
-- Function 2: Complete Pack Challenge (Final Pack Completion)
-- ============================================================================
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
BEGIN
    -- Get pack details
    SELECT * INTO pack_record 
    FROM public.challenge_packs 
    WHERE id = pack_id;
    
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
        RAISE EXCEPTION 'Not all challenges completed. Completed: ' || completed_count || ', Total: ' || total_challenges;
    END IF;
    
    -- Calculate XP to award (challenges * 20)
    xp_to_award := total_challenges * 20;
    
    -- Update pack progress with completion details
    UPDATE public.user_pack_progress
    SET 
        is_completed = true,
        completed_at = NOW(),
        reflection = final_reflection,
        image_url = image_url,
        visibility = visibility,
        completion_percentage = 100,
        updated_at = NOW()
    WHERE user_pack_progress.user_id = complete_pack_challenge.user_id 
    AND user_pack_progress.pack_id = complete_pack_challenge.pack_id;
    
    -- Award XP to user
    SELECT xp INTO current_xp FROM public.user_progress WHERE user_progress.user_id = complete_pack_challenge.user_id;
    
    UPDATE public.user_progress
    SET 
        xp = COALESCE(current_xp, 0) + xp_to_award,
        updated_at = NOW()
    WHERE user_progress.user_id = complete_pack_challenge.user_id;
    
    -- Create community post if visibility is public or friends
    IF visibility IN ('public', 'friends') THEN
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
            'I just completed the ' || pack_record.title || ' Challenge Pack! Here''s what I learned: ' || final_reflection,
            image_url,
            'challenge_pack_completion',
            jsonb_build_object(
                'pack_id', pack_id,
                'pack_title', pack_record.title,
                'total_challenges', total_challenges,
                'xp_awarded', xp_to_award
            ),
            visibility,
            NOW()
        );
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'success', true,
        'pack_title', pack_record.title,
        'total_challenges', total_challenges,
        'xp_awarded', xp_to_award,
        'community_post_created', visibility IN ('public', 'friends')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant Permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION complete_individual_challenge(UUID, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_pack_challenge(UUID, BIGINT, TEXT, TEXT, VARCHAR) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Challenge Pack completion functions created successfully!' as status; 