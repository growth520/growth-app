-- =====================================================
-- FIX CHALLENGE_PACKS TABLE SCHEMA
-- =====================================================
-- This script adds missing columns to the challenge_packs table
-- that the frontend code expects to exist

-- 1. ADD MISSING COLUMNS TO CHALLENGE_PACKS TABLE
-- =====================================================

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- Add icon column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'icon'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN icon VARCHAR(100) DEFAULT '🎯';
    END IF;
END $$;

-- Add pack_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'pack_type'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN pack_type VARCHAR(50) DEFAULT 'standard';
    END IF;
END $$;

-- Add duration_days column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN duration_days INTEGER DEFAULT 7;
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add sort_order column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_packs' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.challenge_packs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- 2. CREATE INDEXES FOR NEW COLUMNS
-- =====================================================

-- Create index for category column
CREATE INDEX IF NOT EXISTS idx_challenge_packs_category ON public.challenge_packs(category);

-- Create index for icon column
CREATE INDEX IF NOT EXISTS idx_challenge_packs_icon ON public.challenge_packs(icon);

-- Create index for pack_type column
CREATE INDEX IF NOT EXISTS idx_challenge_packs_pack_type ON public.challenge_packs(pack_type);

-- Create index for is_active column
CREATE INDEX IF NOT EXISTS idx_challenge_packs_is_active ON public.challenge_packs(is_active);

-- Create index for sort_order column
CREATE INDEX IF NOT EXISTS idx_challenge_packs_sort_order ON public.challenge_packs(sort_order);

-- 3. UPDATE EXISTING RECORDS WITH DEFAULT VALUES
-- =====================================================

-- Update any NULL values with defaults
UPDATE public.challenge_packs 
SET 
    category = COALESCE(category, 'General'),
    icon = COALESCE(icon, '🎯'),
    pack_type = COALESCE(pack_type, 'standard'),
    duration_days = COALESCE(duration_days, 7),
    is_active = COALESCE(is_active, true),
    sort_order = COALESCE(sort_order, 0)
WHERE 
    category IS NULL 
    OR icon IS NULL 
    OR pack_type IS NULL 
    OR duration_days IS NULL 
    OR is_active IS NULL 
    OR sort_order IS NULL;

-- 4. VERIFY THE FIX
-- =====================================================

-- Check that all required columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'challenge_packs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show current challenge_packs data
SELECT 
    id,
    title,
    description,
    category,
    icon,
    pack_type,
    level_required,
    duration_days,
    is_active,
    sort_order
FROM public.challenge_packs
LIMIT 5;

SELECT 'Challenge packs schema fixed successfully!' as result; 