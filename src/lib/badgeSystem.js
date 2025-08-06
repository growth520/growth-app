import { supabase } from './customSupabaseClient';

/**
 * Check and award badges for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Result of badge checking
 */
export const checkAndAwardBadges = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('check_all_badges', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error checking badges:', error);
      return { success: false, error: error.message };
    }

    // Filter only awarded badges
    const awardedBadges = data.filter(badge => badge.awarded);
    
    return {
      success: true,
      awardedBadges,
      totalChecked: data.length,
      newlyAwarded: awardedBadges.length
    };

  } catch (error) {
    console.error('Error in badge check:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's earned badges
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - User's badges
 */
export const getUserBadges = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        earned_at,
        badges (
          id,
          name,
          description,
          icon_url,
          criteria_json
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      badges: data || []
    };

  } catch (error) {
    console.error('Error getting user badges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all available badges
 * @returns {Promise<Object>} - All badges
 */
export const getAllBadges = async () => {
  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('name');

    if (error) throw error;

    return {
      success: true,
      badges: data || []
    };

  } catch (error) {
    console.error('Error getting all badges:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has earned a specific badge
 * @param {string} userId - The user's ID
 * @param {string} badgeName - The badge name to check
 * @returns {Promise<Object>} - Whether user has the badge
 */
export const hasBadge = async (userId, badgeName) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badges.name', badgeName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return {
      success: true,
      hasBadge: !!data
    };

  } catch (error) {
    console.error('Error checking badge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get badge progress for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Badge progress information
 */
export const getBadgeProgress = async (userId) => {
  try {
    // Get all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('name');

    if (badgesError) throw badgesError;

    // Get user's earned badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    if (userBadgesError) throw userBadgesError;

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

    // Calculate progress for each badge type
    const progress = {
      challenges_completed: await getChallengeCount(userId),
      level: await getUserLevel(userId),
      streak: await getUserStreak(userId),
      reflection: await getReflectionCount(userId),
      share: await getShareCount(userId),
      likes_given: await getLikesGivenCount(userId),
      likes_received: await getLikesReceivedCount(userId),
      comments: await getCommentsCount(userId),
      pack_completion: await getPackCompletionCount(userId),
      ai_usage: await getAIUsageCount(userId),
      time_based: await getTimeBasedCount(userId),
      weekly_challenges: await getWeeklyChallengesCount(userId),
      monthly_challenges: await getMonthlyChallengesCount(userId)
    };

    // Map badges to progress
    const badgeProgress = allBadges.map(badge => {
      const badgeType = badge.criteria_json?.type;
      const target = badge.criteria_json?.target || 0;
      const current = progress[badgeType] || 0;
      const isEarned = earnedBadgeIds.has(badge.id);
      const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;

      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        type: badgeType,
        target,
        current,
        percentage,
        isEarned,
        icon_url: badge.icon_url,
        emoji: badge.icon_url // Use icon_url as emoji
      };
    });

    return {
      success: true,
      badgeProgress,
      totalBadges: allBadges.length,
      earnedBadges: earnedBadgeIds.size,
      progress
    };

  } catch (error) {
    console.error('Error getting badge progress:', error);
    return { success: false, error: error.message };
  }
};

// Helper functions to get user stats
const getChallengeCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('completed_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getUserLevel = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('level')
      .eq('user_id', userId)
      .single();

    return error ? 1 : (data?.level || 1);
  } catch (error) {
    return 1;
  }
};

const getUserStreak = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('streak')
      .eq('user_id', userId)
      .single();

    return error ? 0 : (data?.streak || 0);
  } catch (error) {
    return 0;
  }
};

const getReflectionCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('completed_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('reflection', 'is', null)
      .neq('reflection', '');

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getShareCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or('privacy.eq.public,visibility.eq.public');

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getLikesGivenCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getLikesReceivedCount = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('user_id', userId);

    if (error) return 0;
    
    return data.reduce((sum, post) => sum + (post.likes_count || 0), 0);
  } catch (error) {
    return 0;
  }
};

const getCommentsCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getPackCompletionCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('user_pack_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_challenges', 'total_challenges');

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getAIUsageCount = async (userId) => {
  try {
    // This would need to be implemented based on your AI usage tracking
    // For now, return 0 as placeholder
    return 0;
  } catch (error) {
    return 0;
  }
};

const getTimeBasedCount = async (userId) => {
  try {
    // Check for early bird and night owl completions
    const { data, error } = await supabase
      .from('completed_challenges')
      .select('completed_at')
      .eq('user_id', userId);

    if (error) return 0;

    let timeBasedCount = 0;
    data.forEach(challenge => {
      const hour = new Date(challenge.completed_at).getHours();
      if (hour < 8 || hour >= 22) {
        timeBasedCount++;
      }
    });

    return timeBasedCount;
  } catch (error) {
    return 0;
  }
};

const getWeeklyChallengesCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('completed_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

const getMonthlyChallengesCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('completed_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    return error ? 0 : count;
  } catch (error) {
    return 0;
  }
};

/**
 * Manually trigger badge check for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Result of manual badge check
 */
export const triggerBadgeCheck = async (userId) => {
  try {
    const result = await checkAndAwardBadges(userId);
    
    if (result.success && result.newlyAwarded > 0) {
      console.log(`🎖️ ${result.newlyAwarded} new badge(s) awarded!`);
    }
    
    return result;
  } catch (error) {
    console.error('Error triggering badge check:', error);
    return { success: false, error: error.message };
  }
};

export default {
  checkAndAwardBadges,
  getUserBadges,
  getAllBadges,
  hasBadge,
  getBadgeProgress,
  triggerBadgeCheck
}; 