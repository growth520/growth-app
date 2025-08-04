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

async function checkTableSchema() {
  console.log('🔍 Checking user_progress table schema...\n');

  try {
    // Try to get the table structure by attempting to insert a minimal record
    console.log('1. Testing minimal record insertion...');
    
    const minimalRecord = {
      user_id: 'test-user-id',
      xp: 0,
      level: 1,
      streak: 0
    };

    const { data, error } = await supabase
      .from('user_progress')
      .insert(minimalRecord)
      .select();

    if (error) {
      console.log('❌ Error with minimal record:', error.message);
      
      // Try to get table info by querying with different field names
      console.log('\n2. Testing different field name variations...');
      
      const fieldTests = [
        'total_challenges_completed',
        'total_challeng',
        'total_challenge',
        'challenges_completed',
        'challenge_count'
      ];

      for (const fieldName of fieldTests) {
        try {
          const { data: testData, error: testError } = await supabase
            .from('user_progress')
            .select(`user_id, xp, streak, ${fieldName}`)
            .limit(1);

          if (testError) {
            console.log(`❌ Field '${fieldName}': ${testError.message}`);
          } else {
            console.log(`✅ Field '${fieldName}' exists`);
          }
        } catch (e) {
          console.log(`❌ Field '${fieldName}': ${e.message}`);
        }
      }
    } else {
      console.log('✅ Minimal record inserted successfully');
      console.log('📊 Inserted data:', data);
      
      // Clean up the test record
      await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', 'test-user-id');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

checkTableSchema(); 