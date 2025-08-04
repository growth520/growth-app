import { createClient } from '@supabase/supabase-js';
import { getChallengesForGrowthArea } from './src/lib/growthAreaMapping.js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugChallengeMatching() {
  console.log('🔍 Debugging Challenge Matching...\n');
  
  try {
    // 1. Check user profiles and their assessment results
    console.log('1. Checking user profiles and assessment results...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, assessment_results')
      .not('assessment_results', 'is', null);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles.length} profiles with assessment results:`);
    profiles.slice(0, 5).forEach(profile => {
      const userSelection = profile.assessment_results?.userSelection;
      console.log(`  - ${profile.full_name || 'Unknown'}: ${userSelection || 'No selection'}`);
    });
    
    // 2. Test the mapping function for different growth areas
    console.log('\n2. Testing mapping function...');
    const testGrowthAreas = ['Self-Control', 'Confidence', 'Mindfulness'];
    
    for (const growthArea of testGrowthAreas) {
      console.log(`\nTesting growth area: "${growthArea}"`);
      const challenges = await getChallengesForGrowthArea(supabase, growthArea, false);
      console.log(`  Found ${challenges.length} challenges`);
      
      if (challenges.length > 0) {
        const categories = [...new Set(challenges.map(c => c.category))];
        console.log(`  Categories: ${categories.join(', ')}`);
        console.log(`  Sample challenge: "${challenges[0].title}" (${challenges[0].category})`);
      }
    }
    
    // 3. Check if there are any challenges with "Create a Quiet Space" title
    console.log('\n3. Looking for "Create a Quiet Space" challenge...');
    const { data: quietSpaceChallenges, error: quietSpaceError } = await supabase
      .from('challenges')
      .select('*')
      .ilike('title', '%Create a Quiet Space%');
    
    if (quietSpaceError) {
      console.error('Error fetching quiet space challenges:', quietSpaceError);
    } else {
      console.log(`Found ${quietSpaceChallenges.length} "Create a Quiet Space" challenges:`);
      quietSpaceChallenges.forEach(challenge => {
        console.log(`  - ID: ${challenge.id}, Category: "${challenge.category}", Title: "${challenge.title}"`);
      });
    }
    
    // 4. Check the current challenge being shown (if it's cached)
    console.log('\n4. Checking for cached challenges...');
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
    
    // 5. Test direct database query for Self-Control challenges
    console.log('\n5. Direct query for Self-Control challenges...');
    const { data: selfControlChallenges, error: selfControlError } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', 'Self-Control')
      .limit(5);
    
    if (selfControlError) {
      console.error('Error fetching Self-Control challenges:', selfControlError);
    } else {
      console.log(`Found ${selfControlChallenges.length} Self-Control challenges:`);
      selfControlChallenges.forEach(challenge => {
        console.log(`  - "${challenge.title}" (ID: ${challenge.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugChallengeMatching(); 