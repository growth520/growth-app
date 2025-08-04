import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase service role key. Please set VITE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProgressRecordsWithServiceRole() {
  console.log('🔧 Fixing Missing User Progress Records (with Service Role)...\n');

  try {
    // Step 1: Get all users who completed assessment
    console.log('1. Finding users who completed assessment...');
    const { data: completedUsers, error: completedError } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('has_completed_assessment', true);

    if (completedError) {
      console.error('❌ Error fetching completed users:', completedError);
      return;
    }

    console.log(`✅ Found ${completedUsers.length} users who completed assessment:`, completedUsers);

    // Step 2: Check which users already have user_progress records
    console.log('\n2. Checking existing user_progress records...');
    const { data: existingProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('user_id');

    if (progressError) {
      console.error('❌ Error fetching existing progress:', progressError);
      return;
    }

    const existingUserIds = new Set(existingProgress.map(record => record.user_id));
    console.log(`✅ Found ${existingProgress.length} existing user_progress records`);

    // Step 3: Find users who need user_progress records
    const usersNeedingProgress = completedUsers.filter(user => !existingUserIds.has(user.id));
    console.log(`\n3. Users needing user_progress records: ${usersNeedingProgress.length}`);

    if (usersNeedingProgress.length === 0) {
      console.log('✅ All users already have user_progress records!');
      return;
    }

    // Step 4: Create user_progress records for missing users
    console.log('\n4. Creating user_progress records...');
    const progressRecords = usersNeedingProgress.map(user => ({
      user_id: user.id,
      xp: 0,
      level: 1,
      streak: 0,
      current_challenge_id: null,
      challenge_assigned_at: null,
      last_viewed_notifications: new Date().toISOString(),
      xp_to_next_level: 100,
      tokens: 0,
      streak_freezes_used: 0,
      last_login_date: new Date().toISOString().split('T')[0],
      total_challenges_completed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      longest_streak: 0,
      last_challenge_completed_date: null
    }));

    console.log('📝 Records to create:', progressRecords);

    // Step 5: Insert the records using service role
    const { data: insertedRecords, error: insertError } = await supabase
      .from('user_progress')
      .insert(progressRecords)
      .select();

    if (insertError) {
      console.error('❌ Error inserting user_progress records:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${insertedRecords.length} user_progress records!`);
    console.log('📊 Inserted records:', insertedRecords);

    // Step 6: Verify the fix
    console.log('\n5. Verifying the fix...');
    const { data: finalProgress, error: finalError } = await supabase
      .from('user_progress')
      .select('user_id, xp, level, streak, total_challenges_completed');

    if (finalError) {
      console.error('❌ Error verifying fix:', finalError);
    } else {
      console.log(`✅ Total user_progress records now: ${finalProgress.length}`);
      console.log('📊 Final user_progress data:', finalProgress);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

fixUserProgressRecordsWithServiceRole(); 