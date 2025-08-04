import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eceojrvqdsfjakprojgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZW9qcnZxZHNmamFrcHJvamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTYwNzQsImV4cCI6MjA2ODI3MjA3NH0.eIOXcXjz69axkq7MDJEwRSJgUtlyILbQO0f2WXw5PAU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeChallengeCategories() {
  console.log('🔍 Analyzing Challenge Categories...\n');
  
  try {
    // Get all unique categories by querying in chunks
    let allCategories = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
      const { data: chunk, error } = await supabase
        .from('challenges')
        .select('category')
        .not('category', 'is', null)
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching categories:', error);
        break;
      }
      
      if (!chunk || chunk.length === 0) {
        break;
      }
      
      allCategories = allCategories.concat(chunk);
      offset += limit;
      
      console.log(`Fetched ${chunk.length} challenges (offset: ${offset - limit})`);
      
      // Stop if we've fetched enough or if we're getting fewer results than the limit
      if (chunk.length < limit) {
        break;
      }
    }
    
    console.log(`\nTotal challenges fetched: ${allCategories.length}`);
    
    // Count occurrences of each category
    const categoryCounts = {};
    allCategories.forEach(challenge => {
      const category = challenge.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Sort by count (descending)
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a);
    
    console.log('📊 Challenge Categories Found:');
    console.log('============================');
    console.log(`Total challenges: ${allCategories.length}`);
    console.log(`Unique categories: ${sortedCategories.length}\n`);
    
    console.log('All Categories:');
    sortedCategories.forEach(([category, count], index) => {
      console.log(`${index + 1}. "${category}" - ${count} challenges`);
    });
    
    // Check for potential mapping issues
    console.log('\n🔍 Potential Mapping Issues:');
    console.log('============================');
    
    const assessmentGrowthAreas = [
      'Confidence', 'Self-Worth', 'Mindfulness', 'Communication', 
      'Resilience', 'Self-Control', 'Discipline', 'Fitness', 
      'Purpose', 'Humility', 'Gratitude'
    ];
    
    const foundCategories = sortedCategories.map(([category]) => category);
    
    // Find categories that don't match any growth area
    const unmappedCategories = foundCategories.filter(category => {
      const normalizedCategory = category.toLowerCase();
      return !assessmentGrowthAreas.some(area => 
        normalizedCategory.includes(area.toLowerCase()) || 
        area.toLowerCase().includes(normalizedCategory)
      );
    });
    
    if (unmappedCategories.length > 0) {
      console.log('❌ Categories that might need mapping:');
      unmappedCategories.forEach(category => {
        console.log(`   - "${category}"`);
      });
    } else {
      console.log('✅ All categories appear to be mapped!');
    }
    
    // Suggest mappings
    console.log('\n💡 Suggested Mappings for growthAreaMapping.js:');
    console.log('===============================================');
    
    const suggestedMappings = {};
    assessmentGrowthAreas.forEach(growthArea => {
      const matchingCategories = foundCategories.filter(category => {
        const normalizedCategory = category.toLowerCase();
        const normalizedArea = growthArea.toLowerCase();
        return normalizedCategory.includes(normalizedArea) || 
               normalizedArea.includes(normalizedCategory);
      });
      
      if (matchingCategories.length > 0) {
        suggestedMappings[growthArea] = matchingCategories;
      }
    });
    
    Object.entries(suggestedMappings).forEach(([growthArea, categories]) => {
      console.log(`\n'${growthArea}': [`);
      categories.forEach(category => {
        console.log(`  '${category}',`);
      });
      console.log('],');
    });
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`• Total challenges: ${allCategories.length}`);
    console.log(`• Unique categories: ${sortedCategories.length}`);
    console.log(`• Categories needing mapping: ${unmappedCategories.length}`);
    console.log(`• Assessment growth areas: ${assessmentGrowthAreas.length}`);
    
    if (unmappedCategories.length > 0) {
      console.log('\n⚠️  Recommendations:');
      console.log('1. Review the unmapped categories above');
      console.log('2. Update the growthAreaMapping.js file with suggested mappings');
      console.log('3. Consider standardizing category names in your challenges data');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing categories:', error);
  }
}

// Run the analysis
analyzeChallengeCategories(); 