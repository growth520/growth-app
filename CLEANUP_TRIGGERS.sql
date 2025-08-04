-- =====================================================
-- CLEANUP TRIGGERS - Run this in Supabase SQL Editor
-- =====================================================
-- This removes any existing triggers that might be causing conflicts

-- Remove all existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Remove existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_user_progress();

-- Success message
SELECT 'Triggers cleaned up successfully!' as status; 