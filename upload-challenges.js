import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadChallenges() {
  try {
    // Read the CSV file
    const csvData = fs.readFileSync('./public/Growth_Challenge_Set_Expanded.csv', 'utf8');
    
    // Parse CSV
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    // Transform data
    const challenges = results.data.map(row => ({
      id: parseInt(row.id),
      category: row.category,
      challenge_id_text: row.challenge_id_text,
      title: row.title,
      description: row.description
    })).filter(c => c.id && c.category && c.title);
    
    console.log(`Uploading ${challenges.length} challenges...`);
    
    // Upload to Supabase
    const { data, error } = await supabase
      .from('challenges')
      .upsert(challenges, { onConflict: 'id' });
    
    if (error) {
      console.error('Error uploading:', error);
    } else {
      console.log('Successfully uploaded challenges!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadChallenges(); 