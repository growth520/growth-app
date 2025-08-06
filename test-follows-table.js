import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFollowsTable() {
  console.log('Testing follows table...');
  
  try {
    // Test 1: Check if follows table exists and get its structure
    console.log('\n1. Checking follows table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('follows')
      .select('*')
      .limit(1);
    
    console.log('Table info:', { data: tableInfo, error: tableError });
    
    // Test 2: Try to insert a test record
    console.log('\n2. Testing insert...');
    const testData = {
      follower_id: '00000000-0000-0000-0000-000000000000',
      followed_id: '00000000-0000-0000-0000-000000000001'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('follows')
      .insert(testData);
    
    console.log('Insert test:', { data: insertData, error: insertError });
    
    // Test 3: Check what fields are expected
    console.log('\n3. Checking table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'follows' });
    
    console.log('Schema:', { data: schemaData, error: schemaError });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFollowsTable(); 