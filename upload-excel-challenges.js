import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadChallengesFromExcel(filePath) {
  try {
    console.log('Reading Excel/CSV file...');
    
    // Read the file
    const csvData = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log(`Found ${results.data.length} challenges in the file`);
    
    // Transform data to match the database structure
    const challenges = results.data.map(row => ({
      id: parseInt(row.id),
      category: row.category,
      challenge_id_text: row.challenge_id_text,
      title: row.title,
      description: row.description || row.title, // Use title as description if description is empty
      difficulty: parseInt(row.difficulty) || 1,
      xp_reward: parseInt(row.xp_reward) || 10
    })).filter(c => c.id && c.category && c.title);
    
    console.log(`Processing ${challenges.length} valid challenges...`);
    
    // Upload in batches of 1000 to avoid timeouts
    const batchSize = 1000;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < challenges.length; i += batchSize) {
      const batch = challenges.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`Uploading batch ${batchNumber} (${batch.length} challenges)...`);
      
      const { data, error } = await supabase
        .from('challenges')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error uploading batch ${batchNumber}:`, error);
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
      console.log('\n🎉 Your challenges are now available in your app!');
    }
    
  } catch (error) {
    console.error('❌ Error reading or processing file:', error);
  }
}

// Usage instructions
console.log('🚀 Challenge Upload Script');
console.log('============================');
console.log('');
console.log('To use this script:');
console.log('1. Make sure your Excel file has these columns:');
console.log('   - id (number)');
console.log('   - category (text)');
console.log('   - challenge_id_text (text)');
console.log('   - title (text)');
console.log('   - description (text, optional)');
console.log('   - difficulty (number, optional, default: 1)');
console.log('   - xp_reward (number, optional, default: 10)');
console.log('');
console.log('2. Save your Excel file as CSV');
console.log('3. Update the filePath below to point to your CSV file');
console.log('4. Run: node upload-excel-challenges.js');
console.log('');

// Update this path to your CSV file
const filePath = './your-challenges-file.csv'; // Change this to your file path

// Uncomment the line below to run the upload
// uploadChallengesFromExcel(filePath);

console.log('📝 To start the upload, edit this file and uncomment the last line with your file path.'); 