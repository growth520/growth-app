-- =====================================================
-- FIX DATABASE RELATIONSHIPS AND SCHEMA ISSUES
-- =====================================================
-- This script fixes all the relationship and schema issues identified

-- 1. ADD MISSING COLUMNS TO USER_PROGRESS TABLE
-- =====================================================
-- Add last_challenge_completed_date if it doesn't exist
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS last_challenge_completed_date TIMESTAMP WITH TIME ZONE;

-- Add longest_streak if it doesn't exist
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- 2. ADD MISSING COLUMNS TO POSTS TABLE
-- =====================================================
-- Add visibility column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';

-- Add flagged column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;

-- 3. ADD FOREIGN KEY CONSTRAINT FOR POSTS TO PROFILES
-- =====================================================
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_posts_user_id' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts 
        ADD CONSTRAINT fk_posts_user_id 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for posts.user_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for posts.user_id';
    END IF;
END $$;

-- 4. ADD FOREIGN KEY CONSTRAINT FOR COMMENTS TO PROFILES
-- =====================================================
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_comments_user_id' 
        AND table_name = 'comments'
    ) THEN
        ALTER TABLE public.comments 
        ADD CONSTRAINT fk_comments_user_id 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for comments.user_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for comments.user_id';
    END IF;
END $$;

-- 5. ADD FOREIGN KEY CONSTRAINT FOR USER_PACK_PROGRESS
-- =====================================================
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_pack_progress_pack_id' 
        AND table_name = 'user_pack_progress'
    ) THEN
        ALTER TABLE public.user_pack_progress 
        ADD CONSTRAINT fk_user_pack_progress_pack_id 
        FOREIGN KEY (pack_id) REFERENCES public.challenge_packs(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for user_pack_progress.pack_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for user_pack_progress.pack_id';
    END IF;
END $$;

-- 6. ADD FOREIGN KEY CONSTRAINT FOR USER_PACK_CHALLENGE_PROGRESS
-- =====================================================
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_pack_challenge_progress_pack_id' 
        AND table_name = 'user_pack_challenge_progress'
    ) THEN
        ALTER TABLE public.user_pack_challenge_progress 
        ADD CONSTRAINT fk_user_pack_challenge_progress_pack_id 
        FOREIGN KEY (pack_id) REFERENCES public.challenge_packs(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for user_pack_challenge_progress.pack_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for user_pack_challenge_progress.pack_id';
    END IF;
END $$;

-- 7. ADD INDEXES FOR BETTER PERFORMANCE
-- =====================================================
-- Index for posts user_id lookups
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Index for comments user_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Index for user_pack_progress pack_id lookups
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_pack_id ON public.user_pack_progress(pack_id);

-- Index for user_pack_challenge_progress pack_id lookups
CREATE INDEX IF NOT EXISTS idx_user_pack_challenge_progress_pack_id ON public.user_pack_challenge_progress(pack_id);

-- 8. VERIFY ALL TABLES EXIST
-- =====================================================
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
BEGIN
    -- Check for required tables
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'profiles',
            'challenges', 
            'user_progress',
            'completed_challenges',
            'posts',
            'comments',
            'likes',
            'follows',
            'user_settings',
            'user_tokens',
            'token_transactions',
            'challenge_packs',
            'user_pack_progress',
            'user_pack_challenge_progress',
            'user_badges'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All required tables exist';
    END IF;
END $$;

-- 9. VERIFY ALL REQUIRED COLUMNS EXIST
-- =====================================================
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_info RECORD;
BEGIN
    -- Check for required columns in key tables
    FOR col_info IN 
        SELECT 'profiles' as table_name, 'assessment_results' as column_name, 'jsonb' as expected_type
        UNION ALL SELECT 'profiles', 'email', 'text'
        UNION ALL SELECT 'posts', 'challenge_id', 'integer'
        UNION ALL SELECT 'posts', 'challenge_title', 'text'
        UNION ALL SELECT 'posts', 'reflection', 'text'
        UNION ALL SELECT 'posts', 'photo_url', 'text'
        UNION ALL SELECT 'posts', 'category', 'character varying'
        UNION ALL SELECT 'posts', 'post_type', 'character varying'
        UNION ALL SELECT 'posts', 'metadata', 'jsonb'
        UNION ALL SELECT 'completed_challenges', 'photo_url', 'text'
        UNION ALL SELECT 'completed_challenges', 'category', 'character varying'
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = col_info.table_name
            AND column_name = col_info.column_name
        ) THEN
            missing_columns := array_append(missing_columns, col_info.table_name || '.' || col_info.column_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'All required columns exist';
    END IF;
END $$;

-- 10. FINAL VERIFICATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Database schema verification complete!';
    RAISE NOTICE 'All relationship issues should now be resolved.';
    RAISE NOTICE 'The app should be able to use implicit joins without errors.';
END $$; 