-- =====================================================
-- FIXED DATABASE SCHEMA FOR GROWTH APP
-- =====================================================
-- This fixes the field mismatches between app code and database schema

-- 1. FIX COMPLETED_CHALLENGES TABLE (add missing photo_url field)
-- =====================================================
ALTER TABLE public.completed_challenges 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 2. FIX POSTS TABLE (add missing fields that app code expects)
-- =====================================================
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

-- 3. FIX PROFILES TABLE (add missing fields that app code references)
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS assessment_results JSONB DEFAULT '{}'::jsonb;

-- 4. CREATE MISSING TABLES THAT APP CODE REFERENCES
-- =====================================================

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type VARCHAR(100),
    badge_name TEXT,
    badge_description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, followed_id)
);

-- Create user_settings table
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

-- Create challenge_packs table
CREATE TABLE IF NOT EXISTS public.challenge_packs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    challenges JSONB DEFAULT '[]'::jsonb,
    level_required INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_pack_progress table
CREATE TABLE IF NOT EXISTS public.user_pack_progress (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    current_challenge_index INTEGER DEFAULT 0,
    completed_challenges INTEGER DEFAULT 0,
    total_challenges INTEGER DEFAULT 0,
    challenge_reflections JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE RLS FOR NEW TABLES
-- =====================================================

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own badges" ON public.user_badges;
CREATE POLICY "Users can manage their own badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own follows" ON public.follows;
CREATE POLICY "Users can manage their own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for challenge_packs
ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read challenge packs" ON public.challenge_packs;
CREATE POLICY "Anyone can read challenge packs" ON public.challenge_packs FOR SELECT USING (true);

-- Enable RLS for user_pack_progress
ALTER TABLE public.user_pack_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own pack progress" ON public.user_pack_progress;
CREATE POLICY "Users can manage their own pack progress" ON public.user_pack_progress FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
CREATE POLICY "Users can manage their own likes" ON public.likes FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
CREATE POLICY "Users can manage their own comments" ON public.comments FOR ALL USING (auth.uid() = user_id);

-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON public.user_badges(badge_type);

-- Indexes for follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON public.follows(followed_id);

-- Indexes for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Indexes for challenge_packs
CREATE INDEX IF NOT EXISTS idx_challenge_packs_level_required ON public.challenge_packs(level_required);

-- Indexes for user_pack_progress
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_user_id ON public.user_pack_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_pack_id ON public.user_pack_progress(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_is_completed ON public.user_pack_progress(is_completed);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id);

-- Indexes for posts (additional fields)
CREATE INDEX IF NOT EXISTS idx_posts_challenge_id ON public.posts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON public.posts(privacy);

-- Indexes for completed_challenges (additional fields)
CREATE INDEX IF NOT EXISTS idx_completed_challenges_category ON public.completed_challenges(category);

-- Indexes for profiles (assessment_results)
CREATE INDEX IF NOT EXISTS idx_profiles_assessment_results ON public.profiles USING GIN (assessment_results);

-- 7. SUMMARY
-- =====================================================
SELECT 
    'Database schema fixed successfully!' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'challenges', 'user_progress', 'completed_challenges', 'posts',
    'user_badges', 'follows', 'user_settings', 'challenge_packs', 'user_pack_progress',
    'likes', 'comments'
); 