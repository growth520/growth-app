import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAssessmentSave() {
  console.log('🔍 Debugging Assessment Save Process...\n');
  
  try {
    // 1. Check all profiles and their assessment results
    console.log('1. All profiles in the database:');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (allProfilesError) {
      console.error('Error fetching all profiles:', allProfilesError);
      return;
    }
    
    console.log(`Total profiles: ${allProfiles.length}`);
    allProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Profile ID: ${profile.id}`);
      console.log(`   Full Name: ${profile.full_name || 'Not set'}`);
      console.log(`   Has Assessment: ${profile.has_completed_assessment || false}`);
      console.log(`   Assessment Results:`, profile.assessment_results);
      if (profile.assessment_results) {
        console.log(`   User Selection: ${profile.assessment_results.userSelection || 'Not set'}`);
      }
    });
    
    // 2. Check specifically for the user "Yanki Davis"
    console.log('\n2. Looking for Yanki Davis profile:');
    const { data: yankiProfile, error: yankiError } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', 'Yanki Davis')
      .single();
    
    if (yankiError) {
      console.error('Error fetching Yanki profile:', yankiError);
    } else {
      console.log('Yanki Davis profile found:');
      console.log('   ID:', yankiProfile.id);
      console.log('   Full Name:', yankiProfile.full_name);
      console.log('   Has Assessment:', yankiProfile.has_completed_assessment);
      console.log('   Assessment Results:', yankiProfile.assessment_results);
      if (yankiProfile.assessment_results) {
        console.log('   User Selection:', yankiProfile.assessment_results.userSelection);
      }
    }
    
    // 3. Check if there are any profiles with assessment_results but no userSelection
    console.log('\n3. Profiles with assessment_results but missing userSelection:');
    const profilesWithAssessment = allProfiles.filter(p => p.assessment_results);
    const profilesMissingSelection = profilesWithAssessment.filter(p => 
      !p.assessment_results.userSelection
    );
    
    console.log(`Found ${profilesMissingSelection.length} profiles with assessment but no userSelection:`);
    profilesMissingSelection.forEach(profile => {
      console.log(`   - ${profile.full_name || 'Unknown'} (${profile.id})`);
      console.log(`     Assessment data:`, profile.assessment_results);
    });
    
    // 4. Test the assessment save process
    console.log('\n4. Testing assessment save process...');
    
    // Simulate the assessment data structure from AssessmentPage.jsx
    const testAssessmentData = {
      answers: {
        0: {
          questionId: 1,
          question: "Test question",
          option: { text: "Test option", scores: { "Self-Control": 1 } },
          otherText: null
        }
      },
      scores: {
        "Self-Control": 1,
        "Confidence": 0,
        "Mindfulness": 0
      },
      topRecommendation: { category: "Self-Control", score: 1 },
      primaryGrowthArea: "Self-Control",
      userSelection: "Self-Control"
    };
    
    console.log('Test assessment data structure:');
    console.log(JSON.stringify(testAssessmentData, null, 2));
    
    // 5. Check the profiles table structure
    console.log('\n5. Checking profiles table structure:');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'profiles' });
    
    if (tableError) {
      console.log('Could not get table info via RPC, checking manually...');
      // Try a simple query to see what columns exist
      const { data: sampleProfile, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error getting sample profile:', sampleError);
      } else if (sampleProfile && sampleProfile.length > 0) {
        console.log('Available columns in profiles table:');
        console.log(Object.keys(sampleProfile[0]));
      }
    } else {
      console.log('Table structure:', tableInfo);
    }
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

// Run the debug
debugAssessmentSave(); 