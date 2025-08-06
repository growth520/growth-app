import { supabase } from './customSupabaseClient';
import { updateStreakOnChallengeCompletion, getUserStreakInfo, checkStreakRisk, useStreakFreezeToken } from './streakSystem';

/**
 * Example: Complete a challenge and update streak
 */
export const completeChallengeAndUpdateStreak = async (userId: string, isExtraChallenge: boolean = false) => {
  try {
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Update streak when challenge is completed
    const result = await updateStreakOnChallengeCompletion(userId, todayDate, isExtraChallenge);
    
    if (result.success) {
      console.log('✅ Streak updated:', result.message);
      console.log('📊 New streak data:', result.data);
      
      // Refresh user data in the app
      // This would typically trigger a refresh of the DataContext
      
      return {
        success: true,
        newStreak: result.data?.new_streak,
        message: result.message
      };
    } else {
      console.error('❌ Streak update failed:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error completing challenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Check if user's streak is at risk
 */
export const checkUserStreakRisk = async (userId: string) => {
  try {
    const result = await checkStreakRisk(userId);
    
    if (result.success) {
      if (result.isAtRisk) {
        console.log('⚠️ Streak at risk:', result.message);
        
        if (result.canUseFreeze) {
          console.log('🛡️ Can use streak freeze token');
          return {
            success: true,
            isAtRisk: true,
            canUseFreeze: true,
            missedDays: result.missedDays,
            streakFreezeTokens: result.streakFreezeTokens,
            message: result.message
          };
        } else {
          console.log('❌ Cannot use streak freeze token');
          return {
            success: true,
            isAtRisk: true,
            canUseFreeze: false,
            missedDays: result.missedDays,
            streakFreezeTokens: result.streakFreezeTokens,
            message: result.message
          };
        }
      } else {
        console.log('✅ Streak is safe');
        return {
          success: true,
          isAtRisk: false,
          message: result.message
        };
      }
    } else {
      console.error('❌ Error checking streak risk:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error in streak risk check:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Use a streak freeze token
 */
export const useStreakFreezeTokenForUser = async (userId: string) => {
  try {
    const result = await useStreakFreezeToken(userId);
    
    if (result.success) {
      if (result.used) {
        console.log('🛡️ Streak freeze token used successfully');
        return {
          success: true,
          used: true,
          message: 'Streak protected with freeze token!'
        };
      } else {
        console.log('❌ Cannot use streak freeze token');
        return {
          success: true,
          used: false,
          message: 'No streak freeze token available or cannot be used'
        };
      }
    } else {
      console.error('❌ Error using streak freeze token:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error using streak freeze token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Get comprehensive streak information
 */
export const getUserStreakInformation = async (userId: string) => {
  try {
    const result = await getUserStreakInfo(userId);
    
    if (result.success) {
      console.log('📊 User streak info:', result.data);
      return {
        success: true,
        data: result.data
      };
    } else {
      console.error('❌ Error getting streak info:', result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error getting streak information:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Complete a challenge with full streak logic
 */
export const completeChallengeWithStreakLogic = async (userId: string, challengeId: number, reflection: string) => {
  try {
    // 1. First, check if this is an extra challenge
    const isExtraChallenge = false; // This would be determined by your app logic
    
    // 2. Complete the challenge in the database
    const { error: completionError } = await supabase
      .from('completed_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        reflection: reflection,
        completed_at: new Date().toISOString()
      });
    
    if (completionError) {
      throw new Error(`Failed to complete challenge: ${completionError.message}`);
    }
    
    // 3. Update streak
    const streakResult = await completeChallengeAndUpdateStreak(userId, isExtraChallenge);
    
    if (!streakResult.success) {
      console.warn('⚠️ Challenge completed but streak update failed:', streakResult.error);
    }
    
    // 4. Check if streak is at risk (for UI notifications)
    const riskResult = await checkUserStreakRisk(userId);
    
    // 5. Return comprehensive result
    return {
      success: true,
      challengeCompleted: true,
      streakUpdated: streakResult.success,
      newStreak: streakResult.newStreak,
      streakAtRisk: riskResult.isAtRisk,
      canUseFreeze: riskResult.canUseFreeze,
      message: streakResult.message
    };
    
  } catch (error) {
    console.error('❌ Error completing challenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Example: Handle streak freeze token usage
 */
export const handleStreakFreezeTokenUsage = async (userId: string) => {
  try {
    // 1. Check if streak is at risk
    const riskResult = await checkUserStreakRisk(userId);
    
    if (!riskResult.success) {
      return { success: false, error: riskResult.error };
    }
    
    if (!riskResult.isAtRisk) {
      return { success: true, message: 'Streak is not at risk' };
    }
    
    if (!riskResult.canUseFreeze) {
      return { 
        success: true, 
        message: 'Streak is at risk but cannot use freeze token',
        missedDays: riskResult.missedDays
      };
    }
    
    // 2. Use the streak freeze token
    const tokenResult = await useStreakFreezeTokenForUser(userId);
    
    if (tokenResult.success && tokenResult.used) {
      return {
        success: true,
        message: 'Streak protected with freeze token!',
        tokensUsed: 1
      };
    } else {
      return {
        success: true,
        message: 'Failed to use streak freeze token',
        error: tokenResult.message
      };
    }
    
  } catch (error) {
    console.error('❌ Error handling streak freeze token:', error);
    return { success: false, error: error.message };
  }
};

// Export all functions for use in the app
export default {
  completeChallengeAndUpdateStreak,
  checkUserStreakRisk,
  useStreakFreezeTokenForUser,
  getUserStreakInformation,
  completeChallengeWithStreakLogic,
  handleStreakFreezeTokenUsage
}; 