import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeaderboardFields() {
  console.log('Testing leaderboard field names...');
  
  try {
    // Test 1: Check user_progress table structure
    console.log('\n1. Checking user_progress table structure...');
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);
    
    console.log('User progress table structure:', { 
      data: progressData, 
      error: progressError,
      fields: progressData && progressData.length > 0 ? Object.keys(progressData[0]) : []
    });
    
    // Test 2: Check if total_challenges_completed field exists
    console.log('\n2. Testing total_challenges_completed field...');
    const { data: challengesData, error: challengesError } = await supabase
      .from('user_progress')
      .select('user_id, total_challenges_completed')
      .limit(5);
    
    console.log('Challenges completed data:', { 
      data: challengesData, 
      error: challengesError 
    });
    
    // Test 3: Check alternative field names
    console.log('\n3. Testing alternative field names...');
    const { data: altData, error: altError } = await supabase
      .from('user_progress')
      .select('user_id, challenges_completed, completed_challenges, challenge_count')
      .limit(5);
    
    console.log('Alternative field names:', { 
      data: altData, 
      error: altError 
    });
    
    // Test 4: Check if there's a separate challenges table
    console.log('\n4. Checking for challenges table...');
    const { data: challengesTableData, error: challengesTableError } = await supabase
      .from('challenges')
      .select('*')
      .limit(1);
    
    console.log('Challenges table:', { 
      data: challengesTableData, 
      error: challengesTableError 
    });
    
    // Test 5: Check challenge_completions table if it exists
    console.log('\n5. Checking for challenge_completions table...');
    const { data: completionsData, error: completionsError } = await supabase
      .from('challenge_completions')
      .select('*')
      .limit(1);
    
    console.log('Challenge completions table:', { 
      data: completionsData, 
      error: completionsError 
    });
    
    // Test 6: Count total challenges completed across all users
    console.log('\n6. Counting total challenges completed...');
    const { data: allProgressData, error: allProgressError } = await supabase
      .from('user_progress')
      .select('total_challenges_completed');
    
    if (!allProgressError && allProgressData) {
      const totalChallenges = allProgressData.reduce((sum, user) => sum + (user.total_challenges_completed || 0), 0);
      console.log('Total challenges completed across all users:', totalChallenges);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLeaderboardFields(); 