
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth as useSupabaseAuth } from './SupabaseAuthContext';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import ConfettiCelebration from '@/components/gamification/ConfettiCelebration';
import { useProgressRealtime, useNotificationsRealtime, useProfileRealtime } from '@/hooks/useRealtime';

const DataContext = createContext(undefined);

// Feature flags to prevent 404 errors on non-existent tables
const NOTIFICATIONS_ENABLED = false;
const GAMIFICATION_ENABLED = true;
const COMMUNITY_PRELOAD_ENABLED = true;

// Feature flags for optional features
const DAILY_LOGIN_BONUS_ENABLED = false; // Disable until database function is properly deployed

export const DataProvider = ({ children }) => {
  const { user } = useSupabaseAuth();
  
  // Combine related state for better performance
  const [appState, setAppState] = useState({
    profile: null,
    progress: null,
    userBadges: [],
    loading: true,
    hasNewNotifications: false,
    notificationCheckInProgress: false,
    // Community preloading state
    communityData: {
      posts: [],
      loading: false,
      lastFetched: null,
      preloaded: false
    }
  });
  
  const [modalState, setModalState] = useState({
    levelUp: { show: false, newLevel: 0 },
    showConfetti: false
  });

  // Check daily login bonus when user loads
  useEffect(() => {
    const checkLoginBonus = async () => {
      if (!user || !DAILY_LOGIN_BONUS_ENABLED) return;
      
      try {
        const { data, error } = await supabase.rpc('check_daily_login_bonus', {
          p_user_id: user.id
        });
        
        if (data && !error) {
          // User earned login bonus
          // This could trigger a toast notification
        }
      } catch (error) {
        // Silently handle login bonus errors
        console.warn('Login bonus check failed:', error);
      }
    };

    // Check login bonus after a delay to not interfere with main loading
    if (user && !appState.loading) {
      setTimeout(checkLoginBonus, 2000);
    }
  }, [user, appState.loading]);

  // Memoized callbacks to prevent unnecessary re-renders
  const fetchAllData = useCallback(async (userId) => {
    if (!userId) return;
    
    setAppState(prev => ({ ...prev, loading: true }));
    
    try {
      // Batch all queries together for better performance
      const [profileResult, progressResult, badgesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_progress').select('*').eq('user_id', userId).single(),
        supabase.from('user_badges').select('*').eq('user_id', userId)
      ]);

      const updates = {};
      
      if (!profileResult.error) {
        updates.profile = profileResult.data;
      }
      
      if (!progressResult.error) {
        updates.progress = progressResult.data;
      }
      
      if (!badgesResult.error) {
        updates.userBadges = badgesResult.data || [];
      }
      
      updates.loading = false;
      setAppState(prev => ({ ...prev, ...updates }));
      
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Error fetching user data:', error.message);
      setAppState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error) {
        setAppState(prev => ({ ...prev, profile: data }));
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Error refreshing profile:', error);
    }
  }, [user]);

  const refreshProgress = useCallback(async () => {
    if (!user) return;
    
    console.log('🔄 DataContext: Refreshing progress for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error) {
        console.log('✅ DataContext: Progress refreshed:', {
          xp: data.xp,
          level: data.level,
          streak: data.streak
        });
        setAppState(prev => ({ ...prev, progress: data }));
      } else {
        console.log('❌ DataContext: Progress refresh error:', error.message);
      }
    } catch (error) {
      console.error('❌ DataContext: Error refreshing progress:', error);
    }
  }, [user]);

  const refreshHasNewNotifications = useCallback(async () => {
    if (!user || appState.notificationCheckInProgress) return;
    
    // Set flag to prevent multiple simultaneous requests
    setAppState(prev => ({ ...prev, notificationCheckInProgress: true }));
    
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count', { p_user_id: user.id });
      
      if (error) {
        console.error('Error fetching notification count:', error);
        setAppState(prev => ({ 
          ...prev, 
          hasNewNotifications: false,
          notificationCheckInProgress: false 
        }));
      } else {
        const hasNew = (data || 0) > 0;
        setAppState(prev => ({ 
          ...prev, 
          hasNewNotifications: hasNew,
          notificationCheckInProgress: false 
        }));
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
      setAppState(prev => ({ 
        ...prev, 
        hasNewNotifications: false,
        notificationCheckInProgress: false 
      }));
    }
  }, [user, appState.notificationCheckInProgress]);

  const refreshAllData = useCallback(() => {
    if (user) {
      fetchAllData(user.id);
    }
  }, [user, fetchAllData]);

  // Add manual refresh function for debugging
  const manualRefreshProgress = useCallback(async () => {
    console.log('🔧 Manual progress refresh triggered');
    await refreshProgress();
  }, [refreshProgress]);

  // Expose manual refresh to window for debugging
  if (typeof window !== 'undefined') {
    window.manualRefreshProgress = manualRefreshProgress;
    window.refreshAllData = refreshAllData;
  }

  const triggerLevelUp = useCallback((newLevel) => {
    setModalState(prev => ({
      ...prev,
      levelUp: { show: true, newLevel },
      showConfetti: true
    }));
  }, []);

  const updateLastViewedNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('mark_notifications_as_read', { p_user_id: user.id });

      if (!error) {
        setAppState(prev => ({
          ...prev,
          hasNewNotifications: false
        }));
      } else {
        console.error('Error marking notifications as read:', error);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  }, [user]);

  // Add function to trigger UI refresh after challenge completion
  const triggerChallengeCompletionRefresh = useCallback((completionData) => {
    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('challengeCompleted', {
      detail: {
        userId: user?.id,
        xpGained: completionData.xp_gained,
        newLevel: completionData.new_level,
        newStreak: completionData.new_streak,
        tokensEarned: completionData.tokens_earned,
        levelUp: completionData.level_up,
        streakIncreased: completionData.streak_increased
      }
    }));

    // Call get_user_leaderboard_rank function as requested in requirements
    const updateUserRanks = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
          p_user_id: user.id,
          p_rank_by: 'xp'
        });

        if (error) {
          console.error('Error updating user ranks after challenge completion:', error);
          return;
        }

        if (data && data.length > 0) {
          const ranks = data[0];
          console.log('User ranks updated after challenge completion:', {
            xpRank: ranks.xp_rank,
            streakRank: ranks.streak_rank,
            challengesRank: ranks.challenges_rank
          });
          
          // Store updated ranks in localStorage
          localStorage.setItem('userRanks', JSON.stringify(ranks));
        }
      } catch (error) {
        console.error('Error in updateUserRanks:', error);
      }
    };

    // Update user ranks immediately
    updateUserRanks();

    // Also refresh all data to ensure consistency
    setTimeout(() => {
      refreshAllData();
    }, 1000);
  }, [user?.id, refreshAllData]);

  // Community data preloading function - runs in background
  const preloadCommunityData = useCallback(async () => {
    if (!user || !COMMUNITY_PRELOAD_ENABLED) return;
    
    // Don't preload if already loaded recently (within 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (appState.communityData?.lastFetched && appState.communityData.lastFetched > fiveMinutesAgo) {
      return;
    }

    setAppState(prev => ({
      ...prev,
      communityData: { ...prev.communityData, loading: true }
    }));

    try {
      // Simplified query for preloading - just basic post data
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          reflection,
          challenge_title,
          created_at,
          category,
          user_id,
          visibility,
          flagged
        `)
        .eq('privacy', 'public')
        .is('flagged', false)
        .order('created_at', { ascending: false })
        .limit(15); // Preload fewer posts for speed

      if (error) throw error;

      if (postsData && postsData.length > 0) {
        // Fetch profiles separately to avoid relationship conflicts
        const userIds = [...new Set(postsData.map(post => post.user_id).filter(Boolean))];
        let profilesData = {};
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .in('id', userIds);
          
          if (profilesError) {
            console.error('Error fetching profiles for community preload:', profilesError);
          } else {
            profilesData = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }

        // Combine posts with profile data
        const postsWithProfiles = postsData.map(post => ({
          ...post,
          profiles: profilesData[post.user_id] || null
        }));

        // Get engagement data for preloaded posts
        const postIds = postsData.map(p => p.id);
        
        const [likesResult, commentsResult] = await Promise.all([
          supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
          supabase.from('comments').select('id, post_id, user_id, parent_comment_id').in('post_id', postIds).is('parent_comment_id', null)
        ]);

        // Process engagement data
        const likesMap = {};
        const commentsMap = {};

        (likesResult.data || []).forEach(like => {
          if (!likesMap[like.post_id]) likesMap[like.post_id] = [];
          likesMap[like.post_id].push(like);
        });

        (commentsResult.data || []).forEach(comment => {
          if (!commentsMap[comment.post_id]) commentsMap[comment.post_id] = [];
          commentsMap[comment.post_id].push(comment);
        });

        // Combine data with engagement
        const postsWithEngagement = postsWithProfiles.map(post => ({
          ...post,
          likes: likesMap[post.id] || [],
          comments: commentsMap[post.id] || [],
          ranking_score: ((likesMap[post.id] || []).length * 2) + 
                        ((commentsMap[post.id] || []).length * 3) +
                        (1 / ((Date.now() - new Date(post.created_at)) / (1000 * 60 * 60) + 2))
        }));

        // Sort by ranking score
        const sortedPosts = postsWithEngagement.sort((a, b) => b.ranking_score - a.ranking_score);

        setAppState(prev => ({
          ...prev,
          communityData: {
            posts: sortedPosts,
            loading: false,
            lastFetched: Date.now(),
            preloaded: true
          }
        }));
      } else {
        setAppState(prev => ({
          ...prev,
          communityData: {
            posts: [],
            loading: false,
            lastFetched: Date.now(),
            preloaded: true
          }
        }));
      }
    } catch (error) {
      // Silently handle preloading errors to not affect main app
      if (!import.meta.env.PROD) console.warn('Community preload failed:', error);
      setAppState(prev => ({
        ...prev,
        communityData: { ...prev.communityData, loading: false }
      }));
    }
  }, [user, appState.communityData?.lastFetched]);

  // Background preloading - starts after main data loads
  useEffect(() => {
    if (user && !appState.loading && COMMUNITY_PRELOAD_ENABLED) {
      // Delay preloading to not interfere with main app performance
      const preloadTimeout = setTimeout(() => {
        preloadCommunityData();
      }, 3000); // Wait 3 seconds after main data loads

      return () => clearTimeout(preloadTimeout);
    }
  }, [user, appState.loading, preloadCommunityData]);

  // Optimized useEffect with proper dependencies
  useEffect(() => {
    if (user) {
      fetchAllData(user.id);
    } else {
      setAppState({
        profile: null,
        progress: null,
        userBadges: [],
        loading: false,
        hasNewNotifications: false,
        notificationCheckInProgress: false,
        // Reset community data when no user
        communityData: {
          posts: [],
          loading: false,
          lastFetched: null,
          preloaded: false
        }
      });
    }
  }, [user, fetchAllData]);

  // Debounced notification refresh - reduced frequency to improve performance
  useEffect(() => {
    if (appState.progress && user) {
      const timeoutId = setTimeout(() => {
        refreshHasNewNotifications();
      }, 2000); // Increased from 100ms to 2s to reduce API calls
      return () => clearTimeout(timeoutId);
    }
  }, [appState.progress?.id, user?.id]); // More stable dependencies

  // Optimized realtime subscriptions - DISABLED due to auth errors
  useEffect(() => {
    if (!user) return;

    // TEMPORARILY DISABLED: Realtime subscriptions causing WebSocket auth errors
    // Will re-enable once authentication flow is fully stable
    console.log('Realtime subscriptions disabled to prevent auth errors');
    
    /*
    // Wait for a short delay to ensure session is properly established
    const timeoutId = setTimeout(async () => {
      // Verify session is still valid before setting up realtime
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No valid session, skipping realtime subscriptions');
        return;
      }

      const channels = [];
      
      // Single notification handler for better performance
      const handleNotificationUpdate = () => {
        refreshHasNewNotifications();
      };

      try {
        // Subscribe to relevant changes only
        const likesChannel = supabase.channel('public:likes')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'likes',
            filter: `post_id=in.(${user.id})` // Only user's posts
          }, handleNotificationUpdate)
          .subscribe();

        const commentsChannel = supabase.channel('public:comments')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `post_id=in.(${user.id})` // Only user's posts
          }, handleNotificationUpdate)
          .subscribe();
        
        const progressChannel = supabase.channel('public:user_progress')
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'user_progress', 
            filter: `user_id=eq.${user.id}` 
          }, (payload) => {
            setAppState(prev => ({ ...prev, progress: payload.new }));
          })
          .subscribe();

        channels.push(likesChannel, commentsChannel, progressChannel);
      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
      }

      return () => {
        channels.forEach(channel => {
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            console.error('Error removing realtime channel:', error);
          }
        });
      };
    }, 1000); // 1 second delay to ensure session is established

    return () => clearTimeout(timeoutId);
    */
  }, [user, refreshHasNewNotifications]);

  // Set up real-time subscriptions for notifications
  useEffect(() => {
    if (!user) return;

    // Skip real-time setup since it's disabled in the client config
    // console.log('🔔 Real-time disabled, using polling for notifications');
    
    // Set up polling instead of real-time
    const pollInterval = setInterval(() => {
      refreshHasNewNotifications();
    }, 30000); // Poll every 30 seconds
    
    return () => {
      // console.log('🔔 Cleaning up notification polling');
      clearInterval(pollInterval);
    };
  }, [user, refreshHasNewNotifications]);

  // Setup real-time updates
  useProgressRealtime(user?.id, (progress) => {
    setAppState(prev => ({ ...prev, progress }));
  });

  useNotificationsRealtime(user?.id, (hasNew) => {
    setAppState(prev => ({ ...prev, hasNewNotifications: hasNew }));
  });

  useProfileRealtime(user?.id, (profile) => {
    setAppState(prev => ({ ...prev, profile }));
  });

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    profile: appState.profile,
    progress: appState.progress,
    userBadges: appState.userBadges,
    loading: appState.loading,
    hasNewNotifications: appState.hasNewNotifications,
    // Community preloading data
    communityData: appState.communityData,
    preloadCommunityData,
    refreshProfile,
    refreshProgress,
    refreshAllData,
    refreshHasNewNotifications,
    triggerLevelUp,
    updateLastViewedNotifications,
    triggerChallengeCompletionRefresh
  }), [
    appState.profile,
    appState.progress,
    appState.userBadges,
    appState.loading,
    appState.hasNewNotifications,
    appState.communityData,
    preloadCommunityData,
    refreshProfile,
    refreshProgress,
    refreshAllData,
    refreshHasNewNotifications,
    triggerLevelUp,
    updateLastViewedNotifications,
    triggerChallengeCompletionRefresh
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
      
      {/* Modals */}
      <LevelUpModal 
        isOpen={modalState.levelUp.show}
        onClose={() => setModalState(prev => ({ ...prev, levelUp: { show: false, newLevel: 0 } }))}
        newLevel={modalState.levelUp.newLevel}
      />
      
      {modalState.showConfetti && (
        <ConfettiCelebration 
          onComplete={() => setModalState(prev => ({ ...prev, showConfetti: false }))} 
        />
      )}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// This hook is deprecated - use useAuth from SupabaseAuthContext instead
export const useAuthFromDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a DataProvider');
    }
    return { user: context.user };
}
