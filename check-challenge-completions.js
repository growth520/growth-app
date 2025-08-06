import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkChallengeCompletions() {
  console.log('Checking challenge completion tracking...');
  
  try {
    // Test 1: Check all tables to see what exists
    console.log('\n1. Checking all tables...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('Available tables:', { 
      data: tablesData, 
      error: tablesError 
    });
    
    // Test 2: Check if there's a user_challenges table
    console.log('\n2. Checking user_challenges table...');
    const { data: userChallengesData, error: userChallengesError } = await supabase
      .from('user_challenges')
      .select('*')
      .limit(5);
    
    console.log('User challenges table:', { 
      data: userChallengesData, 
      error: userChallengesError 
    });
    
    // Test 3: Check if there's a challenge_pack_completions table
    console.log('\n3. Checking challenge_pack_completions table...');
    const { data: packCompletionsData, error: packCompletionsError } = await supabase
      .from('challenge_pack_completions')
      .select('*')
      .limit(5);
    
    console.log('Challenge pack completions table:', { 
      data: packCompletionsData, 
      error: packCompletionsError 
    });
    
    // Test 4: Check if there's a challenge_completion table (singular)
    console.log('\n4. Checking challenge_completion table...');
    const { data: completionData, error: completionError } = await supabase
      .from('challenge_completion')
      .select('*')
      .limit(5);
    
    console.log('Challenge completion table:', { 
      data: completionData, 
      error: completionError 
    });
    
    // Test 5: Check if there's a user_challenge_completions table
    console.log('\n5. Checking user_challenge_completions table...');
    const { data: userCompletionsData, error: userCompletionsError } = await supabase
      .from('user_challenge_completions')
      .select('*')
      .limit(5);
    
    console.log('User challenge completions table:', { 
      data: userCompletionsData, 
      error: userCompletionsError 
    });
    
    // Test 6: Check if there's a challenge_pack_details table
    console.log('\n6. Checking challenge_pack_details table...');
    const { data: packDetailsData, error: packDetailsError } = await supabase
      .from('challenge_pack_details')
      .select('*')
      .limit(5);
    
    console.log('Challenge pack details table:', { 
      data: packDetailsData, 
      error: packDetailsError 
    });
    
    // Test 7: Check if there's a challenge_pack_completion table (singular)
    console.log('\n7. Checking challenge_pack_completion table...');
    const { data: packCompletionData, error: packCompletionError } = await supabase
      .from('challenge_pack_completion')
      .select('*')
      .limit(5);
    
    console.log('Challenge pack completion table:', { 
      data: packCompletionData, 
      error: packCompletionError 
    });
    
    // Test 8: Check if there's a challenge_completion_details table
    console.log('\n8. Checking challenge_completion_details table...');
    const { data: completionDetailsData, error: completionDetailsError } = await supabase
      .from('challenge_completion_details')
      .select('*')
      .limit(5);
    
    console.log('Challenge completion details table:', { 
      data: completionDetailsData, 
      error: completionDetailsError 
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkChallengeCompletions(); 