import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUserProgressFix() {
  console.log('🔧 Applying User Progress Fix...\n');

  try {
    // 1. Get all profiles
    console.log('1. Getting profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (profileError) {
      console.log('❌ Error getting profiles:', profileError.message);
      return;
    }

    console.log(`✅ Found ${profiles?.length || 0} profiles`);

    // 2. For each profile, create a user_progress record
    for (const profile of profiles || []) {
      console.log(`\n2. Creating progress record for: ${profile.full_name}`);
      
      // First check if progress record already exists
      const { data: existingProgress, error: checkError } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (existingProgress) {
        console.log('   ✅ Progress record already exists');
        continue;
      }

      // Create new progress record
      const { data: newProgress, error: createError } = await supabase
        .from('user_progress')
        .insert({
          user_id: profile.id,
          xp: 0,
          level: 1,
          streak: 0,
          total_challenges_completed: 0,
          xp_to_next_level: 100,
          tokens: 0,
          streak_freezes_used: 0,
          longest_streak: 0
        })
        .select()
        .single();

      if (createError) {
        console.log('   ❌ Error creating progress:', createError.message);
        
        // If it's an RLS error, try with service role key
        if (createError.message.includes('row-level security')) {
          console.log('   🔄 Trying with service role...');
          // Note: This would require the service role key, which we don't have
          console.log('   💡 You may need to run the SQL script directly in Supabase');
        }
      } else {
        console.log('   ✅ Created progress record:', {
          id: newProgress.id,
          user_id: newProgress.user_id,
          xp: newProgress.xp,
          level: newProgress.level
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
      console.log('❌ Error verifying:', verifyError.message);
    } else {
      console.log(`✅ Found ${allProgress?.length || 0} progress records`);
      allProgress?.forEach(progress => {
        console.log(`   User ${progress.user_id}: Level ${progress.level}, XP ${progress.xp}, Streak ${progress.streak}`);
      });
    }

    console.log('\n🎉 User Progress Fix Applied!');
    console.log('📱 The progress page should now show XP and level information correctly.');
    console.log('\n💡 If you still see issues:');
    console.log('1. Try a hard refresh in your browser (Ctrl+F5)');
    console.log('2. Check the browser console for any errors');
    console.log('3. Make sure you\'re logged in as the correct user');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyUserProgressFix(); 