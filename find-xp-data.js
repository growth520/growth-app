import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findXPData() {
  console.log('🔍 Searching for XP data in all tables...\n');

  try {
    // List of tables that might contain XP data
    const possibleTables = [
      'profiles',
      'user_progress', 
      'user_settings',
      'user_tokens',
      'completed_challenges',
      'user_pack_progress',
      'user_pack_challenge_progress',
      'user_badges',
      'posts',
      'challenges',
      'challenge_packs'
    ];

    const userId = '6b18fb7e-5821-4a30-bad7-0d3c6873cc77';

    for (const tableName of possibleTables) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        // Get table structure first
        const { data: sampleData, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          continue;
        }

        if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          console.log(`   ✅ Found ${sampleData.length} records`);
          console.log(`   📊 Columns: ${columns.join(', ')}`);
          
          // Check if this table has XP-related columns
          const xpColumns = columns.filter(col => 
            col.toLowerCase().includes('xp') || 
            col.toLowerCase().includes('level') || 
            col.toLowerCase().includes('streak') ||
            col.toLowerCase().includes('experience') ||
            col.toLowerCase().includes('points')
          );
          
          if (xpColumns.length > 0) {
            console.log(`   🎯 XP-related columns found: ${xpColumns.join(', ')}`);
            
            // Get data for our specific user
            const { data: userData, error: userError } = await supabase
              .from(tableName)
              .select('*')
              .eq('user_id', userId)
              .limit(5);

            if (!userError && userData && userData.length > 0) {
              console.log(`   👤 User data found:`);
              userData.forEach((record, index) => {
                const xpData = {};
                xpColumns.forEach(col => {
                  xpData[col] = record[col];
                });
                console.log(`      ${index + 1}. ${JSON.stringify(xpData)}`);
              });
            } else {
              console.log(`   👤 No user data found for user_id: ${userId}`);
              
              // Try with 'id' field
              const { data: userDataById, error: userByIdError } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', userId)
                .limit(5);

              if (!userByIdError && userDataById && userDataById.length > 0) {
                console.log(`   👤 User data found by id:`);
                userDataById.forEach((record, index) => {
                  const xpData = {};
                  xpColumns.forEach(col => {
                    xpData[col] = record[col];
                  });
                  console.log(`      ${index + 1}. ${JSON.stringify(xpData)}`);
                });
              }
            }
          }
        } else {
          console.log(`   📭 Table is empty`);
        }
        
      } catch (err) {
        console.log(`   ❌ Table doesn't exist or error: ${err.message}`);
      }
      
      console.log('');
    }

    console.log('🎯 Summary:');
    console.log('- Check which table contains the XP data you\'re seeing in Supabase');
    console.log('- The app might be reading from a different table than expected');
    console.log('- We need to update the DataContext to read from the correct table');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findXPData(); 