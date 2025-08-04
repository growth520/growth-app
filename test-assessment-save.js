import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAssessmentSave() {
  console.log('🔍 Testing Assessment Save Process...\n');
  
  try {
    // 1. Get the current user profile
    console.log('1. Current user profile:');
    const { data: currentProfile, error: currentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('full_name', 'Yanki Davis')
      .single();
    
    if (currentError) {
      console.error('Error fetching current profile:', currentError);
      return;
    }
    
    console.log('Current profile:');
    console.log('  ID:', currentProfile.id);
    console.log('  Full Name:', currentProfile.full_name);
    console.log('  Has Assessment:', currentProfile.has_completed_assessment);
    console.log('  Assessment Results:', currentProfile.assessment_results);
    
    // 2. Simulate the assessment save process
    console.log('\n2. Simulating assessment save process:');
    
    const testAssessmentData = {
      answers: {
        0: {
          questionId: 1,
          question: "Test question",
          option: { text: "Test option", scores: { "Self-Worth": 1 } },
          otherText: null
        }
      },
      scores: {
        "Self-Worth": 1,
        "Confidence": 0,
        "Mindfulness": 0
      },
      topRecommendation: { category: "Self-Worth", score: 1 },
      primaryGrowthArea: "Self-Worth",
      userSelection: "Self-Worth"
    };
    
    console.log('Test assessment data:');
    console.log(JSON.stringify(testAssessmentData, null, 2));
    
    // 3. Update the profile with test data
    console.log('\n3. Updating profile with test data:');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        assessment_results: testAssessmentData,
        has_completed_assessment: true,
      })
      .eq('id', currentProfile.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return;
    }
    
    console.log('✅ Profile updated successfully');
    
    // 4. Verify the update worked
    console.log('\n4. Verifying the update:');
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentProfile.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log('Updated profile:');
    console.log('  Has Assessment:', updatedProfile.has_completed_assessment);
    console.log('  Assessment Results:', updatedProfile.assessment_results);
    console.log('  User Selection:', updatedProfile.assessment_results?.userSelection);
    
    // 5. Test the exact same data structure as the app
    console.log('\n5. Testing with exact app data structure:');
    
    const appAssessmentData = {
      answers: {
        '0': {
          option: { text: "Test option", scores: { "Self-Worth": 1 } },
          question: "When you're under stress, what do you usually do?",
          otherText: null,
          questionId: 1
        }
      },
      scores: {
        Fitness: 0,
        Purpose: 2,
        Humility: 0,
        Gratitude: 2,
        Confidence: 0,
        Discipline: 7,
        Resilience: 2,
        'Self-Worth': -2,
        Mindfulness: 1,
        'Self-Control': 0,
        Communication: 1
      },
      userSelection: 'Self-Worth',
      primaryGrowthArea: 'Self-Worth',
      topRecommendation: { score: -2, category: 'Self-Worth' }
    };
    
    console.log('App assessment data:');
    console.log(JSON.stringify(appAssessmentData, null, 2));
    
    // Update with app data structure
    const { error: appUpdateError } = await supabase
      .from('profiles')
      .update({
        assessment_results: appAssessmentData,
        has_completed_assessment: true,
      })
      .eq('id', currentProfile.id);
    
    if (appUpdateError) {
      console.error('App update error:', appUpdateError);
      return;
    }
    
    console.log('✅ App data structure update successful');
    
    // Verify app data structure
    const { data: appUpdatedProfile, error: appVerifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentProfile.id)
      .single();
    
    if (appVerifyError) {
      console.error('Error verifying app update:', appVerifyError);
      return;
    }
    
    console.log('App updated profile:');
    console.log('  Has Assessment:', appUpdatedProfile.has_completed_assessment);
    console.log('  User Selection:', appUpdatedProfile.assessment_results?.userSelection);
    console.log('  Primary Growth Area:', appUpdatedProfile.assessment_results?.primaryGrowthArea);
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testAssessmentSave(); 