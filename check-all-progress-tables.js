import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllProgressTables() {
  console.log('🔍 Checking all possible progress tables...\n');

  try {
    // Get the user ID
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles?.[0]?.id;
    
    if (!userId) {
      console.log('❌ No user found');
      return;
    }

    console.log(`👤 User ID: ${userId}\n`);

    // List of possible tables that might contain progress data
    const possibleTables = [
      'user_progress',
      'user_profiles', 
      'progress',
      'user_stats',
      'user_data',
      'profiles',
      'user_settings',
      'user_tokens',
      'completed_challenges',
      'user_pack_progress'
    ];

    for (const tableName of possibleTables) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        // Try to get table info
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Found ${data?.length || 0} records`);
          
          if (data && data.length > 0) {
            console.log(`   📊 Sample record keys:`, Object.keys(data[0]));
            
            // Check if this record belongs to our user
            const userRecord = data.find(record => 
              record.user_id === userId || 
              record.id === userId ||
              record.userId === userId
            );
            
            if (userRecord) {
              console.log(`   👤 Found user record:`, {
                id: userRecord.id,
                user_id: userRecord.user_id,
                xp: userRecord.xp,
                level: userRecord.level,
                streak: userRecord.streak
              });
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ Table doesn't exist or error: ${err.message}`);
      }
      
      console.log('');
    }

    // Also check if there are any RPC functions that might return progress
    console.log('🔧 Checking for progress-related RPC functions...');
    
    const rpcFunctions = [
      'get_user_progress',
      'get_user_stats', 
      'get_progress',
      'calculate_user_level',
      'get_user_data'
    ];

    for (const funcName of rpcFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName, { user_id: userId });
        
        if (error) {
          console.log(`   ❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${funcName}: Found data`, data);
        }
      } catch (err) {
        // Function doesn't exist, which is expected
      }
    }

    console.log('\n🎯 Summary:');
    console.log('Check the output above to see which table contains the progress data');
    console.log('If you see progress data in a different table, we need to update the app to use that table');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllProgressTables(); 