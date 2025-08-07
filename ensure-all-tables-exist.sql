-- ENSURE ALL NECESSARY TABLES EXIST FOR GROWTH APP
-- This script creates all missing tables and ensures the app functions properly

-- 1. Create user_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    total_challenges_completed INTEGER DEFAULT 0,
    last_challenge_completed_date DATE,
    longest_streak INTEGER DEFAULT 0,
    streak_freeze_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    has_completed_assessment BOOLEAN DEFAULT FALSE,
    assessment_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create completed_challenges table (from previous script)
CREATE TABLE IF NOT EXISTS public.completed_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    challenge_title TEXT,
    challenge_description TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reflection TEXT,
    xp_earned INTEGER DEFAULT 0,
    pack_id UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    is_extra_challenge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create challenge_packs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.challenge_packs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    level_required INTEGER DEFAULT 1,
    pack_type TEXT DEFAULT 'daily',
    duration_days INTEGER DEFAULT 7,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    challenges JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user_pack_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_pack_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES public.challenge_packs(id) ON DELETE CASCADE,
    completed_challenges INTEGER DEFAULT 0,
    total_challenges INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pack_id)
);

-- 6. Create badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    criteria_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 8. Create follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);

-- 9. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_name TEXT,
    actor_avatar_url TEXT,
    type TEXT NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 12. Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Create user_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_type)
);

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user_id ON public.completed_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_challenge_id ON public.completed_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_user_id ON public.user_pack_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pack_progress_pack_id ON public.user_pack_progress(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);

-- 15. Enable Row Level Security on all tables
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pack_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- 16. Create basic RLS policies (you may need to customize these)
-- User progress policies
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Completed challenges policies
CREATE POLICY "Users can view their own completed challenges" ON public.completed_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own completed challenges" ON public.completed_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own completed challenges" ON public.completed_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Challenge packs policies
CREATE POLICY "Anyone can view challenge packs" ON public.challenge_packs FOR SELECT USING (true);

-- User pack progress policies
CREATE POLICY "Users can view their own pack progress" ON public.user_pack_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own pack progress" ON public.user_pack_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pack progress" ON public.user_pack_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can insert their own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- User tokens policies
CREATE POLICY "Users can view their own tokens" ON public.user_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own tokens" ON public.user_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tokens" ON public.user_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 17. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 18. Create triggers for updated_at on all tables that have it
CREATE TRIGGER trigger_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_completed_challenges_updated_at BEFORE UPDATE ON public.completed_challenges FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_challenge_packs_updated_at BEFORE UPDATE ON public.challenge_packs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_user_pack_progress_updated_at BEFORE UPDATE ON public.user_pack_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_badges_updated_at BEFORE UPDATE ON public.badges FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_user_tokens_updated_at BEFORE UPDATE ON public.user_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 19. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_progress TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.completed_challenges TO authenticated;
GRANT ALL ON public.challenge_packs TO authenticated;
GRANT ALL ON public.user_pack_progress TO authenticated;
GRANT ALL ON public.badges TO authenticated;
GRANT ALL ON public.user_badges TO authenticated;
GRANT ALL ON public.follows TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.likes TO authenticated;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.user_tokens TO authenticated;

-- 20. Verification query
SELECT 'All necessary tables created successfully!' as result; 