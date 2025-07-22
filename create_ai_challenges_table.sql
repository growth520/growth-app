-- Create ai_challenges table
CREATE TABLE public.ai_challenges (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users(id) on delete cascade,
    growth_area text not null,
    challenge_text text not null,
    reflection_id bigint references public.completed_challenges(id), -- changed from uuid to bigint to match completed_challenges
    status text default 'pending' check (status in ('pending', 'active', 'completed', 'skipped')),
    difficulty_level text default 'medium' check (difficulty_level in ('easy', 'medium', 'hard')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    scheduled_for timestamp with time zone -- optional, for scheduling future challenges
);

-- Create index for faster queries
CREATE INDEX idx_ai_challenges_user_id ON public.ai_challenges(user_id);
CREATE INDEX idx_ai_challenges_status ON public.ai_challenges(status);

-- Enable Row Level Security
ALTER TABLE public.ai_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own AI challenges
CREATE POLICY "Users can view own ai_challenges"
    ON public.ai_challenges
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own AI challenges (e.g., marking as completed)
CREATE POLICY "Users can update own ai_challenges"
    ON public.ai_challenges
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Only allow insert through server-side functions (for AI generation)
CREATE POLICY "Server can insert ai_challenges"
    ON public.ai_challenges
    FOR INSERT
    WITH CHECK (true); -- You might want to restrict this based on your server's authentication

-- Users can't delete AI challenges (optional, remove if you want to allow deletion)
CREATE POLICY "Users cannot delete ai_challenges"
    ON public.ai_challenges
    FOR DELETE
    USING (false);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.ai_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.ai_challenges IS 'Stores AI-generated personalized challenges based on user reflections';

-- Sample function to get next AI challenge for a user
CREATE OR REPLACE FUNCTION get_next_ai_challenge(p_user_id uuid)
RETURNS TABLE (
    id bigint,
    growth_area text,
    challenge_text text,
    difficulty_level text,
    scheduled_for timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.growth_area,
        c.challenge_text,
        c.difficulty_level,
        c.scheduled_for
    FROM
        public.ai_challenges c
    WHERE
        c.user_id = p_user_id
        AND c.status = 'pending'
        AND (c.scheduled_for IS NULL OR c.scheduled_for <= now())
    ORDER BY
        c.created_at ASC
    LIMIT 1;
END;
$$; 