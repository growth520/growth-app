import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCompletedChallenges() {
  console.log('Checking completed_challenges table and triggers...');
  
  try {
    // Test 1: Check completed_challenges table structure
    console.log('\n1. Checking completed_challenges table structure...');
    const { data: completedData, error: completedError } = await supabase
      .from('completed_challenges')
      .select('*')
      .limit(5);
    
    console.log('Completed challenges table:', { 
      data: completedData, 
      error: completedError,
      fields: completedData && completedData.length > 0 ? Object.keys(completedData[0]) : []
    });
    
    // Test 2: Count total completed challenges
    console.log('\n2. Counting total completed challenges...');
    const { count: totalCompleted, error: countError } = await supabase
      .from('completed_challenges')
      .select('*', { count: 'exact', head: true });
    
    console.log('Total completed challenges:', { 
      count: totalCompleted, 
      error: countError 
    });
    
    // Test 3: Check if there's a trigger on completed_challenges table
    console.log('\n3. Checking for triggers on completed_challenges...');
    const { data: triggersData, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'completed_challenges');
    
    console.log('Triggers on completed_challenges:', { 
      data: triggersData, 
      error: triggersError 
    });
    
    // Test 4: Check if there's a function to update total_challenges_completed
    console.log('\n4. Checking for functions that update total_challenges_completed...');
    const { data: functionsData, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .ilike('routine_name', '%challenge%');
    
    console.log('Challenge-related functions:', { 
      data: functionsData, 
      error: functionsError 
    });
    
    // Test 5: Check if there's a trigger that updates user_progress
    console.log('\n5. Checking for triggers that update user_progress...');
    const { data: userProgressTriggers, error: userProgressTriggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'user_progress');
    
    console.log('Triggers on user_progress:', { 
      data: userProgressTriggers, 
      error: userProgressTriggersError 
    });
    
    // Test 6: Check if there's a function to count completed challenges
    console.log('\n6. Testing function to count completed challenges...');
    try {
      const { data: countFunctionData, error: countFunctionError } = await supabase.rpc(
        'count_user_completed_challenges',
        { user_id: '6b18fb7e-5821-4a30-bad7-0d3c6873cc77' }
      );
      console.log('Count function result:', { 
        data: countFunctionData, 
        error: countFunctionError 
      });
    } catch (error) {
      console.log('Count function not available:', error.message);
    }
    
    // Test 7: Check if there's a function to update total_challenges_completed
    console.log('\n7. Testing function to update total_challenges_completed...');
    try {
      const { data: updateFunctionData, error: updateFunctionError } = await supabase.rpc(
        'update_user_challenge_count',
        { user_id: '6b18fb7e-5821-4a30-bad7-0d3c6873cc77' }
      );
      console.log('Update function result:', { 
        data: updateFunctionData, 
        error: updateFunctionError 
      });
    } catch (error) {
      console.log('Update function not available:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkCompletedChallenges(); 