-- =====================================================
-- CHECK PACK_ID COLUMN TYPES
-- =====================================================

-- Check challenge_packs.id type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'challenge_packs' 
AND column_name = 'id';

-- Check user_pack_progress.pack_id type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_pack_progress' 
AND column_name = 'pack_id';

-- Check user_pack_challenge_progress.pack_id type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_pack_challenge_progress' 
AND column_name = 'pack_id';

-- Check all functions that use pack_id
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%pack_id%'
AND routine_schema = 'public'; 