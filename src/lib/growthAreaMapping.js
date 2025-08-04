// =====================================================
// GROWTH AREA TO CHALLENGE CATEGORY MAPPING
// =====================================================
// This maps assessment growth areas to challenge categories
// to handle mismatches between survey results and challenge data

export const growthAreaToChallengeCategories = {
  // Assessment Growth Area -> Array of possible challenge categories
  'Confidence': ['Confidence'],
  'Self-Worth': ['Self-Worth', 'Self Worth', 'SelfLove', 'Self-Love', 'Self Esteem', 'Self-Esteem', 'SelfValue', 'Self-Value'],
  'Mindfulness': ['Mindfulness'],
  'Communication': ['Communication'],
  'Resilience': ['Resilience'],
  'Self-Control': ['Self-Control', 'Self Control', 'SelfControl', 'Control', 'Impulse Control'],
  'Discipline': ['Discipline', 'Self-Discipline', 'Self Discipline', 'Habits', 'Consistency', 'Focus'],
  'Fitness': ['Fitness', 'Physical', 'Exercise', 'Health', 'Workout', 'Strength', 'Endurance'],
  'Purpose': ['Purpose', 'Meaning', 'Direction', 'Goals', 'Vision', 'Mission', 'Life Purpose'],
  'Humility': ['Humility', 'Humble', 'Modesty', 'Learning', 'Teachability', 'Open Mindedness'],
  'Gratitude': ['Gratitude', 'Thankful', 'Appreciation', 'Grateful', 'Blessings', 'Thankfulness']
};

// Reverse mapping for finding growth area from challenge category
export const challengeCategoryToGrowthArea = {};

// Build reverse mapping
Object.entries(growthAreaToChallengeCategories).forEach(([growthArea, categories]) => {
  categories.forEach(category => {
    challengeCategoryToGrowthArea[category.toLowerCase()] = growthArea;
  });
});

// Function to get challenge categories for a growth area
export function getChallengeCategoriesForGrowthArea(growthArea) {
  return growthAreaToChallengeCategories[growthArea] || [growthArea];
}

// Function to find the best matching growth area for a challenge category
export function findGrowthAreaForChallengeCategory(challengeCategory) {
  if (!challengeCategory) return 'Confidence'; // Default fallback
  
  const normalizedCategory = challengeCategory.toLowerCase();
  
  // Direct match
  if (challengeCategoryToGrowthArea[normalizedCategory]) {
    return challengeCategoryToGrowthArea[normalizedCategory];
  }
  
  // Partial match
  for (const [growthArea, categories] of Object.entries(growthAreaToChallengeCategories)) {
    for (const category of categories) {
      if (normalizedCategory.includes(category.toLowerCase()) || 
          category.toLowerCase().includes(normalizedCategory)) {
        return growthArea;
      }
    }
  }
  
  // Fallback to default
  return 'Confidence';
}

// Function to get all possible challenge categories
export function getAllChallengeCategories() {
  const allCategories = new Set();
  
  Object.values(growthAreaToChallengeCategories).forEach(categories => {
    categories.forEach(category => allCategories.add(category));
  });
  
  return Array.from(allCategories);
}

// Function to get challenges for a growth area with fallback
export async function getChallengesForGrowthArea(supabase, growthArea, fallbackToAll = true) {
  const categories = getChallengeCategoriesForGrowthArea(growthArea);
  
  // Try to find challenges in the specific categories
  let { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .in('category', categories);
  
  if (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }
  
  // If no challenges found and fallback is enabled, get all challenges
  if ((!challenges || challenges.length === 0) && fallbackToAll) {
    console.log(`No challenges found for growth area "${growthArea}" with categories:`, categories);
    console.log('Falling back to all challenges...');
    
    const { data: allChallenges, error: allError } = await supabase
      .from('challenges')
      .select('*')
      .limit(100); // Limit to avoid overwhelming results
      
    if (allError) {
      console.error('Error fetching all challenges:', allError);
      return [];
    }
    
    return allChallenges || [];
  }
  
  return challenges || [];
} 