import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCrossDeviceProfile() {
  console.log('🔍 Testing cross-device profile issue...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.log('❌ No active session found');
      return;
    }
    
    console.log('✅ User authenticated:', session.user.email);
    console.log('User ID:', session.user.id);
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    console.log('📋 Profile found:');
    console.log('- ID:', profile.id);
    console.log('- Full Name:', profile.full_name);
    console.log('- Has Completed Assessment:', profile.has_completed_assessment);
    console.log('- Assessment Results:', profile.assessment_results);
    console.log('- Growth Area:', profile.growth_area);
    console.log('- Created At:', profile.created_at);
    console.log('- Updated At:', profile.updated_at);
    
    // Check user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (progressError) {
      console.error('❌ Progress error:', progressError);
    } else {
      console.log('📊 Progress found:');
      console.log('- XP:', progress.xp);
      console.log('- Level:', progress.level);
      console.log('- Streak:', progress.streak);
      console.log('- Total Challenges Completed:', progress.total_challenges_completed);
    }
    
    // Test the specific issue - check if profile would be recreated
    console.log('\n🔍 Testing profile recreation logic...');
    
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('has_completed_assessment')
      .eq('id', session.user.id)
      .single();
    
    if (testError && testError.code === 'PGRST116') {
      console.log('❌ Profile would be recreated (PGRST116 error)');
    } else if (testProfile) {
      console.log('✅ Profile exists and would be preserved');
      console.log('- Assessment status preserved:', testProfile.has_completed_assessment);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testCrossDeviceProfile(); 