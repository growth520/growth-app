import { createClient } from '@supabase/supabase-js';
import { getChallengesForGrowthArea } from './src/lib/growthAreaMapping.js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSelfWorthChallenges() {
  console.log('🔍 Testing Self-Worth Challenge Availability...\n');
  
  try {
    // 1. Test the mapping function for Self-Worth
    console.log('1. Testing Self-Worth mapping:');
    const selfWorthChallenges = await getChallengesForGrowthArea(supabase, 'Self-Worth', false);
    console.log(`Found ${selfWorthChallenges.length} Self-Worth challenges`);
    
    if (selfWorthChallenges.length > 0) {
      console.log('Sample Self-Worth challenges:');
      selfWorthChallenges.slice(0, 5).forEach(challenge => {
        console.log(`  - "${challenge.title}" (ID: ${challenge.id}, Category: "${challenge.category}")`);
      });
    } else {
      console.log('❌ No Self-Worth challenges found!');
    }
    
    // 2. Direct database query for Self-Worth challenges
    console.log('\n2. Direct database query for Self-Worth:');
    const { data: directSelfWorth, error: directError } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', 'Self-Worth')
      .limit(10);
    
    if (directError) {
      console.error('Error:', directError);
    } else {
      console.log(`Found ${directSelfWorth.length} Self-Worth challenges directly:`);
      directSelfWorth.forEach(challenge => {
        console.log(`  - "${challenge.title}" (ID: ${challenge.id})`);
      });
    }
    
    // 3. Check what categories are available
    console.log('\n3. Available challenge categories:');
    const { data: categories, error: categoriesError } = await supabase
      .from('challenges')
      .select('category')
      .not('category', 'is', null);
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    } else {
      const uniqueCategories = [...new Set(categories.map(c => c.category))];
      console.log('Available categories:', uniqueCategories);
      
      // Check if Self-Worth is in the list
      if (uniqueCategories.includes('Self-Worth')) {
        console.log('✅ Self-Worth category exists in database');
      } else {
        console.log('❌ Self-Worth category NOT found in database');
      }
    }
    
    // 4. Simulate the exact app logic for the user
    console.log('\n4. Simulating app logic for user:');
    const userGrowthArea = 'Self-Worth'; // From the debug output
    
    console.log(`User's growth area: "${userGrowthArea}"`);
    
    // Get challenges using the mapping function
    const challenges = await getChallengesForGrowthArea(supabase, userGrowthArea, false);
    console.log(`Found ${challenges.length} challenges for "${userGrowthArea}"`);
    
    if (challenges.length > 0) {
      // Pick a random challenge (like the app does)
      const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
      console.log(`Random challenge selected: "${randomChallenge.title}" (Category: "${randomChallenge.category}")`);
      
      // Check if this matches the user's growth area
      if (randomChallenge.category === userGrowthArea) {
        console.log('✅ Challenge category matches user growth area!');
      } else {
        console.log('❌ Challenge category does NOT match user growth area!');
        console.log(`Expected: "${userGrowthArea}", Got: "${randomChallenge.category}"`);
      }
    } else {
      console.log('❌ No challenges found for user growth area!');
      
      // Test fallback
      console.log('\nTesting fallback to all challenges:');
      const fallbackChallenges = await getChallengesForGrowthArea(supabase, userGrowthArea, true);
      console.log(`Fallback found ${fallbackChallenges.length} challenges`);
      
      if (fallbackChallenges.length > 0) {
        const randomFallback = fallbackChallenges[Math.floor(Math.random() * fallbackChallenges.length)];
        console.log(`Fallback challenge: "${randomFallback.title}" (Category: "${randomFallback.category}")`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testSelfWorthChallenges(); 