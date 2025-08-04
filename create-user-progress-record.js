import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserProgressRecord() {
  console.log('🔧 Creating User Progress Record...\n');

  try {
    const userId = '6b18fb7e-5821-4a30-bad7-0d3c6873cc77';
    
    // 1. First check if the table exists and has the right structure
    console.log('1. Checking user_progress table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table error:', tableError.message);
      return;
    }

    console.log('✅ user_progress table exists');

    // 2. Check if record already exists
    console.log('\n2. Checking if record already exists...');
    const { data: existingRecord, error: checkError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRecord) {
      console.log('✅ Record already exists:', {
        id: existingRecord.id,
        user_id: existingRecord.user_id,
        xp: existingRecord.xp,
        level: existingRecord.level,
        streak: existingRecord.streak
      });
      return;
    }

    // 3. Create the record
    console.log('\n3. Creating new user_progress record...');
    const { data: newRecord, error: createError } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        xp: 50, // Starting XP value
        level: 1,
        streak: 5,
        total_challenges_completed: 0,
        xp_to_next_level: 100,
        tokens: 0,
        streak_freezes_used: 0,
        longest_streak: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creating record:', createError.message);
      
      // If it's an RLS error, provide instructions
      if (createError.message.includes('row-level security')) {
        console.log('\n💡 RLS Error - You need to run this SQL in Supabase:');
        console.log(`
-- Run this in Supabase SQL Editor
INSERT INTO public.user_progress (
    user_id,
    xp,
    level,
    streak,
    total_challenges_completed,
    xp_to_next_level,
    tokens,
    streak_freezes_used,
    longest_streak,
    created_at,
    updated_at
) VALUES (
    '${userId}',
    50,
    1,
    5,
    0,
    100,
    0,
    0,
    5,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;
        `);
      }
      return;
    }

    console.log('✅ Record created successfully:', {
      id: newRecord.id,
      user_id: newRecord.user_id,
      xp: newRecord.xp,
      level: newRecord.level,
      streak: newRecord.streak
    });

    // 4. Verify the record was created
    console.log('\n4. Verifying record...');
    const { data: verifyRecord, error: verifyError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.log('❌ Verification error:', verifyError.message);
    } else {
      console.log('✅ Verification successful:', {
        xp: verifyRecord.xp,
        level: verifyRecord.level,
        streak: verifyRecord.streak
      });
    }

    console.log('\n🎉 User Progress Record Created!');
    console.log('📱 The progress page should now show the correct XP and level.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUserProgressRecord(); 