-- Add missing column to user_pack_progress table
ALTER TABLE public.user_pack_progress 
ADD COLUMN IF NOT EXISTS current_challenge_index INTEGER DEFAULT 0;

-- Update existing records to have a default value
UPDATE public.user_pack_progress 
SET current_challenge_index = 0 
WHERE current_challenge_index IS NULL; 