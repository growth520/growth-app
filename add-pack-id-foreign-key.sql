-- ADD PACK_ID FOREIGN KEY CONSTRAINT
-- Run this after the challenge_packs table exists

-- Add foreign key constraint to pack_id column
ALTER TABLE public.completed_challenges 
ADD CONSTRAINT fk_completed_challenges_pack_id 
FOREIGN KEY (pack_id) REFERENCES public.challenge_packs(id) ON DELETE CASCADE;

-- Verification query
SELECT 'Pack ID foreign key constraint added successfully!' as result; 