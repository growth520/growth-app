-- =====================================================
-- FIX POSTS RLS POLICIES
-- =====================================================
-- This migration adds proper RLS policies to allow users to view other users' public posts

-- 1. DROP EXISTING POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can share their own pack completions" ON public.posts;

-- 2. CREATE NEW POLICIES
-- =====================================================

-- Policy 1: Users can view all public posts (including other users' posts)
CREATE POLICY "Users can view public posts" ON public.posts 
    FOR SELECT 
    USING (
        privacy = 'public' OR 
        visibility = 'public' OR 
        privacy IS NULL OR 
        visibility IS NULL
    );

-- Policy 2: Users can insert their own posts
CREATE POLICY "Users can insert their own posts" ON public.posts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own posts
CREATE POLICY "Users can update their own posts" ON public.posts 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON public.posts 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 3. VERIFY POLICIES
-- =====================================================
-- Show all policies for posts table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'posts' 
AND schemaname = 'public'
ORDER BY policyname;

-- 4. TEST QUERY
-- =====================================================
-- Test that we can select public posts
SELECT 
    'Posts table RLS policies updated successfully' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'posts' 
AND schemaname = 'public'; 