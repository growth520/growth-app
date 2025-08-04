import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSetup() {
  console.log('🔍 Testing Database Setup...\n');
  
  try {
    // Test 1: Check if profiles table exists
    console.log('1. Testing profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
    } else {
      console.log('✅ Profiles table exists and is accessible');
    }
    
    // Test 2: Check if challenges table exists
    console.log('\n2. Testing challenges table...');
    const { data: challengesData, error: challengesError } = await supabase
      .from('challenges')
      .select('count')
      .limit(1);
    
    if (challengesError) {
      console.log('❌ Challenges table error:', challengesError.message);
    } else {
      console.log('✅ Challenges table exists and is accessible');
    }
    
    // Test 3: Check if user_progress table exists
    console.log('\n3. Testing user_progress table...');
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('count')
      .limit(1);
    
    if (progressError) {
      console.log('❌ User_progress table error:', progressError.message);
    } else {
      console.log('✅ User_progress table exists and is accessible');
    }
    
    // Test 4: Check if completed_challenges table exists
    console.log('\n4. Testing completed_challenges table...');
    const { data: completedData, error: completedError } = await supabase
      .from('completed_challenges')
      .select('count')
      .limit(1);
    
    if (completedError) {
      console.log('❌ Completed_challenges table error:', completedError.message);
    } else {
      console.log('✅ Completed_challenges table exists and is accessible');
    }
    
    // Test 5: Check if posts table exists
    console.log('\n5. Testing posts table...');
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('count')
      .limit(1);
    
    if (postsError) {
      console.log('❌ Posts table error:', postsError.message);
    } else {
      console.log('✅ Posts table exists and is accessible');
    }
    
    console.log('\n🎯 Database Setup Summary:');
    console.log('============================');
    console.log('If you see ✅ for all tables, your database is ready!');
    console.log('If you see ❌ for any tables, run the setup-complete-database.sql in your Supabase dashboard.');
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
  }
}

testDatabaseSetup(); 