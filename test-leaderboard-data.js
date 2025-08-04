import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeaderboardData() {
  console.log('🔍 Testing Leaderboard Data...\n');

  try {
    // Test 1: Check user_progress table directly
    console.log('1. Checking user_progress table...');
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*');

    if (progressError) {
      console.error('❌ Error:', progressError);
    } else {
      console.log(`✅ Found ${progressData.length} user_progress records`);
      console.log('📊 Data:', progressData);
    }

    // Test 2: Check profiles with completed assessment
    console.log('\n2. Checking profiles with completed assessment...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username, has_completed_assessment')
      .eq('has_completed_assessment', true);

    if (profilesError) {
      console.error('❌ Error:', profilesError);
    } else {
      console.log(`✅ Found ${profilesData.length} profiles with completed assessment`);
      console.log('📊 Profiles:', profilesData);
    }

    // Test 3: Check if user_progress has records for these users
    if (profilesData && profilesData.length > 0) {
      console.log('\n3. Checking user_progress for completed users...');
      const userIds = profilesData.map(p => p.id);
      const { data: userProgress, error: userProgressError } = await supabase
        .from('user_progress')
        .select('user_id, xp, level, streak, total_challenges_completed')
        .in('user_id', userIds);

      if (userProgressError) {
        console.error('❌ Error:', userProgressError);
      } else {
        console.log(`✅ Found ${userProgress.length} user_progress records for completed users`);
        console.log('📊 User Progress:', userProgress);
      }
    }

    // Test 4: Test the exact leaderboard query
    console.log('\n4. Testing leaderboard query...');
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        xp,
        streak,
        total_challenges_completed
      `)
      .order('xp', { ascending: false })
      .limit(10);

    if (leaderboardError) {
      console.error('❌ Leaderboard Error:', leaderboardError);
    } else {
      console.log(`✅ Leaderboard query returned ${leaderboardData.length} users`);
      console.log('📊 Leaderboard Data:', leaderboardData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLeaderboardData(); 