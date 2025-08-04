-- =====================================================
-- FIX MISSING TABLES AND RELATIONSHIPS (CORRECTED SCHEMA)
-- =====================================================
-- This script creates all missing tables that the app code references
-- Based on the actual database schema from existing migrations

-- 1. CREATE CHALLENGE_PACKS TABLE (if missing) - CORRECTED SCHEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenge_packs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    level_required INT DEFAULT 1,
    challenges JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. CREATE USER_PACK_PROGRESS TABLE (if missing) - CORRECTED SCHEMA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_pack_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id BIGINT REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0,
    current_day INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
);

-- 3. CREATE USER_PACK_CHALLENGE_PROGRESS TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_pack_challenge_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id BIGINT REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    challenge_index INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, pack_id, challenge_index)
);

-- 4. CREATE USER_BADGES TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100),
    badge_name TEXT,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATE FOLLOWS TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, followed_id)
);

-- 6. CREATE USER_SETTINGS TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    theme_preference VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 7. CREATE LIKES TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 8. CREATE COMMENTS TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS challenge_id INTEGER,
ADD COLUMN IF NOT EXISTS challenge_title TEXT,
ADD COLUMN IF NOT EXISTS reflection TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add missing columns to completed_challenges table
ALTER TABLE public.completed_challenges 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS assessment_results JSONB DEFAULT '{}'::jsonb;

-- 10. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Challenge packs indexes
CREATE INDEX IF NOT EXISTS idx_challenge_packs_level_required ON public.challenge_packs(level_required);

-- User pack progress indexes
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_user_id ON public.user_pack_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_pack_id ON public.user_pack_progress(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_challenge_progress_user_pack ON public.user_pack_challenge_progress(user_id, pack_id);

-- User badges indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON public.user_badges(badge_type);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON public.follows(followed_id);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_challenge_id ON public.posts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON public.posts(privacy);

-- Completed challenges indexes
CREATE INDEX IF NOT EXISTS idx_completed_challenges_category ON public.completed_challenges(category);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_assessment_results ON public.profiles USING GIN (assessment_results);

-- 11. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pack_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pack_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 12. CREATE BASIC RLS POLICIES (WITHOUT IF NOT EXISTS)
-- =====================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read challenge packs" ON public.challenge_packs;
DROP POLICY IF EXISTS "Users can manage their own pack progress" ON public.user_pack_progress;
DROP POLICY IF EXISTS "Users can manage their own challenge progress" ON public.user_pack_challenge_progress;
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view follows they're involved in" ON public.follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Challenge packs policies (public read, admin write)
CREATE POLICY "Anyone can read challenge packs" ON public.challenge_packs
    FOR SELECT USING (true);

-- User pack progress policies (user can only see their own)
CREATE POLICY "Users can manage their own pack progress" ON public.user_pack_progress
    FOR ALL USING (auth.uid() = user_id);

-- User pack challenge progress policies (user can only see their own)
CREATE POLICY "Users can manage their own challenge progress" ON public.user_pack_challenge_progress
    FOR ALL USING (auth.uid() = user_id);

-- User badges policies (user can only see their own)
CREATE POLICY "Users can view own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows policies (user can see follows they're involved in)
CREATE POLICY "Users can view follows they're involved in" ON public.follows
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = followed_id);
CREATE POLICY "Users can insert own follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- User settings policies (user can only see their own)
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Likes policies (user can see all likes, but only insert/delete their own)
CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies (user can see all comments, but only insert/update/delete their own)
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 13. INSERT SAMPLE DATA FOR TESTING (CORRECTED SCHEMA)
-- =====================================================

-- Insert a sample challenge pack (using correct schema)
INSERT INTO public.challenge_packs (title, description, level_required, challenges)
VALUES (
    'Mindfulness Starter Pack',
    'Begin your mindfulness journey with these foundational practices',
    1,
    '[
        {"id": 1, "text": "Take 5 deep breaths", "category": "Mindfulness"},
        {"id": 2, "text": "Practice mindful walking for 10 minutes", "category": "Mindfulness"},
        {"id": 3, "text": "Create a quiet space and sit in silence for 5 minutes", "category": "Mindfulness"}
    ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert a sample user pack progress for the current user
INSERT INTO public.user_pack_progress (user_id, pack_id, started_at, is_completed, completion_percentage, current_day)
VALUES (
    '6b18fb7e-5821-4a30-bad7-0d3c6873cc77',
    (SELECT id FROM public.challenge_packs WHERE title = 'Mindfulness Starter Pack' LIMIT 1),
    NOW(),
    false,
    0,
    1
) ON CONFLICT DO NOTHING;

-- 14. VERIFY CREATION
-- =====================================================
-- The following queries will help verify that all tables were created successfully

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'challenge_packs',
    'user_pack_progress', 
    'user_pack_challenge_progress',
    'user_badges',
    'follows',
    'user_settings',
    'likes',
    'comments'
);

-- Check if foreign key relationships exist
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('user_pack_progress', 'user_pack_challenge_progress', 'user_badges', 'follows', 'user_settings', 'likes', 'comments'); 