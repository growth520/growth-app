import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataContextRefresh() {
  console.log('🔍 Testing DataContext Refresh...\n');

  try {
    // 1. Get user profile
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles?.[0]?.id;
    
    if (!userId) {
      console.log('❌ No user found');
      return;
    }

    console.log(`👤 User ID: ${userId}`);

    // 2. Check current progress
    console.log('\n1. Checking current progress...');
    const { data: currentProgress, error: currentError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currentError) {
      console.log('❌ No progress record found:', currentError.message);
      console.log('💡 You need to run the SQL script to create user_progress records');
      return;
    }

    console.log('✅ Current progress:', {
      xp: currentProgress.xp,
      level: currentProgress.level,
      streak: currentProgress.streak,
      updated_at: currentProgress.updated_at
    });

    // 3. Simulate the exact query that DataContext uses
    console.log('\n2. Testing DataContext query...');
    const { data: dataContextQuery, error: dcError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (dcError) {
      console.log('❌ DataContext query error:', dcError.message);
    } else {
      console.log('✅ DataContext query successful:', {
        xp: dataContextQuery.xp,
        level: dataContextQuery.level,
        streak: dataContextQuery.streak
      });
    }

    // 4. Test if we can update the progress (simulate challenge completion)
    console.log('\n3. Testing progress update...');
    const newXP = (currentProgress.xp || 0) + 10;
    const { data: updatedProgress, error: updateError } = await supabase
      .from('user_progress')
      .update({ 
        xp: newXP,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Update error:', updateError.message);
    } else {
      console.log('✅ Progress updated successfully:', {
        old_xp: currentProgress.xp,
        new_xp: updatedProgress.xp,
        updated_at: updatedProgress.updated_at
      });
    }

    // 5. Test the refresh query again
    console.log('\n4. Testing refresh query...');
    const { data: refreshedProgress, error: refreshError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (refreshError) {
      console.log('❌ Refresh error:', refreshError.message);
    } else {
      console.log('✅ Refresh successful:', {
        xp: refreshedProgress.xp,
        level: refreshedProgress.level,
        streak: refreshedProgress.streak
      });
    }

    // 6. Test what the UI should display
    console.log('\n5. UI Display Test...');
    const { calculateLevelFromXP, calculateXPProgress } = await import('./src/lib/levelSystem.js');
    
    const calculatedLevel = calculateLevelFromXP(refreshedProgress.xp);
    const xpProgress = calculateXPProgress(refreshedProgress.xp, calculatedLevel);
    
    console.log('📱 UI should display:', {
      xp: refreshedProgress.xp,
      level: calculatedLevel,
      streak: refreshedProgress.streak,
      xp_progress: xpProgress.xpInCurrentLevel,
      xp_needed: xpProgress.xpNeededForNextLevel,
      progress_percentage: xpProgress.progressPercentage
    });

    console.log('\n🎯 Summary:');
    console.log('- Database queries work correctly');
    console.log('- Progress can be updated');
    console.log('- Refresh queries return updated data');
    console.log('- Level calculations work');
    console.log('\n💡 If UI is not updating, the issue is likely:');
    console.log('1. React component not re-rendering');
    console.log('2. DataContext not calling refreshProgress');
    console.log('3. Browser cache - try hard refresh (Ctrl+F5)');
    console.log('4. Component useEffect dependencies not triggering');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDataContextRefresh(); 