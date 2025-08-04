-- Apply Pack Completion Features
-- This script combines the migrations for pack completion details and sharing

-- =====================================================
-- 1. PACK COMPLETION DETAILS FUNCTION
-- =====================================================

-- Function to get detailed pack completion information
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
    
    -- Get completed challenges
    SELECT jsonb_agg(
        jsonb_build_object(
            'index', upcp.challenge_index,
            'completed_at', upcp.completed_at,
            'challenge_text', pack_record.challenges->upcp.challenge_index
        )
    ) INTO challenges_array
    FROM public.user_pack_challenge_progress upcp
    WHERE upcp.user_id = p_user_id 
    AND upcp.pack_id = p_pack_id
    ORDER BY upcp.challenge_index;
    
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
        'visibility', progress_record.visibility,
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

-- =====================================================
-- 2. SHARE PACK COMPLETION FUNCTION
-- =====================================================

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

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_user_pack 
ON public.user_pack_progress(user_id, pack_id);

-- Create index for challenge progress lookups
CREATE INDEX IF NOT EXISTS idx_user_pack_challenge_progress_user_pack 
ON public.user_pack_challenge_progress(user_id, pack_id);

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- Create RLS policy for the function
CREATE POLICY "Users can view their own pack completion details" ON public.user_pack_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy for sharing pack completions
CREATE POLICY "Users can share their own pack completions" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ✅ COMPLETION MESSAGE
-- =====================================================

-- All pack completion features have been successfully applied!
-- The following features are now available:
-- 1. get_pack_completion_details() - Fetch detailed pack completion info
-- 2. share_pack_completion() - Share completed packs to community
-- 3. Performance indexes for faster queries
-- 4. RLS policies for security 