-- Optimize Challenges Table for Better Performance
-- Run this in your Supabase SQL Editor

-- 1. Add indexes for faster category filtering
CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_id ON public.challenges(id);

-- 2. Add a composite index for category + id for even faster lookups
CREATE INDEX IF NOT EXISTS idx_challenges_category_id ON public.challenges(category, id);

-- 3. Check current table statistics
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename = 'challenges' 
ORDER BY attname;

-- 4. Analyze the table to update statistics
ANALYZE public.challenges;

-- 5. Show current challenge distribution
SELECT 
  category, 
  COUNT(*) as challenge_count,
  MIN(id) as min_id,
  MAX(id) as max_id
FROM public.challenges 
GROUP BY category 
ORDER BY challenge_count DESC;

-- 6. Test a fast query for a specific category
SELECT COUNT(*) as resilience_count 
FROM public.challenges 
WHERE category = 'Resilience';

-- 7. Show total challenges
SELECT COUNT(*) as total_challenges FROM public.challenges; 