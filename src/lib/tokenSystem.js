import { supabase } from './customSupabaseClient';

// Token earning functions
export const awardTokens = async (userId, amount, source, description) => {
  try {
    const { data, error } = await supabase.rpc('award_tokens', {
      p_user_id: userId,
      p_amount: amount,
      p_source: source,
      p_description: description
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error awarding tokens:', error);
    return { success: false, error: error.message };
  }
};

// Level up token reward
export const awardLevelUpTokens = async (userId, newLevel) => {
  return await awardTokens(
    userId, 
    1, 
    'level_up', 
    `Level ${newLevel} achievement reward`
  );
};

// Milestone token reward (every 10 challenges)
export const awardMilestoneTokens = async (userId, challengeCount) => {
  if (challengeCount % 10 === 0) {
    return await awardTokens(
      userId, 
      1, 
      'milestone', 
      `${challengeCount} challenges completed milestone`
    );
  }
  return { success: false, error: 'Not a milestone' };
};

// Daily login bonus (7 consecutive days)
export const awardLoginBonusTokens = async (userId) => {
  try {
    // Check if user has 7 consecutive login days
    const { data: loginData, error } = await supabase
      .from('user_progress')
      .select('last_login_date, consecutive_login_days')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = loginData?.last_login_date;
    const consecutiveDays = loginData?.consecutive_login_days || 0;

    // Update login streak
    let newConsecutiveDays = 1;
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const daysDiff = (todayDate - lastLoginDate) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        newConsecutiveDays = consecutiveDays + 1;
      } else if (daysDiff === 0) {
        newConsecutiveDays = consecutiveDays; // Same day
      }
    }

    // Update login data
    await supabase
      .from('user_progress')
      .update({
        last_login_date: today,
        consecutive_login_days: newConsecutiveDays
      })
      .eq('user_id', userId);

    // Award token if 7 consecutive days
    if (newConsecutiveDays === 7) {
      await supabase
        .from('user_progress')
        .update({ consecutive_login_days: 0 }) // Reset counter
        .eq('user_id', userId);

      return await awardTokens(
        userId, 
        1, 
        'login_bonus', 
        '7-day consecutive login bonus'
      );
    }

    return { success: false, error: 'Login bonus not earned yet' };
  } catch (error) {
    console.error('Error checking login bonus:', error);
    return { success: false, error: error.message };
  }
};

// Get user token balance
export const getUserTokenBalance = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .eq('token_type', 'streak_freeze')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, balance: data?.balance || 0 };
  } catch (error) {
    console.error('Error getting token balance:', error);
    return { success: false, error: error.message, balance: 0 };
  }
};

// Use streak freeze token
export const useStreakFreezeToken = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('use_streak_freeze_token', {
      p_user_id: userId
    });

    if (error) throw error;
    return { success: data, used: data };
  } catch (error) {
    console.error('Error using streak freeze token:', error);
    return { success: false, error: error.message };
  }
};

// Check if streak needs freezing (user missed daily challenge)
export const checkStreakAtRisk = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('last_challenge_date, streak')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const lastChallengeDate = data?.last_challenge_date;
    const currentStreak = data?.streak || 0;
    
    if (!lastChallengeDate || currentStreak === 0) return false;

    const today = new Date();
    const lastChallenge = new Date(lastChallengeDate);
    const daysDiff = Math.floor((today - lastChallenge) / (1000 * 60 * 60 * 24));

    // Streak is at risk if more than 1 day has passed
    return daysDiff > 1;
  } catch (error) {
    console.error('Error checking streak risk:', error);
    return false;
  }
};

export default {
  awardTokens,
  awardLevelUpTokens,
  awardMilestoneTokens,
  awardLoginBonusTokens,
  getUserTokenBalance,
  useStreakFreezeToken,
  checkStreakAtRisk
}; 