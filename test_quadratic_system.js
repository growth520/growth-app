// Test Quadratic Level System
// Run this in browser console to verify the new system

// Import the level system functions (if available)
if (typeof window !== 'undefined') {
  console.log('Testing Quadratic Level System...');
  
  // Test with user's 320 XP
  const testXP = 320;
  
  // Manual calculation using the quadratic formula
  const calculateLevelFromXP = (xp) => {
    if (xp < 100) return 1;
    
    let level = 1;
    let totalXPNeeded = 0;
    
    while (true) {
      const xpForNextLevel = Math.round(100 * Math.pow(level, 1.5));
      totalXPNeeded += xpForNextLevel;
      
      if (xp >= totalXPNeeded) {
        level++;
      } else {
        level--;
        break;
      }
      
      if (level > 1000) {
        level = 1000;
        break;
      }
    }
    
    return Math.max(1, level);
  };
  
  const calculateXPProgress = (xp, level) => {
    let totalXPForCurrentLevel = 0;
    let totalXPForNextLevel = 0;
    
    for (let i = 1; i <= level; i++) {
      totalXPForCurrentLevel += Math.round(100 * Math.pow(i, 1.5));
    }
    
    for (let i = 1; i <= level + 1; i++) {
      totalXPForNextLevel += Math.round(100 * Math.pow(i, 1.5));
    }
    
    const xpInCurrentLevel = Math.max(0, xp - totalXPForCurrentLevel);
    const xpNeededForNextLevel = totalXPForNextLevel - totalXPForCurrentLevel;
    const progressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
    
    return {
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercentage,
      totalXPForCurrentLevel,
      totalXPForNextLevel
    };
  };
  
  // Test calculations
  const level = calculateLevelFromXP(testXP);
  const progress = calculateXPProgress(testXP, level);
  
  console.log('=== Quadratic Level System Test ===');
  console.log(`User XP: ${testXP}`);
  console.log(`Calculated Level: ${level}`);
  console.log(`XP in Current Level: ${progress.xpInCurrentLevel}`);
  console.log(`XP Needed for Next Level: ${progress.xpNeededForNextLevel}`);
  console.log(`Progress Percentage: ${progress.progressPercentage.toFixed(1)}%`);
  console.log(`Total XP for Current Level: ${progress.totalXPForCurrentLevel}`);
  console.log(`Total XP for Next Level: ${progress.totalXPForNextLevel}`);
  console.log(`XP to Next Level: ${progress.xpNeededForNextLevel - progress.xpInCurrentLevel}`);
  
  // Expected results for 320 XP:
  // Level 2 (100-383 XP range)
  // 220 XP into Level 2 (320 - 100)
  // 163 XP needed for Level 3 (383 - 320)
  // Progress: 220/283 = 77.7%
  
  console.log('\n=== Expected Results ===');
  console.log('Level: 2');
  console.log('XP Progress: 220/283');
  console.log('Progress: 77.7%');
  console.log('XP to Level 3: 63');
  
  console.log('\n=== Verification ===');
  console.log(`Level correct: ${level === 2 ? '✅' : '❌'}`);
  console.log(`XP in level correct: ${progress.xpInCurrentLevel === 220 ? '✅' : '❌'}`);
  console.log(`XP needed correct: ${progress.xpNeededForNextLevel === 283 ? '✅' : '❌'}`);
  
  // Check if the UI should now show the correct values
  console.log('\n=== UI Should Now Show ===');
  console.log('Level: 2');
  console.log('XP Progress: 220/283');
  console.log('Progress Bar: ~78% filled');
  console.log('XP to Level 3: 63');
  
} else {
  console.log('This script should be run in a browser console');
} 