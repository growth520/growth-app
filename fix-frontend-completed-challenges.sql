-- FIX FRONTEND COMPLETED_CHALLENGES COLUMNS
-- This script adds missing columns that the frontend code expects

-- 1. Add missing columns that the frontend is trying to insert
DO $$ 
BEGIN
    -- Add photo_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN photo_url TEXT;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN category TEXT;
    END IF;
    
    -- Add challenge_title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'challenge_title'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN challenge_title TEXT;
    END IF;
    
    -- Add challenge_description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'challenge_description'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN challenge_description TEXT;
    END IF;
    
    -- Add xp_earned column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'xp_earned'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN xp_earned INTEGER DEFAULT 0;
    END IF;
    
    -- Add is_extra_challenge column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'is_extra_challenge'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN is_extra_challenge BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'completed_challenges' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.completed_challenges ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'completed_challenges'
ORDER BY ordinal_position;

-- 3. Verification query
SELECT 'Completed challenges table columns fixed successfully!' as result; 