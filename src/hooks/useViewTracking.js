import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Session storage for tracking viewed posts
const VIEWED_POSTS_KEY = 'viewed_posts_session';

// Get viewed posts from session storage
const getViewedPosts = () => {
  try {
    const stored = sessionStorage.getItem(VIEWED_POSTS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (error) {
    console.warn('Error reading viewed posts from session storage:', error);
    return new Set();
  }
};

// Save viewed posts to session storage
const saveViewedPosts = (viewedPosts) => {
  try {
    sessionStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify([...viewedPosts]));
  } catch (error) {
    console.warn('Error saving viewed posts to session storage:', error);
  }
};

// Add a post to viewed posts
const addViewedPost = (postId) => {
  const viewedPosts = getViewedPosts();
  viewedPosts.add(postId);
  saveViewedPosts(viewedPosts);
  return viewedPosts;
};

// Check if a post has been viewed
const hasViewedPost = (postId) => {
  return getViewedPosts().has(postId);
};

export const useViewTracking = () => {
  const { user } = useAuth();
  const observerRef = useRef(null);
  const timeoutRefs = useRef(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Track a view for a post
  const trackView = useCallback(async (postId, postUserId) => {
    console.log('🔍 trackView called:', { postId, postUserId, currentUser: user?.id });
    
    if (!user || !postId) {
      console.log('❌ Missing user or postId:', { user: !!user, postId: !!postId });
      return;
    }

    // Skip if viewing own post
    if (postUserId === user.id) {
      console.log('⏭️ Skipping view tracking for own post:', postId);
      return;
    }

    // Skip if already viewed in this session
    if (hasViewedPost(postId)) {
      console.log('🔄 Post already viewed in this session:', postId);
      return;
    }

    console.log('📊 Attempting to track view for post:', postId);

    try {
      // Call the RPC function to increment view count
      const { data, error } = await supabase
        .rpc('increment_post_view', {
          post_id: postId,
          viewer_id: user.id
        });

      if (error) {
        console.error('❌ Error tracking view:', error);
        return;
      }

      // Mark as viewed in session storage
      addViewedPost(postId);
      console.log('✅ View tracked successfully for post:', postId);

    } catch (error) {
      console.error('❌ Exception tracking view:', error);
    }
  }, [user]);

  // Create intersection observer for view tracking
  const createViewObserver = useCallback((onView) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const { target, isIntersecting, intersectionRatio } = entry;
          const postId = target.dataset.postId;
          const postUserId = target.dataset.postUserId;
          const timeoutKey = `view_${postId}`;

          console.log('👁️ Intersection Observer:', { 
            postId, 
            isIntersecting, 
            intersectionRatio, 
            threshold: 0.5 
          });

          if (isIntersecting && intersectionRatio >= 0.5) {
            console.log('⏱️ Starting 500ms timer for post:', postId);
            // Post is 50% visible, start 1-second timer
            const timeout = setTimeout(() => {
              console.log('⏰ Timer completed, calling onView for post:', postId);
              onView(postId, postUserId);
              timeoutRefs.current.delete(timeoutKey);
            }, 500); // Reduced to 500ms for better testing

            timeoutRefs.current.set(timeoutKey, timeout);
          } else {
            // Post is not visible enough, clear timeout
            const existingTimeout = timeoutRefs.current.get(timeoutKey);
            if (existingTimeout) {
              console.log('❌ Clearing timer for post:', postId);
              clearTimeout(existingTimeout);
              timeoutRefs.current.delete(timeoutKey);
            }
          }
        });
      },
      {
        threshold: 0.5, // 50% visibility required
        rootMargin: '0px 0px -10% 0px' // Slight margin for better detection
      }
    );

    return observerRef.current;
  }, []);

  // Track view immediately (for modal opens, etc.)
  const trackViewImmediate = useCallback(async (postId, postUserId) => {
    await trackView(postId, postUserId);
  }, [trackView]);

  // Cleanup observer
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  return {
    createViewObserver,
    trackView,
    trackViewImmediate,
    cleanup,
    hasViewedPost
  };
}; 