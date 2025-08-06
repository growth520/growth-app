import { supabase } from './customSupabaseClient';

/**
 * Updates the user's streak when they complete a challenge
 * @param {string} userId - The user's ID
 * @param {string} todayDate - Today's date in YYYY-MM-DD format
 * @param {boolean} isExtraChallenge - Whether this is an extra challenge (doesn't affect streak)
 * @returns {Promise<Object>} - Result of the streak update
 */
export const updateStreakOnChallengeCompletion = async (userId, todayDate, isExtraChallenge = false) => {
  // Extra challenges don't affect the streak
  if (isExtraChallenge) {
    return { success: true, message: 'Extra challenge - streak unchanged' };
  }

  try {
    // Start a transaction by using a single RPC call
    const { data, error } = await supabase.rpc('update_user_streak_on_completion', {
      p_user_id: userId,
      p_today_date: todayDate
    });

    if (error) {
      console.error('Error updating streak:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data,
      message: `Streak updated successfully. New streak: ${data.new_streak}`
    };

  } catch (error) {
    console.error('Error in streak update:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets the user's current streak information
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Current streak data
 */
export const getUserStreakInfo = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        streak,
        last_challenge_completed_date,
        streak_freeze_tokens,
        longest_streak
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        currentStreak: data.streak || 0,
        lastCompletedDate: data.last_challenge_completed_date,
        streakFreezeTokens: data.streak_freeze_tokens || 0,
        longestStreak: data.longest_streak || 0
      }
    };

  } catch (error) {
    console.error('Error getting streak info:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Checks if the user's streak is at risk (missed yesterday)
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Streak risk assessment
 */
export const checkStreakRisk = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('last_challenge_completed_date, streak, streak_freeze_tokens')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const lastCompletedDate = data.last_challenge_completed_date;
    const currentStreak = data.streak || 0;
    const streakFreezeTokens = data.streak_freeze_tokens || 0;

    if (!lastCompletedDate || currentStreak === 0) {
      return { 
        success: true, 
        isAtRisk: false, 
        canUseFreeze: false,
        message: 'No streak to protect'
      };
    }

    const today = new Date();
    const lastCompleted = new Date(lastCompletedDate);
    const daysDiff = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

    // Streak is at risk if more than 1 day has passed
    const isAtRisk = daysDiff > 1;
    const canUseFreeze = isAtRisk && streakFreezeTokens > 0 && daysDiff <= 3; // Max 2 missed days

    return {
      success: true,
      isAtRisk,
      canUseFreeze,
      missedDays: Math.max(0, daysDiff - 1),
      streakFreezeTokens,
      message: isAtRisk 
        ? `Streak at risk! Missed ${daysDiff - 1} day(s). ${canUseFreeze ? 'Can use streak freeze token.' : 'Cannot use streak freeze token.'}`
        : 'Streak is safe'
    };

  } catch (error) {
    console.error('Error checking streak risk:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Uses a streak freeze token to protect the streak
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Result of using the streak freeze token
 */
export const useStreakFreezeToken = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('use_streak_freeze_token', {
      p_user_id: userId
    });

    if (error) throw error;

    return {
      success: true,
      used: data,
      message: data ? 'Streak freeze token used successfully' : 'No streak freeze token available'
    };

  } catch (error) {
    console.error('Error using streak freeze token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets comprehensive streak statistics for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Comprehensive streak statistics
 */
export const getStreakStatistics = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        streak,
        longest_streak,
        last_challenge_completed_date,
        streak_freeze_tokens,
        total_challenges_completed
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Calculate streak milestones
    const currentStreak = data.streak || 0;
    const longestStreak = data.longest_streak || 0;
    const totalChallenges = data.total_challenges_completed || 0;

    const milestones = {
      streak7: currentStreak >= 7,
      streak30: currentStreak >= 30,
      streak100: currentStreak >= 100,
      longestStreak7: longestStreak >= 7,
      longestStreak30: longestStreak >= 30,
      longestStreak100: longestStreak >= 100
    };

    return {
      success: true,
      data: {
        currentStreak,
        longestStreak,
        totalChallenges,
        streakFreezeTokens: data.streak_freeze_tokens || 0,
        lastCompletedDate: data.last_challenge_completed_date,
        milestones
      }
    };

  } catch (error) {
    console.error('Error getting streak statistics:', error);
    return { success: false, error: error.message };
  }
};

export default {
  updateStreakOnChallengeCompletion,
  getUserStreakInfo,
  checkStreakRisk,
  useStreakFreezeToken,
  getStreakStatistics
}; 