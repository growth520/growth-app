import { createClient } from '@supabase/supabase-js';
import { getChallengesForGrowthArea } from './src/lib/growthAreaMapping.js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserAssessment() {
  console.log('🔍 Debugging User Assessment and Challenge Selection...\n');
  
  try {
    // 1. Check all user profiles with assessment results
    console.log('1. All user profiles with assessment results:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, assessment_results')
      .not('assessment_results', 'is', null);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    profiles.forEach((profile, index) => {
      const userSelection = profile.assessment_results?.userSelection;
      console.log(`  ${index + 1}. ${profile.full_name || 'Unknown'} (${profile.id}): ${userSelection || 'No selection'}`);
    });
    
    // 2. Test the mapping function specifically for Self-Control
    console.log('\n2. Testing Self-Control challenge selection:');
    const selfControlChallenges = await getChallengesForGrowthArea(supabase, 'Self-Control', false);
    console.log(`Found ${selfControlChallenges.length} Self-Control challenges`);
    
    if (selfControlChallenges.length > 0) {
      console.log('Sample Self-Control challenges:');
      selfControlChallenges.slice(0, 5).forEach(challenge => {
        console.log(`  - "${challenge.title}" (ID: ${challenge.id}, Category: "${challenge.category}")`);
      });
    }
    
    // 3. Test the mapping function for Communication (what's being shown)
    console.log('\n3. Testing Communication challenge selection:');
    const communicationChallenges = await getChallengesForGrowthArea(supabase, 'Communication', false);
    console.log(`Found ${communicationChallenges.length} Communication challenges`);
    
    if (communicationChallenges.length > 0) {
      console.log('Sample Communication challenges:');
      communicationChallenges.slice(0, 5).forEach(challenge => {
        console.log(`  - "${challenge.title}" (ID: ${challenge.id}, Category: "${challenge.category}")`);
      });
    }
    
    // 4. Check if "Create a Quiet Space" exists in Self-Control category
    console.log('\n4. Looking for "Create a Quiet Space" in Self-Control category:');
    const { data: quietSpaceSelfControl, error: quietSpaceError } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', 'Self-Control')
      .ilike('title', '%Create a Quiet Space%');
    
    if (quietSpaceError) {
      console.error('Error:', quietSpaceError);
    } else {
      console.log(`Found ${quietSpaceSelfControl.length} "Create a Quiet Space" challenges in Self-Control category`);
      quietSpaceSelfControl.forEach(challenge => {
        console.log(`  - ID: ${challenge.id}, Title: "${challenge.title}"`);
      });
    }
    
    // 5. Check if "Create a Quiet Space" exists in Communication category
    console.log('\n5. Looking for "Create a Quiet Space" in Communication category:');
    const { data: quietSpaceCommunication, error: quietSpaceCommError } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', 'Communication')
      .ilike('title', '%Create a Quiet Space%');
    
    if (quietSpaceCommError) {
      console.error('Error:', quietSpaceCommError);
    } else {
      console.log(`Found ${quietSpaceCommunication.length} "Create a Quiet Space" challenges in Communication category`);
      if (quietSpaceCommunication.length > 0) {
        console.log(`  - ID: ${quietSpaceCommunication[0].id}, Title: "${quietSpaceCommunication[0].title}"`);
      }
    }
    
    // 6. Simulate the exact logic from ChallengePage.jsx
    console.log('\n6. Simulating ChallengePage logic:');
    
    // Get the first user with assessment results
    if (profiles.length > 0) {
      const testUser = profiles[0];
      const growthArea = testUser.assessment_results?.userSelection || 'Confidence';
      
      console.log(`Testing with user: ${testUser.full_name || 'Unknown'}`);
      console.log(`User's growth area: "${growthArea}"`);
      
      // Simulate the getOrCreateExtraChallenge function
      const all = await getChallengesForGrowthArea(supabase, growthArea);
      console.log(`Found ${all.length} challenges for growth area "${growthArea}"`);
      
      if (all.length > 0) {
        // Pick a random challenge (like the app does)
        const randomChallenge = all[Math.floor(Math.random() * all.length)];
        console.log(`Random challenge selected: "${randomChallenge.title}" (Category: "${randomChallenge.category}")`);
        
        // Check if this matches the user's growth area
        if (randomChallenge.category === growthArea) {
          console.log('✅ Challenge category matches user growth area!');
        } else {
          console.log('❌ Challenge category does NOT match user growth area!');
          console.log(`Expected: "${growthArea}", Got: "${randomChallenge.category}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugUserAssessment(); 