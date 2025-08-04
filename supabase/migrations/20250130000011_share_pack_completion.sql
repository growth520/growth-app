-- Migration: Share Pack Completion to Community
-- Add function to share completed pack information to community

-- Function to share pack completion to community
CREATE OR REPLACE FUNCTION share_pack_completion(
    p_user_id UUID,
    p_pack_id BIGINT,
    p_visibility VARCHAR(20) DEFAULT 'public'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pack_record RECORD;
    progress_record RECORD;
    post_id UUID;
    result JSONB;
BEGIN
    -- Get pack details
    SELECT 
        cp.id,
        cp.title,
        cp.description
    INTO pack_record
    FROM public.challenge_packs cp
    WHERE cp.id = p_pack_id;
    
    IF pack_record IS NULL THEN
        RAISE EXCEPTION 'Pack not found';
    END IF;
    
    -- Get user's pack progress
    SELECT 
        upp.reflection,
        upp.image_url,
        upp.visibility
    INTO progress_record
    FROM public.user_pack_progress upp
    WHERE upp.user_id = p_user_id 
    AND upp.pack_id = p_pack_id
    AND upp.is_completed = true;
    
    IF progress_record IS NULL THEN
        RAISE EXCEPTION 'Pack completion not found';
    END IF;
    
    -- Update visibility if different
    IF progress_record.visibility != p_visibility THEN
        UPDATE public.user_pack_progress
        SET visibility = p_visibility
        WHERE user_id = p_user_id AND pack_id = p_pack_id;
    END IF;
    
    -- Create community post
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
        'I just completed the ' || pack_record.title || ' Challenge Pack! Here''s what I learned: ' || progress_record.reflection,
        progress_record.image_url,
        'challenge_pack_completion',
        jsonb_build_object(
            'pack_id', p_pack_id,
            'pack_title', pack_record.title,
            'pack_description', pack_record.description,
            'badge_type', 'PACK_COMPLETION',
            'badge_title', pack_record.title || ' Master',
            'badge_emoji', '🏆'
        ),
        p_visibility,
        NOW()
    ) RETURNING id INTO post_id;
    
    -- Return success result
    result := jsonb_build_object(
        'success', true,
        'post_id', post_id,
        'message', 'Pack completion shared to community successfully'
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION share_pack_completion(UUID, BIGINT, VARCHAR) TO authenticated;

-- Create RLS policy for the function
CREATE POLICY "Users can share their own pack completions" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id); 