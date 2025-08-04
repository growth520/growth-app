import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeaderboardVsProgress() {
  console.log('🔍 Testing Leaderboard vs Progress Data Fetching...\n');

  try {
    const userId = '6b18fb7e-5821-4a30-bad7-0d3c6873cc77';

    // 1. Test how Leaderboard fetches data (direct query)
    console.log('1. Testing Leaderboard-style query...');
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('user_progress')
      .select(`
        id,
        xp,
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
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (leaderboardError) {
      console.log('❌ Leaderboard query error:', leaderboardError.message);
    } else {
      console.log('✅ Leaderboard query successful:', {
        id: leaderboardData.id,
        xp: leaderboardData.xp,
        level: leaderboardData.level,
        streak: leaderboardData.streak,
        updated_at: leaderboardData.updated_at
      });
    }

    // 2. Test how Progress page fetches data (DataContext style)
    console.log('\n2. Testing Progress page-style query...');
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError) {
      console.log('❌ Progress query error:', progressError.message);
    } else {
      console.log('✅ Progress query successful:', {
        id: progressData.id,
        user_id: progressData.user_id,
        xp: progressData.xp,
        level: progressData.level,
        streak: progressData.streak,
        updated_at: progressData.updated_at
      });
    }

    // 3. Test both queries with user_id
    console.log('\n3. Testing both queries with user_id...');
    
    // Leaderboard style with user_id
    const { data: leaderboardUserIdData, error: leaderboardUserIdError } = await supabase
      .from('user_progress')
      .select(`
        id,
        xp,
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
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single();

    if (leaderboardUserIdError) {
      console.log('❌ Leaderboard user_id query error:', leaderboardUserIdError.message);
    } else {
      console.log('✅ Leaderboard user_id query successful:', {
        id: leaderboardUserIdData.id,
        xp: leaderboardUserIdData.xp,
        streak: leaderboardUserIdData.streak,
        updated_at: leaderboardUserIdData.updated_at
      });
    }

    // 4. Check if there are multiple records
    console.log('\n4. Checking for multiple records...');
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('user_progress')
      .select('*');

    if (allRecordsError) {
      console.log('❌ All records query error:', allRecordsError.message);
    } else {
      console.log(`✅ Found ${allRecords?.length || 0} total records:`);
      allRecords?.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, User ID: ${record.user_id}, XP: ${record.xp}, Level: ${record.level}`);
      });
    }

    // 5. Check if there's a mismatch between id and user_id
    console.log('\n5. Checking for id vs user_id mismatch...');
    if (leaderboardData && progressData) {
      console.log('Leaderboard uses .eq("id", userId):', leaderboardData.id === userId);
      console.log('Progress uses .eq("user_id", userId):', progressData.user_id === userId);
      
      if (leaderboardData.id === userId && progressData.user_id === userId) {
        console.log('✅ Both queries should work');
      } else if (leaderboardData.id === userId && progressData.user_id !== userId) {
        console.log('⚠️ Leaderboard works, Progress might be looking at wrong record');
      } else if (leaderboardData.id !== userId && progressData.user_id === userId) {
        console.log('⚠️ Progress works, Leaderboard might be looking at wrong record');
      } else {
        console.log('❌ Neither query matches the expected user');
      }
    }

    console.log('\n🎯 Summary:');
    console.log('- Check if the queries are using different fields (id vs user_id)');
    console.log('- Check if there are multiple records for the same user');
    console.log('- The leaderboard might be reading from a different record than progress');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLeaderboardVsProgress(); 