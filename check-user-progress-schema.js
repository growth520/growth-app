import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProgressSchema() {
  console.log('🔍 Checking user_progress table schema...\n');

  try {
    // Check user_progress table structure
    console.log('1. Checking user_progress table...');
    const { data: userProgress, error: upError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(3);

    if (upError) {
      console.log('❌ user_progress error:', upError.message);
    } else {
      console.log('✅ user_progress found:', userProgress?.length || 0, 'records');
      if (userProgress?.[0]) {
        console.log('   Sample record:', userProgress[0]);
        console.log('   Available fields:', Object.keys(userProgress[0]));
        
        // Check specific fields that should exist
        const expectedFields = [
          'user_id', 'xp', 'level', 'streak', 'total_challenges_completed',
          'current_challenge_id', 'challenge_assigned_at', 'last_viewed_notifications',
          'xp_to_next_level', 'tokens', 'streak_freezes_used', 'last_streak_freeze_date',
          'longest_streak', 'last_challenge_completed_date'
        ];
        
        console.log('\n2. Checking expected fields:');
        expectedFields.forEach(field => {
          const exists = userProgress[0].hasOwnProperty(field);
          const value = userProgress[0][field];
          console.log(`   ${field}: ${exists ? '✅' : '❌'} (value: ${value})`);
        });
      }
    }

    // Check profiles table structure
    console.log('\n3. Checking profiles table...');
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (pError) {
      console.log('❌ profiles error:', pError.message);
    } else {
      console.log('✅ profiles found:', profiles?.length || 0, 'records');
      if (profiles?.[0]) {
        console.log('   Sample record:', profiles[0]);
        console.log('   Available fields:', Object.keys(profiles[0]));
      }
    }

    // Test a query that the progress page would use
    console.log('\n4. Testing progress page query...');
    if (userProgress?.[0]?.user_id) {
      const testUserId = userProgress[0].user_id;
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          xp,
          level,
          streak,
          total_challenges_completed,
          current_challenge_id,
          challenge_assigned_at,
          last_viewed_notifications,
          xp_to_next_level,
          tokens,
          streak_freezes_used,
          last_streak_freeze_date,
          longest_streak,
          last_challenge_completed_date,
          created_at,
          updated_at
        `)
        .eq('user_id', testUserId)
        .single();

      if (progressError) {
        console.log('❌ Progress query error:', progressError.message);
      } else {
        console.log('✅ Progress query successful');
        console.log('   XP:', progressData?.xp);
        console.log('   Level:', progressData?.level);
        console.log('   Streak:', progressData?.streak);
        console.log('   Total Challenges:', progressData?.total_challenges_completed);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserProgressSchema(); 