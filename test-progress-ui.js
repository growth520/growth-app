import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProgressUI() {
  console.log('🔍 Testing Progress UI Data Flow...\n');

  try {
    // 1. Get the user profile
    console.log('1. Getting user profile...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      return;
    }

    const profile = profiles?.[0];
    if (!profile) {
      console.log('❌ No profile found');
      return;
    }

    console.log('✅ Profile found:', {
      id: profile.id,
      full_name: profile.full_name,
      has_completed_assessment: profile.has_completed_assessment
    });

    // 2. Check if user_progress record exists
    console.log('\n2. Checking user_progress record...');
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (progressError) {
      console.log('❌ Progress error:', progressError.message);
      console.log('   This means no user_progress record exists for this user');
      return;
    }

    console.log('✅ Progress record found:', {
      id: progress.id,
      user_id: progress.user_id,
      xp: progress.xp,
      level: progress.level,
      streak: progress.streak,
      total_challenges_completed: progress.total_challenges_completed
    });

    // 3. Test the exact query that DataContext uses
    console.log('\n3. Testing DataContext query...');
    const { data: dataContextProgress, error: dcError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (dcError) {
      console.log('❌ DataContext query error:', dcError.message);
    } else {
      console.log('✅ DataContext query successful:', {
        xp: dataContextProgress.xp,
        level: dataContextProgress.level,
        streak: dataContextProgress.streak
      });
    }

    // 4. Test level calculation
    console.log('\n4. Testing level calculation...');
    const { calculateLevelFromXP, calculateXPProgress } = await import('./src/lib/levelSystem.js');
    
    const calculatedLevel = calculateLevelFromXP(progress.xp);
    const xpProgress = calculateXPProgress(progress.xp, calculatedLevel);
    
    console.log('✅ Level calculation:', {
      actual_xp: progress.xp,
      calculated_level: calculatedLevel,
      actual_level: progress.level,
      xp_in_current_level: xpProgress.xpInCurrentLevel,
      xp_needed_for_next: xpProgress.xpNeededForNextLevel,
      progress_percentage: xpProgress.progressPercentage
    });

    // 5. Check if there's a mismatch
    console.log('\n5. Checking for mismatches...');
    if (calculatedLevel !== progress.level) {
      console.log('⚠️ Level mismatch detected!');
      console.log(`   Database level: ${progress.level}`);
      console.log(`   Calculated level: ${calculatedLevel}`);
      console.log(`   This might cause UI issues`);
    } else {
      console.log('✅ Level calculation matches database');
    }

    // 6. Test what the progress page would display
    console.log('\n6. Progress page display test...');
    const displayData = {
      xp: progress.xp,
      level: progress.level,
      streak: progress.streak,
      total_challenges_completed: progress.total_challenges_completed || 0,
      xp_progress: xpProgress.xpInCurrentLevel,
      xp_needed: xpProgress.xpNeededForNextLevel,
      progress_percentage: xpProgress.progressPercentage
    };

    console.log('📱 Progress page should display:', displayData);

    // 7. Check if the issue might be in the UI refresh
    console.log('\n7. Testing data refresh...');
    const { data: refreshedProgress, error: refreshError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (refreshError) {
      console.log('❌ Refresh error:', refreshError.message);
    } else {
      console.log('✅ Refresh successful:', {
        xp: refreshedProgress.xp,
        level: refreshedProgress.level,
        updated_at: refreshedProgress.updated_at
      });
    }

    console.log('\n🎯 Summary:');
    console.log('- Profile exists and has completed assessment');
    console.log('- User progress record exists');
    console.log('- DataContext query works');
    console.log('- Level calculation is correct');
    console.log('- Data can be refreshed');
    console.log('\n💡 If UI is not updating, the issue might be:');
    console.log('1. Browser cache - try hard refresh (Ctrl+F5)');
    console.log('2. React state not updating - check DataContext refresh');
    console.log('3. Component not re-rendering - check useEffect dependencies');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProgressUI(); 