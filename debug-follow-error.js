import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugFollowError() {
  console.log('Debugging follow error...');
  
  try {
    // Test 1: Check if follows table exists and its structure
    console.log('\n1. Checking follows table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('follows')
      .select('*')
      .limit(1);
    
    console.log('Table info:', { data: tableInfo, error: tableError });
    
    // Test 2: Check table schema by trying to get column info
    console.log('\n2. Checking table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('follows')
      .select('follower_id, followed_id, created_at')
      .limit(0);
    
    console.log('Schema test:', { 
      success: !schemaError, 
      error: schemaError,
      columns: schemaData ? Object.keys(schemaData[0] || {}) : []
    });
    
    // Test 3: Check if we can query with specific fields
    console.log('\n3. Testing specific field query...');
    const { data: fieldTest, error: fieldError } = await supabase
      .from('follows')
      .select('follower_id, followed_id')
      .limit(1);
    
    console.log('Field test:', { data: fieldTest, error: fieldError });
    
    // Test 4: Check RLS policies by trying to insert with auth context
    console.log('\n4. Testing insert with proper error handling...');
    const testFollowData = {
      follower_id: '00000000-0000-0000-0000-000000000000',
      followed_id: '00000000-0000-0000-0000-000000000001'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('follows')
      .insert(testFollowData)
      .select();
    
    console.log('Insert test with select:', { 
      data: insertData, 
      error: insertError,
      errorCode: insertError?.code,
      errorMessage: insertError?.message,
      errorDetails: insertError?.details
    });
    
    // Test 5: Check if the table has the correct constraints
    console.log('\n5. Testing table constraints...');
    const { data: constraintTest, error: constraintError } = await supabase
      .from('follows')
      .insert({
        follower_id: '00000000-0000-0000-0000-000000000000',
        followed_id: '00000000-0000-0000-0000-000000000000' // Same ID (should fail unique constraint)
      });
    
    console.log('Constraint test (same IDs):', { 
      data: constraintTest, 
      error: constraintError,
      errorCode: constraintError?.code,
      errorMessage: constraintError?.message
    });
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugFollowError(); 