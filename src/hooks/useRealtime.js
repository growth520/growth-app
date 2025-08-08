import { useEffect, useCallback, useRef } from 'react';
import realtimeManager from '@/lib/realtimeManager';

// Hook for community feed real-time updates
export const useCommunityRealtime = (posts, setPosts, userInteractions, setUserInteractions) => {
  const unsubscribeRef = useRef(null);

  const handleRealtimeUpdate = useCallback((update) => {
    switch (update.type) {
      case 'POST_ADDED':
        // Add new post to the top of the feed
        setPosts(prevPosts => {
          // Check if post already exists
          const exists = prevPosts.some(post => post.id === update.post.id);
          if (exists) return prevPosts;
          
          // Add profile data to the new post
          const postWithProfile = {
            ...update.post,
            profiles: {
              id: update.post.user_id,
              full_name: 'User', // Will be updated when profile is fetched
              avatar_url: null
            }
          };
          
          return [postWithProfile, ...prevPosts];
        });
        break;

      case 'POST_UPDATED':
        // Update existing post
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === update.post.id 
              ? { ...post, ...update.post }
              : post
          )
        );
        break;

      case 'LIKE_ADDED':
        // Update like count and user interaction
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === update.like.post_id) {
              return {
                ...post,
                likes_count: (post.likes_count || 0) + 1
              };
            }
            return post;
          })
        );

        // Update user interactions if it's the current user
        if (update.like.user_id === userInteractions?.user?.id) {
          setUserInteractions(prev => ({
            ...prev,
            likes: [...(prev.likes || []), update.like.post_id]
          }));
        }
        break;

      case 'COMMENT_ADDED':
        // Update comment count
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === update.comment.post_id) {
              return {
                ...post,
                comments_count: (post.comments_count || 0) + 1
              };
            }
            return post;
          })
        );
        break;
    }
  }, [setPosts, setUserInteractions, userInteractions?.user?.id]);

  useEffect(() => {
    // Subscribe to post updates
    const unsubscribePosts = realtimeManager.subscribeToPosts(handleRealtimeUpdate);
    const unsubscribeUpdates = realtimeManager.subscribeToPostUpdates(handleRealtimeUpdate);

    unsubscribeRef.current = () => {
      unsubscribePosts();
      unsubscribeUpdates();
    };

    return unsubscribeRef.current;
  }, [handleRealtimeUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

// Hook for user progress real-time updates
export const useProgressRealtime = (userId, setProgress) => {
  const unsubscribeRef = useRef(null);

  const handleProgressUpdate = useCallback((update) => {
    if (update.type === 'PROGRESS_UPDATED') {
      setProgress(update.progress);
    }
  }, [setProgress]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeManager.subscribeToUserProgress(userId, handleProgressUpdate);
    unsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [userId, handleProgressUpdate]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

// Hook for leaderboard real-time updates
export const useLeaderboardRealtime = (setLeaderboardData) => {
  const unsubscribeRef = useRef(null);

  const handleLeaderboardUpdate = useCallback((update) => {
    if (update.type === 'LEADERBOARD_UPDATED') {
      // Trigger a refresh of the leaderboard data
      setLeaderboardData(prevData => {
        // Update the specific user's data in the leaderboard
        return prevData.map(user => 
          user.id === update.progress.user_id 
            ? { ...user, ...update.progress }
            : user
        );
      });
    }
  }, [setLeaderboardData]);

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToLeaderboardUpdates(handleLeaderboardUpdate);
    unsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [handleLeaderboardUpdate]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

// Hook for notifications real-time updates
export const useNotificationsRealtime = (userId, setHasNewNotifications) => {
  const unsubscribeRef = useRef(null);

  const handleNotificationUpdate = useCallback((update) => {
    if (update.type === 'NOTIFICATION_ADDED') {
      setHasNewNotifications(true);
    }
  }, [setHasNewNotifications]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeManager.subscribeToNotifications(userId, handleNotificationUpdate);
    unsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [userId, handleNotificationUpdate]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

// Hook for profile real-time updates
export const useProfileRealtime = (userId, setProfile) => {
  const unsubscribeRef = useRef(null);

  const handleProfileUpdate = useCallback((update) => {
    if (update.type === 'PROFILE_UPDATED') {
      setProfile(update.profile);
    }
  }, [setProfile]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeManager.subscribeToProfileUpdates(userId, handleProfileUpdate);
    unsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [userId, handleProfileUpdate]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
};

// Hook for follows real-time updates
export const useFollowsRealtime = (setFollowers, setFollowing) => {
  const unsubscribeRef = useRef(null);

  const handleFollowUpdate = useCallback((update) => {
    switch (update.type) {
      case 'FOLLOW_ADDED':
        // Update followers/following counts
        setFollowers(prev => prev + 1);
        break;
      case 'FOLLOW_REMOVED':
        // Update followers/following counts
        setFollowers(prev => Math.max(0, prev - 1));
        break;
    }
  }, [setFollowers, setFollowing]);

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribeToFollows(handleFollowUpdate);
    unsubscribeRef.current = unsubscribe;

    return unsubscribe;
  }, [handleFollowUpdate]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
}; 