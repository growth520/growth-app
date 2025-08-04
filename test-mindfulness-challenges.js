import { createClient } from '@supabase/supabase-js';
import { getChallengesForGrowthArea } from './src/lib/growthAreaMapping.js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMindfulnessChallenges() {
  console.log('🔍 Testing Mindfulness Challenge Selection...\n');
  
  try {
    // 1. Test the mapping function for Mindfulness
    console.log('1. Testing Mindfulness mapping:');
    const mindfulnessChallenges = await getChallengesForGrowthArea(supabase, 'Mindfulness', false);
    console.log(`Found ${mindfulnessChallenges.length} Mindfulness challenges`);
    
    if (mindfulnessChallenges.length > 0) {
      console.log('Sample Mindfulness challenges:');
      mindfulnessChallenges.slice(0, 5).forEach(challenge => {
        console.log(`  - "${challenge.title}" (ID: ${challenge.id}, Category: "${challenge.category}")`);
      });
    } else {
      console.log('❌ No Mindfulness challenges found!');
    }
    
    // 2. Check if "Create a Quiet Space" exists in Mindfulness category
    console.log('\n2. Looking for "Create a Quiet Space" in Mindfulness category:');
    const { data: quietSpaceMindfulness, error: quietSpaceError } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', 'Mindfulness')
      .ilike('title', '%Create a Quiet Space%')
      .limit(10);
    
    if (quietSpaceError) {
      console.error('Error:', quietSpaceError);
    } else {
      console.log(`Found ${quietSpaceMindfulness.length} "Create a Quiet Space" challenges in Mindfulness category`);
      quietSpaceMindfulness.forEach(challenge => {
        console.log(`  - ID: ${challenge.id}, Title: "${challenge.title}"`);
      });
    }
    
    // 3. Simulate the exact app logic for the user
    console.log('\n3. Simulating app logic for user:');
    const userGrowthArea = 'Mindfulness'; // From the debug output
    
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
    }
    
    // 4. Check what the app is currently showing vs what it should show
    console.log('\n4. Current app behavior analysis:');
    console.log('User Growth Area: Mindfulness');
    console.log('App is showing: Self-Control challenge');
    console.log('Expected: Mindfulness challenge');
    console.log('Issue: App is showing wrong category');
    
    // 5. Check if there are any cached challenges in the database
    console.log('\n5. Checking for any cached challenge data:');
    const { data: completedChallenges, error: completedError } = await supabase
      .from('completed_challenges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (completedError) {
      console.error('Error fetching completed challenges:', completedError);
    } else {
      console.log(`Recent completed challenges:`);
      completedChallenges.forEach(completed => {
        console.log(`  - Challenge ID: ${completed.challenge_id}, Category: "${completed.category}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testMindfulnessChallenges(); 