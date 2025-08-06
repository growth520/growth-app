import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFollowFunctionality() {
  console.log('Testing follow functionality...');
  
  try {
    // Test 1: Check if we can query follows table
    console.log('\n1. Testing follows table query...');
    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .limit(5);
    
    console.log('Follows query:', { data: followsData, error: followsError });
    
    // Test 2: Check if we can insert a follow (this will fail without auth)
    console.log('\n2. Testing follow insert (should fail without auth)...');
    const testFollowData = {
      follower_id: '00000000-0000-0000-0000-000000000000',
      followed_id: '00000000-0000-0000-0000-000000000001'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('follows')
      .insert(testFollowData);
    
    console.log('Follow insert test:', { data: insertData, error: insertError });
    
    // Test 3: Check table structure
    console.log('\n3. Checking follows table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('follows')
      .select('*')
      .limit(0);
    
    console.log('Table structure:', { 
      columns: structureData ? Object.keys(structureData[0] || {}) : [],
      error: structureError 
    });
    
    // Test 4: Check if there are any existing follows
    console.log('\n4. Checking existing follows...');
    const { count, error: countError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true });
    
    console.log('Follows count:', { count, error: countError });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFollowFunctionality(); 