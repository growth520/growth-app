-- Migration: Pack Completion Enhancements
-- Add columns for pack completion reflection, image, and visibility

-- Add completion-related columns to user_pack_progress
ALTER TABLE public.user_pack_progress 
ADD COLUMN IF NOT EXISTS reflection TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create index for visibility queries
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_visibility 
ON public.user_pack_progress(visibility);

-- Create index for completed packs
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_completed 
ON public.user_pack_progress(user_id, is_completed, completed_at);

-- Update RLS policies for the new columns
-- (The existing RLS policies should cover these new columns automatically)

-- Function to complete a pack with reflection and community post
CREATE OR REPLACE FUNCTION complete_pack_with_reflection(
    p_user_id UUID,
    p_pack_id BIGINT,
    p_reflection TEXT,
    p_image_url TEXT DEFAULT NULL,
    p_visibility VARCHAR(20) DEFAULT 'public'
)
RETURNS BOOLEAN AS $$
DECLARE
    pack_record RECORD;
    completion_count INTEGER;
    total_challenges INTEGER;
BEGIN
    -- Get pack details
    SELECT * INTO pack_record 
    FROM public.challenge_packs 
    WHERE id = p_pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get total challenges
    total_challenges := jsonb_array_length(pack_record.challenges);
    
    -- Get completed challenges count
    SELECT COUNT(*) INTO completion_count
    FROM public.user_pack_challenge_progress
    WHERE user_id = p_user_id AND pack_id = p_pack_id;
    
    -- Check if all challenges are completed
    IF completion_count < total_challenges THEN
        RAISE EXCEPTION 'Not all challenges completed';
    END IF;
    
    -- Update pack progress with completion details
    UPDATE public.user_pack_progress
    SET 
        is_completed = true,
        completed_at = NOW(),
        reflection = p_reflection,
        image_url = p_image_url,
        visibility = p_visibility,
        completion_percentage = 100,
        updated_at = NOW()
    WHERE user_id = p_user_id AND pack_id = p_pack_id;
    
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
            'I just completed the ' || pack_record.title || ' Challenge Pack! Here''s what I learned: ' || p_reflection,
            p_image_url,
            'challenge_pack_completion',
            jsonb_build_object(
                'pack_id', p_pack_id,
                'pack_title', pack_record.title,
                'total_challenges', total_challenges
            ),
            p_visibility,
            NOW()
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_pack_with_reflection(UUID, BIGINT, TEXT, TEXT, VARCHAR) TO authenticated; 