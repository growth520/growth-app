import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Check challenge_packs table
    console.log('1. Checking challenge_packs table...');
    const { data: challengePacks, error: cpError } = await supabase
      .from('challenge_packs')
      .select('id, title')
      .limit(1);

    if (cpError) {
      console.log('❌ challenge_packs error:', cpError.message);
    } else {
      console.log('✅ challenge_packs found:', challengePacks?.length || 0, 'records');
      if (challengePacks?.[0]) {
        console.log('   Sample ID:', challengePacks[0].id, '(type:', typeof challengePacks[0].id, ')');
        console.log('   Sample title:', challengePacks[0].title);
      }
    }

    // Check user_pack_progress table
    console.log('\n2. Checking user_pack_progress table...');
    const { data: userPackProgress, error: uppError } = await supabase
      .from('user_pack_progress')
      .select('*')
      .limit(1);

    if (uppError) {
      console.log('❌ user_pack_progress error:', uppError.message);
    } else {
      console.log('✅ user_pack_progress found:', userPackProgress?.length || 0, 'records');
      if (userPackProgress?.[0]) {
        console.log('   Sample record:', userPackProgress[0]);
        console.log('   pack_id type:', typeof userPackProgress[0].pack_id);
        console.log('   pack_id value:', userPackProgress[0].pack_id);
      }
    }

    // Check if we can query with the current approach
    console.log('\n3. Testing current query approach...');
    const { data: testQuery, error: testError } = await supabase
      .from('user_pack_progress')
      .select('id, pack_id, is_completed, started_at, reflection, image_url')
      .limit(1);

    if (testError) {
      console.log('❌ Test query error:', testError.message);
    } else {
      console.log('✅ Test query successful');
      console.log('   Sample data:', testQuery?.[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema(); 