import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategoriesIssue() {
  console.log('🔍 Debugging Categories Issue...\n');
  
  try {
    // 1. Check categories with chunked fetching (like we did before)
    console.log('1. Checking categories with chunked fetching:');
    let allCategories = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const { data: chunk, error } = await supabase
        .from('challenges')
        .select('category')
        .not('category', 'is', null)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching categories:', error);
        break;
      }

      if (!chunk || chunk.length === 0) {
        break;
      }

      allCategories = allCategories.concat(chunk);
      offset += limit;

      console.log(`Fetched ${chunk.length} challenges (offset: ${offset - limit})`);

      if (chunk.length < limit) {
        break;
      }
    }
    
    console.log(`Total challenges fetched: ${allCategories.length}`);
    
    const uniqueCategories = [...new Set(allCategories.map(c => c.category))];
    console.log('All unique categories:', uniqueCategories);
    
    // Check if Self-Worth is in the list
    if (uniqueCategories.includes('Self-Worth')) {
      console.log('✅ Self-Worth category exists in database');
    } else {
      console.log('❌ Self-Worth category NOT found in database');
    }
    
    // 2. Check the current challenge being shown in the app
    console.log('\n2. Checking what challenge the app is currently showing:');
    
    // Look for "Create a Quiet Space" in different categories
    const { data: quietSpaceChallenges, error: quietSpaceError } = await supabase
      .from('challenges')
      .select('*')
      .ilike('title', '%Create a Quiet Space%')
      .limit(20);
    
    if (quietSpaceError) {
      console.error('Error:', quietSpaceError);
    } else {
      console.log(`Found ${quietSpaceChallenges.length} "Create a Quiet Space" challenges:`);
      quietSpaceChallenges.forEach(challenge => {
        console.log(`  - ID: ${challenge.id}, Category: "${challenge.category}", Title: "${challenge.title}"`);
      });
    }
    
    // 3. Check if the user's cached challenge is from the wrong category
    console.log('\n3. Checking user profile for any cached challenge info:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', 'Yanki Davis')
      .single();
    
    if (profilesError) {
      console.error('Error fetching profile:', profilesError);
    } else {
      console.log('User profile found:');
      console.log('  Growth Area:', profiles.assessment_results?.userSelection);
      console.log('  Has Assessment:', profiles.has_completed_assessment);
    }
    
    // 4. Test the exact mapping function with the user's growth area
    console.log('\n4. Testing mapping function with user growth area:');
    const userGrowthArea = 'Self-Worth';
    
    // Import the mapping function
    const { getChallengesForGrowthArea } = await import('./src/lib/growthAreaMapping.js');
    
    const challenges = await getChallengesForGrowthArea(supabase, userGrowthArea, false);
    console.log(`Found ${challenges.length} challenges for "${userGrowthArea}"`);
    
    if (challenges.length > 0) {
      console.log('Sample challenges:');
      challenges.slice(0, 5).forEach(challenge => {
        console.log(`  - "${challenge.title}" (Category: "${challenge.category}")`);
      });
      
      // Check if any of these are "Create a Quiet Space"
      const quietSpaceInSelfWorth = challenges.filter(c => 
        c.title.toLowerCase().includes('create a quiet space')
      );
      
      if (quietSpaceInSelfWorth.length > 0) {
        console.log(`Found ${quietSpaceInSelfWorth.length} "Create a Quiet Space" challenges in Self-Worth category`);
      } else {
        console.log('No "Create a Quiet Space" challenges found in Self-Worth category');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugCategoriesIssue(); 