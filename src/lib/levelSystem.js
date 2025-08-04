// Quadratic Level System Utilities
// Uses exponential growth: XP for next level = 100 × (Level ^ 1.5)

/**
 * Calculate level from total XP using the quadratic formula
 * @param {number} xp - Total XP
 * @returns {number} - Current level
 */
export const calculateLevelFromXP = (xp) => {
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
    
    // Safety check
    if (level > 1000) {
      level = 1000;
      break;
    }
  }
  
  return Math.max(1, level);
};

/**
 * Calculate total XP needed for a specific level
 * @param {number} level - Target level
 * @returns {number} - Total XP needed
 */
export const calculateTotalXPForLevel = (level) => {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.round(100 * Math.pow(i, 1.5));
  }
  return totalXP;
};

/**
 * Calculate XP needed for next level
 * @param {number} currentLevel - Current level
 * @returns {number} - XP needed for next level
 */
export const calculateXPForNextLevel = (currentLevel) => {
  return Math.round(100 * Math.pow(currentLevel + 1, 1.5));
};

/**
 * Calculate XP progress within current level
 * @param {number} xp - Current total XP
 * @param {number} level - Current level
 * @returns {object} - Progress information
 */
export const calculateXPProgress = (xp, level) => {
  const totalXPForCurrentLevel = calculateTotalXPForLevel(level);
  const totalXPForNextLevel = calculateTotalXPForLevel(level + 1);
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

/**
 * Get level progression information
 * @param {number} xp - Current total XP
 * @returns {object} - Complete level information
 */
export const getLevelInfo = (xp) => {
  const level = calculateLevelFromXP(xp);
  const progress = calculateXPProgress(xp, level);
  
  return {
    level,
    xp,
    xpInCurrentLevel: progress.xpInCurrentLevel,
    xpNeededForNextLevel: progress.xpNeededForNextLevel,
    progressPercentage: progress.progressPercentage,
    totalXPForCurrentLevel: progress.totalXPForCurrentLevel,
    totalXPForNextLevel: progress.totalXPForNextLevel
  };
};

// Level progression examples for reference
export const LEVEL_PROGRESSION = {
  1: { xpRange: '0-100', xpForLevel: 100 },
  2: { xpRange: '100-383', xpForLevel: 283 },
  3: { xpRange: '383-903', xpForLevel: 520 },
  4: { xpRange: '903-1703', xpForLevel: 800 },
  5: { xpRange: '1703-2918', xpForLevel: 1118 },
  10: { xpRange: '2918-6080', xpForLevel: 3162 },
  20: { xpRange: '6080-15024', xpForLevel: 8944 }
}; 