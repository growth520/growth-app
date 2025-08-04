const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPackCompletionColumns() {
  try {
    console.log('Adding missing columns to user_pack_progress table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add completion-related columns to user_pack_progress
        ALTER TABLE public.user_pack_progress 
        ADD COLUMN IF NOT EXISTS reflection TEXT,
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public',
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

        -- Create index for visibility queries
        CREATE INDEX IF NOT EXISTS idx_user_pack_progress_visibility 
        ON public.user_pack_progress(visibility);

        -- Create index for completed packs
        CREATE INDEX IF NOT EXISTS idx_user_pack_progress_completed 
        ON public.user_pack_progress(user_id, is_completed, completed_at);
      `
    });

    if (error) {
      console.error('Error running migration:', error);
      return;
    }

    console.log('✅ Successfully added missing columns to user_pack_progress table!');
    console.log('You can now complete challenge packs with final reflections.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPackCompletionColumns(); 