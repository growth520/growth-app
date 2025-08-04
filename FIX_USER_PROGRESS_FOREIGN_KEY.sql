-- =====================================================
-- FIX USER_PROGRESS FOREIGN KEY - Run this in Supabase SQL Editor
-- =====================================================
-- This ensures the user_progress table has the correct foreign key constraint

-- 1. Drop the existing foreign key constraint if it exists
ALTER TABLE public.user_progress 
DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

-- 2. Add the correct foreign key constraint to auth.users
ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create a simple trigger to create user_progress when profile is created
CREATE OR REPLACE FUNCTION create_user_progress_on_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_progress_on_profile();

-- Success message
SELECT 'User progress foreign key fixed successfully!' as status; 