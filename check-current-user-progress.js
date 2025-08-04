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

async function checkCurrentUserProgress() {
  console.log('🔍 Checking Current User Progress Records...\n');

  try {
    // Check all user_progress records
    console.log('1. All user_progress records:');
    const { data: allProgress, error: allError } = await supabase
      .from('user_progress')
      .select('*');

    if (allError) {
      console.error('❌ Error fetching all progress:', allError);
    } else {
      console.log(`✅ Found ${allProgress.length} user_progress records`);
      console.log('📊 All records:', allProgress);
    }

    // Check users with completed assessment
    console.log('\n2. Users with completed assessment:');
    const { data: completedUsers, error: completedError } = await supabase
      .from('profiles')
      .select('id, full_name, username, has_completed_assessment')
      .eq('has_completed_assessment', true);

    if (completedError) {
      console.error('❌ Error fetching completed users:', completedError);
    } else {
      console.log(`✅ Found ${completedUsers.length} users with completed assessment`);
      console.log('📊 Completed users:', completedUsers);
    }

    // Check which completed users have progress records
    console.log('\n3. Progress records for completed users:');
    if (completedUsers && completedUsers.length > 0) {
      const userIds = completedUsers.map(user => user.id);
      const { data: userProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('user_id, xp, level, streak, total_challenges_completed')
        .in('user_id', userIds);

      if (progressError) {
        console.error('❌ Error fetching user progress:', progressError);
      } else {
        console.log(`✅ Found ${userProgress.length} progress records for completed users`);
        console.log('📊 User progress data:', userProgress);
      }
    }

    // Test leaderboard queries
    console.log('\n4. Testing leaderboard queries:');
    
    // XP Leaderboard
    const { data: xpLeaderboard, error: xpError } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        xp,
        streak,
        total_challenges_completed
      `)
      .order('xp', { ascending: false })
      .limit(10);

    if (xpError) {
      console.error('❌ XP leaderboard error:', xpError);
    } else {
      console.log(`✅ XP leaderboard: ${xpLeaderboard.length} users`);
      console.log('📊 XP data:', xpLeaderboard);
    }

    // Streak Leaderboard
    const { data: streakLeaderboard, error: streakError } = await supabase
      .from('user_progress')
      .select(`
        user_id,
        xp,
        streak,
        total_challenges_completed
      `)
      .order('streak', { ascending: false })
      .limit(10);

    if (streakError) {
      console.error('❌ Streak leaderboard error:', streakError);
    } else {
      console.log(`✅ Streak leaderboard: ${streakLeaderboard.length} users`);
      console.log('📊 Streak data:', streakLeaderboard);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

checkCurrentUserProgress(); 