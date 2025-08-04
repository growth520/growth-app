import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

import { supabase } from './customSupabaseClient';

export async function fetchChallengesFromCSV() {
  return new Promise((resolve, reject) => {
    fetch('/challenges-complete.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: (err) => reject(err)
        });
      })
      .catch(reject);
  });
}

export async function fetchChallengesFromDatabase() {
  try {
    // Try to get all categories first with a larger limit
    const { data: categories, error: catError } = await supabase
      .from('challenges')
      .select('category')
      .limit(5000); // Increased limit to get more categories
    
    if (catError) {
      console.error('Error fetching categories:', catError);
      throw catError;
    }
    
    const uniqueCategories = [...new Set(categories.map(c => c.category))];
    console.log(`📋 Available categories: ${uniqueCategories.join(', ')}`);
    
    // If we only got one category, the database query is limited
    if (uniqueCategories.length <= 1) {
      console.log('⚠️ Database query limited - falling back to CSV file');
      return await fetchChallengesFromCSV();
    }
    
    // Now fetch challenges for each category separately
    const allChallenges = [];
    
    for (const category of uniqueCategories) {
      const { data: categoryChallenges, error: challengeError } = await supabase
        .from('challenges')
        .select('id, category, title, description, challenge_id_text')
        .eq('category', category)
        .limit(1000); // Get up to 1000 challenges per category
      
      if (challengeError) {
        console.error(`Error fetching ${category} challenges:`, challengeError);
        continue;
      }
      
      if (categoryChallenges && categoryChallenges.length > 0) {
        allChallenges.push(...categoryChallenges);
        console.log(`✅ Fetched ${categoryChallenges.length} ${category} challenges`);
      }
    }
    
    console.log(`✅ Total challenges fetched: ${allChallenges.length}`);
    
    // If we didn't get enough challenges, fall back to CSV
    if (allChallenges.length < 1000) {
      console.log('⚠️ Not enough challenges from database - falling back to CSV file');
      return await fetchChallengesFromCSV();
    }
    
    return allChallenges;
  } catch (error) {
    console.error('Error in fetchChallengesFromDatabase:', error);
    console.log('⚠️ Database error - falling back to CSV file');
    return await fetchChallengesFromCSV();
  }
}