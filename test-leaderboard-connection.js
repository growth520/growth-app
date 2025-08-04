import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeaderboardConnection() {
  console.log('🔍 Testing Leaderboard Database Connection...\n');

  try {
    // Test 1: Check if user_progress table exists and has data
    console.log('1. Testing user_progress table...');
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(5);

    if (progressError) {
      console.error('❌ user_progress table error:', progressError);
    } else {
      console.log('✅ user_progress table accessible');
      console.log('📊 Sample data:', progressData);
    }

    // Test 2: Check profiles table
    console.log('\n2. Testing profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username, has_completed_assessment')
      .limit(5);

    if (profilesError) {
      console.error('❌ profiles table error:', profilesError);
    } else {
      console.log('✅ profiles table accessible');
      console.log('📊 Sample data:', profilesData);
    }

    // Test 3: Check specific field names
    console.log('\n3. Testing field names...');
    const { data: fieldTest, error: fieldError } = await supabase
      .from('user_progress')
      .select('user_id, xp, streak, total_challenges_completed')
      .limit(1);

    if (fieldError) {
      console.error('❌ Field test error:', fieldError);
    } else {
      console.log('✅ Field names are correct');
      console.log('📊 Field test data:', fieldTest);
    }

    // Test 4: Check users with completed assessment
    console.log('\n4. Testing users with completed assessment...');
    const { data: completedUsers, error: completedError } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('has_completed_assessment', true)
      .limit(5);

    if (completedError) {
      console.error('❌ Completed users test error:', completedError);
    } else {
      console.log('✅ Users with completed assessment found');
      console.log('📊 Completed users:', completedUsers);
    }

    // Test 5: Check if user_progress has records for users with completed assessment
    if (completedUsers && completedUsers.length > 0) {
      console.log('\n5. Testing user_progress for completed users...');
      const userIds = completedUsers.map(user => user.id);
      const { data: userProgress, error: userProgressError } = await supabase
        .from('user_progress')
        .select('user_id, xp, streak, total_challenges_completed')
        .in('user_id', userIds);

      if (userProgressError) {
        console.error('❌ User progress test error:', userProgressError);
      } else {
        console.log('✅ User progress data found for completed users');
        console.log('📊 User progress data:', userProgress);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLeaderboardConnection(); 