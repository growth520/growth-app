import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createChallengesTable() {
  try {
    // Create challenges table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.challenges (
          id INTEGER PRIMARY KEY,
          category VARCHAR(100),
          challenge_id_text VARCHAR(50),
          title TEXT NOT NULL,
          description TEXT,
          difficulty INTEGER DEFAULT 1,
          xp_reward INTEGER DEFAULT 10,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can read challenges" ON public.challenges;
        CREATE POLICY "Anyone can read challenges" ON public.challenges FOR SELECT USING (true);
        
        CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.challenges(category);
        CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON public.challenges(difficulty);
        CREATE INDEX IF NOT EXISTS idx_challenges_challenge_id_text ON public.challenges(challenge_id_text);
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
      return false;
    }
    
    console.log('Challenges table created successfully!');
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function uploadChallenges() {
  try {
    // Read the CSV file
    const csvData = fs.readFileSync('./Torah_Growth_Challenges_11k.csv', 'utf8');
    
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
    
    // Upload in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < challenges.length; i += batchSize) {
      const batch = challenges.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('challenges')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error uploading batch ${i/batchSize + 1}:`, error);
      } else {
        console.log(`Successfully uploaded batch ${i/batchSize + 1} (${batch.length} challenges)`);
      }
    }
    
    console.log('All challenges uploaded successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  console.log('Starting challenge restoration...');
  
  // First create the table
  const tableCreated = await createChallengesTable();
  
  if (tableCreated) {
    // Then upload the challenges
    await uploadChallenges();
  }
}

main(); 