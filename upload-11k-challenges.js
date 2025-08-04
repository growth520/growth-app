import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function upload11kChallenges() {
  try {
    console.log('🚀 Starting upload of Torah_Growth_Challenges_11k.csv...');
    
    // Read the CSV file
    const csvData = fs.readFileSync('./Torah_Growth_Challenges_11k.csv', 'utf8');
    
    // Parse CSV
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log(`📊 Found ${results.data.length} challenges in the file`);
    
    // Transform data to match the database structure
    const challenges = results.data.map(row => ({
      id: parseInt(row.id),
      category: row.category,
      challenge_id_text: row.challenge_id_text || `CH-${row.id}`,
      title: row.title,
      description: row.description || row.title,
      difficulty: parseInt(row.difficulty) || 1,
      xp_reward: parseInt(row.xp_reward) || 10
    })).filter(c => c.id && c.category && c.title);
    
    console.log(`✅ Processing ${challenges.length} valid challenges...`);
    
    // Get unique categories for debugging
    const categories = [...new Set(challenges.map(c => c.category))];
    console.log(`📋 Available categories: ${categories.join(', ')}`);
    
    // Upload in batches of 1000 to avoid timeouts
    const batchSize = 1000;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < challenges.length; i += batchSize) {
      const batch = challenges.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📤 Uploading batch ${batchNumber} (${batch.length} challenges)...`);
      
      const { data, error } = await supabase
        .from('challenges')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error uploading batch ${batchNumber}:`, error);
        errorCount += batch.length;
      } else {
        console.log(`✅ Successfully uploaded batch ${batchNumber}`);
        successCount += batch.length;
      }
      
      // Small delay between batches to be nice to the server
      if (i + batchSize < challenges.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successfully uploaded: ${successCount} challenges`);
    console.log(`❌ Failed to upload: ${errorCount} challenges`);
    console.log(`📁 Total processed: ${challenges.length} challenges`);
    
    if (successCount > 0) {
      console.log('\n🎉 Your 11k challenges are now available in your app!');
      console.log('🔄 Please refresh your app to see the new challenges.');
    }
    
  } catch (error) {
    console.error('❌ Error reading or processing file:', error);
  }
}

// Run the upload
upload11kChallenges(); 