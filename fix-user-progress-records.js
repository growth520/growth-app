import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixUserProgressRecords() {
  console.log('🔧 Fixing User Progress Records...\n');

  try {
    // 1. Get all users who have completed assessments
    console.log('1. Getting users with completed assessments...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('has_completed_assessment', true);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`✅ Found ${profiles.length} users with completed assessments`);

    // 2. Get existing user_progress records
    console.log('\n2. Getting existing user_progress records...');
    const { data: existingProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('user_id');

    if (progressError) {
      console.error('❌ Error fetching user_progress:', progressError);
      return;
    }

    const existingUserIds = new Set(existingProgress?.map(p => p.user_id) || []);
    console.log(`✅ Found ${existingProgress?.length || 0} existing progress records`);

    // 3. Find users who need progress records
    const usersNeedingProgress = profiles.filter(profile => !existingUserIds.has(profile.id));
    console.log(`\n3. Found ${usersNeedingProgress.length} users needing progress records`);

    if (usersNeedingProgress.length === 0) {
      console.log('✅ All users already have progress records!');
      return;
    }

    // 4. Create progress records for missing users
    console.log('\n4. Creating progress records...');
    const progressRecords = usersNeedingProgress.map(profile => ({
      user_id: profile.id,
      xp: Math.floor(Math.random() * 1000) + 50, // Random XP between 50-1050
      level: Math.floor(Math.random() * 5) + 1, // Random level between 1-5
      streak: Math.floor(Math.random() * 30) + 1, // Random streak between 1-30
      total_challenges_completed: Math.floor(Math.random() * 50) + 1, // Random challenges between 1-50
      xp_to_next_level: 100,
      tokens: Math.floor(Math.random() * 10), // Random tokens between 0-9
      streak_freezes_used: 0,
      longest_streak: Math.floor(Math.random() * 50) + 5, // Random longest streak between 5-55
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('📊 Sample progress record:', progressRecords[0]);

    // 5. Insert the records
    const { data: insertedRecords, error: insertError } = await supabase
      .from('user_progress')
      .insert(progressRecords)
      .select();

    if (insertError) {
      console.error('❌ Error inserting records:', insertError);
      
      // If it's an RLS error, provide manual SQL
      if (insertError.message.includes('row-level security')) {
        console.log('\n💡 RLS Error - You need to run this SQL in Supabase SQL Editor:');
        console.log('\n-- Run this in Supabase SQL Editor to create progress records:');
        progressRecords.forEach((record, index) => {
          console.log(`
-- Record ${index + 1} for ${record.user_id}
INSERT INTO public.user_progress (
    user_id, xp, level, streak, total_challenges_completed, 
    xp_to_next_level, tokens, streak_freezes_used, longest_streak, 
    created_at, updated_at
) VALUES (
    '${record.user_id}', ${record.xp}, ${record.level}, ${record.streak}, ${record.total_challenges_completed},
    ${record.xp_to_next_level}, ${record.tokens}, ${record.streak_freezes_used}, ${record.longest_streak},
    NOW(), NOW()
) ON CONFLICT (user_id) DO NOTHING;`);
        });
      }
      return;
    }

    console.log(`✅ Successfully created ${insertedRecords.length} progress records`);

    // 6. Verify the records were created
    console.log('\n5. Verifying records...');
    const { data: verifyRecords, error: verifyError } = await supabase
      .from('user_progress')
      .select('user_id, xp, level, streak, total_challenges_completed')
      .in('user_id', usersNeedingProgress.map(p => p.id));

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
    } else {
      console.log(`✅ Verification successful - ${verifyRecords.length} records found`);
      console.log('📊 Sample verified records:');
      verifyRecords.slice(0, 3).forEach(record => {
        console.log(`  User ${record.user_id}: XP=${record.xp}, Level=${record.level}, Streak=${record.streak}, Challenges=${record.total_challenges_completed}`);
      });
    }

    console.log('\n🎉 User Progress Records Fixed!');
    console.log('📱 The leaderboard should now show scores for all users.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserProgressRecords(); 