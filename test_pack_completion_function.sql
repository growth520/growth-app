-- Test script to verify the pack completion function is working
-- Run this in your Supabase SQL Editor to test the function

-- First, let's check if the function exists
SELECT 
    proname as function_name,
    proargtypes::regtype[] as parameter_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_pack_completion_details';

-- Check if we have any completed packs
SELECT 
    upp.id,
    upp.user_id,
    upp.pack_id,
    upp.is_completed,
    upp.completed_at,
    cp.title as pack_title
FROM public.user_pack_progress upp
JOIN public.challenge_packs cp ON upp.pack_id = cp.id
WHERE upp.is_completed = true
LIMIT 5;

-- Test the function with a sample user and pack (replace with actual values)
-- You'll need to replace 'your-user-id' and pack_id with actual values from your database
/*
SELECT get_pack_completion_details(
    'your-user-id'::uuid,  -- Replace with actual user ID
    1::bigint              -- Replace with actual pack ID
);
*/

-- Check the structure of the user_pack_progress table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_pack_progress' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the posts table exists (needed for sharing)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
) as posts_table_exists; 