import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserProgress() {
  console.log('🔧 Fixing missing user_progress records...\n');

  try {
    // 1. Get all profiles that don't have user_progress records
    console.log('1. Finding profiles without user_progress...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username');

    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log(`✅ Found ${profiles?.length || 0} profiles`);

    // 2. Check which profiles are missing user_progress
    for (const profile of profiles || []) {
      console.log(`\n2. Checking profile: ${profile.full_name} (${profile.id})`);
      
      const { data: existingProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('id, user_id, xp, level, streak')
        .eq('user_id', profile.id)
        .single();

      if (progressError && progressError.code === 'PGRST116') {
        // No user_progress record found - create one
        console.log('   ❌ No user_progress record found - creating one...');
        
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: profile.id,
            xp: 0,
            level: 1,
            streak: 0,
            xp_to_next_level: 100,
            tokens: 0,
            streak_freezes_used: 0
          })
          .select()
          .single();

        if (createError) {
          console.log('   ❌ Error creating user_progress:', createError.message);
        } else {
          console.log('   ✅ Created user_progress record:', {
            id: newProgress.id,
            user_id: newProgress.user_id,
            xp: newProgress.xp,
            level: newProgress.level,
            streak: newProgress.streak
          });
        }
      } else if (progressError) {
        console.log('   ❌ Error checking user_progress:', progressError.message);
      } else {
        console.log('   ✅ User_progress record already exists:', {
          id: existingProgress.id,
          xp: existingProgress.xp,
          level: existingProgress.level,
          streak: existingProgress.streak
        });
      }
    }

    // 3. Verify the fix
    console.log('\n3. Verifying fix...');
    const { data: allProgress, error: verifyError } = await supabase
      .from('user_progress')
      .select('user_id, xp, level, streak')
      .limit(5);

    if (verifyError) {
      console.log('❌ Error verifying fix:', verifyError.message);
    } else {
      console.log(`✅ Found ${allProgress?.length || 0} user_progress records`);
      allProgress?.forEach(progress => {
        console.log(`   User ${progress.user_id}: Level ${progress.level}, XP ${progress.xp}, Streak ${progress.streak}`);
      });
    }

    console.log('\n🎉 User progress fix completed!');
    console.log('📱 The progress page should now show XP and level information correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserProgress(); 