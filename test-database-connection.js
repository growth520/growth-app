import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can connect
    console.log('\n1️⃣ Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('challenges')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    console.log('✅ Connection successful');
    
    // Test 2: Get total count
    console.log('\n2️⃣ Getting total challenge count...');
    const { count, error: countError } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count query failed:', countError);
    } else {
      console.log(`✅ Total challenges in database: ${count}`);
    }
    
    // Test 3: Get categories
    console.log('\n3️⃣ Getting unique categories...');
    const { data: categories, error: catError } = await supabase
      .from('challenges')
      .select('category')
      .limit(1000);
    
    if (catError) {
      console.error('❌ Categories query failed:', catError);
    } else {
      const uniqueCategories = [...new Set(categories.map(c => c.category))];
      console.log(`✅ Available categories: ${uniqueCategories.join(', ')}`);
    }
    
    // Test 4: Test specific category query
    console.log('\n4️⃣ Testing Resilience category query...');
    const { data: resilienceChallenges, error: resError } = await supabase
      .from('challenges')
      .select('id, category, title')
      .eq('category', 'Resilience')
      .limit(10);
    
    if (resError) {
      console.error('❌ Resilience query failed:', resError);
    } else {
      console.log(`✅ Found ${resilienceChallenges.length} Resilience challenges`);
      if (resilienceChallenges.length > 0) {
        console.log('Sample Resilience challenge:', resilienceChallenges[0]);
      }
    }
    
    // Test 5: Test with smaller limit
    console.log('\n5️⃣ Testing with limit 1000...');
    const { data: limitedChallenges, error: limitError } = await supabase
      .from('challenges')
      .select('id, category, title')
      .limit(1000);
    
    if (limitError) {
      console.error('❌ Limited query failed:', limitError);
    } else {
      console.log(`✅ Successfully fetched ${limitedChallenges.length} challenges with limit 1000`);
      const categories = [...new Set(limitedChallenges.map(c => c.category))];
      console.log(`Categories in limited set: ${categories.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseConnection(); 