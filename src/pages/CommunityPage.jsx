import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  Users, 
  Sparkles, 
  Search,
  TrendingUp,
  Clock,
  Target,
  Smile,
  ChevronRight,
  Flame,
  Heart,
  MessageSquare,
  Share2,
  Trophy,
  ThumbsUp,
  Filter,
  X
} from 'lucide-react';
import PostCard from '@/components/community/PostCard';
import CommentsModal from '@/components/community/CommentsModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, refreshAllData } = useData();
  const { toast } = useToast();
  
  // Debug logging
  console.log('CommunityPage: Component loaded', { user, profile });
  
  // State management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('trending');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedGrowthArea, setSelectedGrowthArea] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [following, setFollowing] = useState([]);
  const [userInteractions, setUserInteractions] = useState({ likes: [], comments: [] });
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  
  // Search functionality
  const [searchActiveTab, setSearchActiveTab] = useState('users'); // 'users' or 'posts'
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchTimeoutRef = useRef(null);
  
  // Post popup modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostForModal, setSelectedPostForModal] = useState(null);
  
  // Refs
  const observerRef = useRef();

  // Test function to check database
  const testDatabase = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('=== DATABASE TEST ===');
      
      // Test 1: Check if posts table exists and has data
      const { data: postsTest, error: postsError } = await supabase
        .from('posts')
        .select('id, reflection, user_id, created_at')
        .limit(5);
      
      console.log('Posts test:', { data: postsTest, error: postsError });
      
      // Test 2: Check if profiles table exists
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .limit(5);
      
      console.log('Profiles test:', { data: profilesTest, error: profilesError });
      
      // Test 3: Check if posts table has data with profiles
      const { data: postsWithProfiles, error: postsWithProfilesError } = await supabase
        .from('posts')
        .select(`
          id,
          reflection,
          user_id,
          created_at,
          profiles (
            id,
            full_name,
            username
          )
        `)
        .limit(5);
      
      console.log('Posts with profiles test:', { data: postsWithProfiles, error: postsWithProfilesError });
      console.log('=== END DATABASE TEST ===');
      
    } catch (error) {
      console.error('Database test error:', error);
    }
  }, [user]);

  // Fetch user's following list
  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user.id)
        .limit(100);
      
      setFollowing(data?.map(f => f.followed_id) || []);
    } catch (error) {
      console.warn('Error fetching following, continuing without:', error);
      setFollowing([]);
    }
  }, [user]);

  // Fetch user interactions
  const fetchUserInteractions = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Fetching user interactions for user:', user.id);
      
      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .limit(100),
        supabase
          .from('comments')
          .select('post_id')
          .eq('user_id', user.id)
          .limit(100)
      ]);
      
      const likedPosts = likesResult.data?.map(l => l.post_id) || [];
      const commentedPosts = commentsResult.data?.map(c => c.post_id) || [];
      
      setUserInteractions({
        likes: likedPosts,
        comments: commentedPosts
      });
      
      console.log('User interactions loaded:', { likedPosts, commentedPosts });
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      setUserInteractions({ likes: [], comments: [] });
    }
  }, [user]);

  // Fetch posts directly from posts table with proper joins
  const fetchPosts = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      console.log('Fetching posts with filters:', { selectedTab, selectedFilter, selectedGrowthArea, searchQuery });
      
      setLoading(true);
      setIsLoadingFilters(true);
      
      const limit = 10;
      const offset = pageNum * limit;
      
      // Build query based on filters - start simple
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          challenge_id,
          challenge_title,
          reflection,
          photo_url,
          category,
          created_at,
          privacy,
          visibility,
          flagged,
          post_type,
          metadata,
          likes_count,
          comments_count
        `)
        .eq('privacy', 'public'); // Only show posts that are explicitly public
      
      // Apply filters
      if (selectedGrowthArea !== 'all') {
        query = query.eq('category', selectedGrowthArea);
      }
      
      // Apply tab filters
      if (selectedTab === 'my-posts') {
        if (user) {
          query = query.eq('user_id', user.id);
        }
      } else if (selectedTab === 'liked') {
        // For liked posts, we'll filter after fetching since we need to check userInteractions
        // This will be handled in the data transformation
      } else if (selectedTab === 'commented') {
        // For commented posts, we'll filter after fetching since we need to check userInteractions
        // This will be handled in the data transformation
      } else if (selectedTab === 'friends') {
        // For friends posts, we need to filter by users the current user follows
        // This will be handled in the data transformation
      }
      
      if (searchQuery.trim()) {
        query = query.or(`reflection.ilike.%${searchQuery}%,challenge_title.ilike.%${searchQuery}%`);
      }
      
      // Apply sorting based on filter
      switch (selectedFilter) {
        case 'trending':
          // Trending: Most liked with most viewed (likes_count first, then views_count)
          query = query.order('likes_count', { ascending: false })
                      .order('views_count', { ascending: false })
                      .order('created_at', { ascending: false });
          break;
        case 'recent':
          // Recent: Latest posts first
          query = query.order('created_at', { ascending: false });
          break;
        case 'growth-like-me':
          // Growth like me: Same growth area as current user
          // This will be handled in post-fetch filtering since we need user's growth area
          query = query.order('created_at', { ascending: false });
          break;
        case 'most-uplifting':
          // Most uplifting: Most comments first
          query = query.order('comments_count', { ascending: false })
                      .order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      console.log('Posts Response:', { data, error });
      
      if (error) {
        console.error('Posts Error details:', error);
        throw error;
      }
      
      // Fetch profiles separately to avoid relationship conflicts
      let profilesData = {};
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(post => post.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, assessment_results')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Profiles Error:', profilesError);
        } else {
          // Create a map of user_id to profile data
          profilesData = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }
      
      console.log('Fetched posts:', data?.length || 0, 'for filter:', selectedFilter);
      console.log('Sample post data:', data?.[0]);
      
      if (data && data.length > 0) {
        // Transform the data to match the expected format
        const transformedPosts = data.map(post => ({
          id: post.id,
          reflection: post.reflection,
          photo_url: post.photo_url,
          category: post.category,
          challenge_title: post.challenge_title,
          post_type: post.post_type,
          created_at: post.created_at,
          user_id: post.user_id,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: 0, // Default since this field might not exist
          views_count: 0,  // Default since this field might not exist
          profiles: profilesData[post.user_id] || {
            id: post.user_id,
            full_name: 'User', // Default fallback
            username: null,
            avatar_url: null,
            assessment_results: null
          }
        }));
        
        console.log('Transformed posts:', transformedPosts.length);
        
        // Apply post-fetch filtering for tabs that need user interaction data
        let filteredPosts = transformedPosts;
        
        if (selectedTab === 'liked') {
          if (user && userInteractions.likes.length > 0) {
            filteredPosts = transformedPosts.filter(post => 
              userInteractions.likes.includes(post.id)
            );
            console.log('Filtered liked posts:', filteredPosts.length);
          } else {
            filteredPosts = []; // No liked posts if not logged in or no likes
          }
        } else if (selectedTab === 'commented') {
          if (user && userInteractions.comments.length > 0) {
            filteredPosts = transformedPosts.filter(post => 
              userInteractions.comments.includes(post.id)
            );
            console.log('Filtered commented posts:', filteredPosts.length);
          } else {
            filteredPosts = []; // No commented posts if not logged in or no comments
          }
        } else if (selectedTab === 'friends') {
          if (user && following.length > 0) {
            filteredPosts = transformedPosts.filter(post => 
              following.includes(post.user_id)
            );
            console.log('Filtered friends posts:', filteredPosts.length);
          } else {
            filteredPosts = []; // No friends posts if not logged in or no following
          }
        }
        
        // Apply post-fetch filtering for filter types that need additional logic
        if (selectedFilter === 'growth-like-me') {
          // Get current user's growth area from profile
          if (user) {
            const currentUserProfile = profilesData[user.id];
            if (currentUserProfile?.assessment_results?.userSelection) {
              const userGrowthArea = currentUserProfile.assessment_results.userSelection;
              filteredPosts = filteredPosts.filter(post => 
                post.category === userGrowthArea
              );
              console.log('Filtered growth like me posts:', filteredPosts.length, 'for area:', userGrowthArea);
            }
          } else {
            filteredPosts = []; // No growth-like-me posts if not logged in
          }
        }
        
        if (refresh) {
          setPosts(filteredPosts);
          setPage(0);
        } else {
          setPosts(prev => pageNum === 0 ? filteredPosts : [...prev, ...filteredPosts]);
        }
        
        setHasMore(filteredPosts.length === limit);
      } else {
        console.log('No posts returned from query');
        if (refresh) {
          setPosts([]);
          setPage(0);
        } else {
          setPosts(prev => pageNum === 0 ? [] : [...prev]);
        }
        setHasMore(false);
      }
      
      setPage(pageNum);
      
    } catch (error) {
      console.error('Posts fetch error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsLoadingFilters(false);
    }
  }, [user, selectedTab, selectedFilter, selectedGrowthArea, searchQuery, toast]);

  // Infinite scroll observer
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPosts(page + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, page, fetchPosts]);

  // Handle filter changes
  const handleFilterChange = (filterId) => {
    console.log('Filter changed to:', filterId);
    setSelectedFilter(filterId);
    setPage(0);
  };

  // Handle tab changes
  const handleTabChange = (tabId) => {
    console.log('Tab changed to:', tabId);
    setSelectedTab(tabId);
    setPage(0);
  };

  // Handle growth area change
  const handleGrowthAreaChange = (area) => {
    console.log('Growth area changed to:', area);
    setSelectedGrowthArea(area);
    setPage(0);
  };

  // Handle search
  const handleSearch = (query) => {
    console.log('Search query changed to:', query);
    setSearchQuery(query);
    setPage(0);
  };

  // Enhanced like toggle with proper database updates
  const handleLikeToggle = async (postId) => {
    if (!user) return;

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existingLike) {
        // User already liked, so unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        // Update likes count in posts table
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        if (currentPost) {
          await supabase
            .from('posts')
            .update({ likes_count: Math.max(0, (currentPost.likes_count || 0) - 1) })
            .eq('id', postId);
        }
        
        // Update local state
        setUserInteractions(prev => ({
          ...prev,
          likes: prev.likes.filter(id => id !== postId)
        }));
        
        toast({
          title: "Unliked!",
          description: "Post unliked successfully.",
        });
      } else {
        // User hasn't liked, so like
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });
        
        // Update likes count in posts table
        const { data: currentPost } = await supabase
          .from('posts')
          .select('likes_count')
          .eq('id', postId)
          .single();
        
        if (currentPost) {
          await supabase
            .from('posts')
            .update({ likes_count: (currentPost.likes_count || 0) + 1 })
            .eq('id', postId);
        }
        
        // Update local state
        setUserInteractions(prev => ({
          ...prev,
          likes: [...prev.likes, postId]
        }));
        
        toast({
          title: "Liked!",
          description: "Post liked successfully.",
        });
      }
      
      // Refresh posts to update counts
      await fetchUserInteractions();
      fetchPosts(0, true);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle comment
  const handleComment = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  // Handle share
  const handleShare = async (post) => {
    try {
      const shareData = {
        title: 'Growth Challenge',
        text: post.reflection,
        url: `${window.location.origin}/post/${post.id}`
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Shared!",
          description: "Post link copied to clipboard.",
        });
      }
      
      // Note: Share count will only update when someone actually clicks the link
      // This prevents spam and gives more accurate metrics
      
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  // Handle profile click
  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Handle view comments
  const handleViewComments = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setShowCommentsModal(true);
    }
  };

  // Handle comment added
  const onCommentAdded = async (postId) => {
    await fetchUserInteractions();
    fetchPosts(0, true);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTab('all');
    setSelectedFilter('trending');
    setSelectedGrowthArea('all');
    setSearchQuery('');
    setPage(0);
  };

  // Search functions
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, users: [] }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search Error",
          description: "Failed to search users. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setSearchResults(prev => ({ ...prev, users: data || [] }));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const searchPosts = async (query) => {
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, posts: [] }));
      return;
    }

    try {
      // First, search posts without profiles join
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          reflection,
          challenge_title,
          photo_url,
          category,
          created_at,
          user_id
        `)
        .or(`reflection.ilike.%${query}%,challenge_title.ilike.%${query}%`)
        .eq('privacy', 'public')
        .limit(20);

      if (postsError) {
        console.error('Error searching posts:', postsError);
        toast({
          title: "Search Error",
          description: "Failed to search posts. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Then fetch profiles separately if we have posts
      let postsWithProfiles = postsData || [];
      if (postsWithProfiles.length > 0) {
        const userIds = [...new Set(postsWithProfiles.map(post => post.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          // Create a map of user_id to profile data
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});

          // Combine posts with profiles
          postsWithProfiles = postsWithProfiles.map(post => ({
            ...post,
            profiles: profilesMap[post.user_id] || {
              id: post.user_id,
              full_name: 'Anonymous User',
              username: 'user',
              avatar_url: null
            }
          }));
        }
      }

      setSearchResults(prev => ({ ...prev, posts: postsWithProfiles }));
    } catch (error) {
      console.error('Error searching posts:', error);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (debouncedSearchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        if (searchActiveTab === 'users') {
          await searchUsers(debouncedSearchQuery);
        } else {
          await searchPosts(debouncedSearchQuery);
        }
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults({ users: [], posts: [] });
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [debouncedSearchQuery, searchActiveTab]);

  // Handle search input change
  const handleSearchInputChange = (value) => {
    setDebouncedSearchQuery(value);
  };

  // Handle search tab change
  const handleSearchTabChange = (tab) => {
    setSearchActiveTab(tab);
    // If we have a search query, search for the new tab
    if (debouncedSearchQuery.trim()) {
      setIsSearching(true);
      if (tab === 'users') {
        searchUsers(debouncedSearchQuery);
      } else {
        searchPosts(debouncedSearchQuery);
      }
      setIsSearching(false);
    }
  };

  // Handle user follow/unfollow
  const handleFollowToggle = async (userId) => {
    if (!user) return;
    
    // Prevent users from following themselves
    if (userId === user.id) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own profile.",
        variant: "destructive"
      });
      return;
    }

    try {
      const isFollowing = following.includes(userId);
      
      console.log('Follow toggle attempt:', {
        userId,
        currentUserId: user.id,
        isFollowing,
        following: following
      });
      
      if (isFollowing) {
        // Unfollow
        console.log('Attempting to unfollow user:', userId);
        const { data, error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', userId);

        console.log('Unfollow result:', { data, error });

        if (error) throw error;
        
        setFollowing(prev => prev.filter(id => id !== userId));
        toast({
          title: "Unfollowed",
          description: "User unfollowed successfully.",
        });
      } else {
        // Follow
        console.log('Attempting to follow user:', userId);
        const followData = {
          follower_id: user.id,
          followed_id: userId
        };
        
        console.log('Follow data being sent:', followData);
        
        const { data, error } = await supabase
          .from('follows')
          .insert(followData)
          .select();

        console.log('Follow result:', { data, error });

        if (error) {
          console.error('Follow error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        setFollowing(prev => [...prev, userId]);
        toast({
          title: "Followed",
          description: "User followed successfully.",
        });
      }
      
      // Refresh the posts to update any follower-related data
      await fetchPosts();
      
      // Refresh all data to update follower/following counts across the app
      await refreshAllData();
      
      // Force refresh the following list to update the UI immediately
      await fetchFollowing();
      
      // Dispatch custom event to notify other components about follow status change
      window.dispatchEvent(new CustomEvent('followStatusChanged', {
        detail: {
          followerId: user.id,
          followedId: userId,
          isFollowing: !isFollowing
        }
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: `Failed to follow/unfollow user: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Handle post modal
  const handlePostModalOpen = (post) => {
    setSelectedPostForModal(post);
    setShowPostModal(true);
  };

  const handlePostModalClose = () => {
    setShowPostModal(false);
    setSelectedPostForModal(null);
  };

  // Handle post modal interactions
  const handlePostModalLike = async () => {
    if (!selectedPostForModal) return;
    await handleLikeToggle(selectedPostForModal.id);
    // Refresh the post data to update like count
    const updatedPost = { ...selectedPostForModal };
    updatedPost.likes_count = userInteractions.likes.includes(selectedPostForModal.id) 
      ? (updatedPost.likes_count || 1) - 1 
      : (updatedPost.likes_count || 0) + 1;
    setSelectedPostForModal(updatedPost);
  };

  const handlePostModalComment = () => {
    if (!selectedPostForModal) return;
    setShowCommentsModal(true);
  };

  const handlePostModalShare = async () => {
    if (!selectedPostForModal) return;
    await handleShare(selectedPostForModal);
  };

  const handlePostModalProfileClick = () => {
    if (!selectedPostForModal) return;
    navigate(`/profile/${selectedPostForModal.user_id}`);
    handlePostModalClose();
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchFollowing();
      fetchUserInteractions();
      testDatabase(); // Run database test on component load
    }
  }, [user, fetchFollowing, fetchUserInteractions, testDatabase]);

  // Fetch posts when filters change
  useEffect(() => {
    if (user) {
      console.log('Filters changed, fetching posts with:', { selectedTab, selectedFilter, selectedGrowthArea, searchQuery });
      fetchPosts(0, true);
    }
  }, [selectedTab, selectedFilter, selectedGrowthArea, searchQuery, fetchPosts, user]);

  // Poll for post updates (fallback for real-time)
  useEffect(() => {
    console.log('Setting up polling for post updates');
    
    const pollInterval = setInterval(async () => {
      if (posts.length > 0) {
        try {
          // Get current post IDs
          const postIds = posts.map(post => post.id);
          
          // Fetch updated post data
          const { data: updatedPosts, error } = await supabase
            .from('posts')
            .select('id, shares_count, views_count, likes_count, comments_count')
            .in('id', postIds);
          
          if (!error && updatedPosts) {
            // Update posts with new counts
            setPosts(prevPosts => 
              prevPosts.map(post => {
                const updatedPost = updatedPosts.find(p => p.id === post.id);
                if (updatedPost) {
                  return {
                    ...post,
                    shares_count: updatedPost.shares_count,
                    views_count: updatedPost.views_count,
                    likes_count: updatedPost.likes_count,
                    comments_count: updatedPost.comments_count
                  };
                }
                return post;
              })
            );
          }
        } catch (error) {
          console.error('Error polling for post updates:', error);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      console.log('Cleaning up polling');
      clearInterval(pollInterval);
    };
  }, [posts.length]);

  // Filter configurations
  const filters = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'growth-like-me', label: 'Growth Like Me', icon: Target },
    { id: 'most-uplifting', label: 'Most Uplifting', icon: Smile }
  ];

  const tabs = [
    { id: 'all', label: 'All Posts' },
    { id: 'my-posts', label: 'My Posts' },
    { id: 'liked', label: 'Liked' },
    { id: 'commented', label: 'Commented' },
    { id: 'friends', label: 'Friends' }
  ];

  const growthAreas = [
    { value: 'all', label: 'All Growth Areas', emoji: '🌟' },
    { value: 'Confidence', label: 'Confidence', emoji: '💪' },
    { value: 'Self-Worth', label: 'Self-Worth', emoji: '💎' },
    { value: 'Mindfulness', label: 'Mindfulness', emoji: '🧘' },
    { value: 'Communication', label: 'Communication', emoji: '🗣️' },
    { value: 'Resilience', label: 'Resilience', emoji: '⚡' },
    { value: 'Self-Control', label: 'Self-Control', emoji: '🎯' },
    { value: 'Discipline', label: 'Discipline', emoji: '📚' },
    { value: 'Fitness', label: 'Fitness', emoji: '🏋️' },
    { value: 'Purpose', label: 'Purpose', emoji: '🎯' },
    { value: 'Humility', label: 'Humility', emoji: '🙏' },
    { value: 'Gratitude', label: 'Gratitude', emoji: '🌟' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view the community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Community</h1>
            
            {/* Search */}
            <div className="flex items-center space-x-2">
              {showSearch ? (
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search users and posts..."
                    value={debouncedSearchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSearch(false);
                      setDebouncedSearchQuery('');
                      setSearchResults({ users: [], posts: [] });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showSearch && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Search Tabs */}
          <div className="flex items-center space-x-1 mb-4">
            <Button
              variant={searchActiveTab === 'users' ? "default" : "outline"}
              size="sm"
              onClick={() => handleSearchTabChange('users')}
              className="whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button
              variant={searchActiveTab === 'posts' ? "default" : "outline"}
              size="sm"
              onClick={() => handleSearchTabChange('posts')}
              className="whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Posts
            </Button>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-gray-600">Searching...</span>
              </div>
            ) : debouncedSearchQuery.trim() ? (
              <>
                {/* Users Results */}
                {searchActiveTab === 'users' && (
                  <div>
                    {searchResults.users.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.users.map((userResult) => (
                          <div
                            key={userResult.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/profile/${userResult.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                  {userResult.avatar_url ? (
                                    <img
                                      src={userResult.avatar_url}
                                      alt={userResult.full_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Users className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {userResult.full_name || 'Anonymous User'}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    @{userResult.username || 'user'}
                                  </p>
                                </div>
                              </div>
                              {userResult.id === user?.id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${userResult.id}`);
                                  }}
                                >
                                  View Profile
                                </Button>
                              ) : (
                                <Button
                                  variant={following.includes(userResult.id) ? "outline" : "default"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFollowToggle(userResult.id);
                                  }}
                                >
                                  {following.includes(userResult.id) ? 'Unfollow' : 'Follow'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-600">Try searching with different keywords.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Posts Results */}
                {searchActiveTab === 'posts' && (
                  <div>
                    {searchResults.posts.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.posts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handlePostModalOpen(post)}
                          >
                            <div className="flex items-start space-x-3">
                              {post.photo_url && (
                                <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                                  <img
                                    src={post.photo_url}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {post.challenge_title}
                                  </h3>
                                  {post.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {(() => {
                                        const area = growthAreas.find(a => a.value === post.category);
                                        return area ? `${area.emoji} ${area.label}` : post.category;
                                      })()}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {post.reflection?.length > 40 
                                    ? `${post.reflection.substring(0, 40)}...` 
                                    : post.reflection}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>{post.profiles?.full_name || 'Anonymous'}</span>
                                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                        <p className="text-gray-600">Try searching with different keywords.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search for users and posts</h3>
                <p className="text-gray-600">Type in the search bar above to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!showSearch && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Tabs */}
          <div className="flex items-center space-x-1 mb-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab.id)}
                disabled={isLoadingFilters}
                className={`whitespace-nowrap ${isLoadingFilters ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingFilters && selectedTab === tab.id ? (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {tab.label}
              </Button>
            ))}
          </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(filter.id)}
                disabled={isLoadingFilters}
                className={`whitespace-nowrap ${isLoadingFilters ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingFilters && selectedFilter === filter.id ? (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Icon className="h-3 w-3 mr-2" />
                )}
                <span className="text-xs font-medium">{filter.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Growth Area Filter */}
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedGrowthArea}
            onChange={(e) => handleGrowthAreaChange(e.target.value)}
            disabled={isLoadingFilters}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {growthAreas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.emoji} {area.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status Indicator */}
        {(selectedTab !== 'all' || selectedFilter !== 'trending' || selectedGrowthArea !== 'all' || searchQuery.trim()) && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                {selectedTab !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {tabs.find(t => t.id === selectedTab)?.label}
                  </Badge>
                )}
                {selectedFilter !== 'trending' && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.find(f => f.id === selectedFilter)?.label}
                  </Badge>
                )}
                {selectedGrowthArea !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    {(() => {
                      const area = growthAreas.find(a => a.value === selectedGrowthArea);
                      return area ? `${area.emoji} ${area.label}` : selectedGrowthArea;
                    })()}
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchQuery}"
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                ref={index === posts.length - 1 ? lastPostElementRef : null}
              >
                <PostCard
                  post={post}
                  isLiked={userInteractions.likes.includes(post.id)}
                  isCommented={userInteractions.comments.includes(post.id)}
                  onLike={() => handleLikeToggle(post.id)}
                  onComment={() => handleComment(post)}
                  onShare={() => handleShare(post)}
                  onProfileClick={() => handleProfileClick(post.user_id)}
                  onViewComments={() => handleViewComments(post.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-600">Loading posts...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                {selectedTab === 'liked' && 'You haven\'t liked any posts yet.'}
                {selectedTab === 'commented' && 'You haven\'t commented on any posts yet.'}
                {selectedTab === 'friends' && 'Your friends haven\'t posted anything yet.'}
                {selectedTab === 'my_posts' && 'You haven\'t created any posts yet.'}
                {selectedTab === 'all' && 'No posts match your current filters.'}
              </p>
              {selectedTab === 'my_posts' && (
                <Button onClick={() => navigate('/challenge')}>
                  Create Your First Post
                </Button>
              )}
            </div>
          )}

          {/* Load More Button */}
          {!loading && hasMore && posts.length > 0 && (
            <div className="flex justify-center py-6">
              <Button
                onClick={() => fetchPosts(page + 1)}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                Load More Posts
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Post Modal */}
      {showPostModal && selectedPostForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer" onClick={handlePostModalProfileClick}>
                  {selectedPostForModal.profiles?.avatar_url ? (
                    <img
                      src={selectedPostForModal.profiles.avatar_url}
                      alt={selectedPostForModal.profiles.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 cursor-pointer hover:text-blue-600" onClick={handlePostModalProfileClick}>
                    {selectedPostForModal.profiles?.full_name || 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedPostForModal.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePostModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Challenge Title and Growth Area */}
              <div className="flex items-center space-x-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedPostForModal.challenge_title}
                </h2>
                {selectedPostForModal.category && (
                  <Badge variant="secondary" className="text-sm">
                    {(() => {
                      const area = growthAreas.find(a => a.value === selectedPostForModal.category);
                      return area ? `${area.emoji} ${area.label}` : selectedPostForModal.category;
                    })()}
                  </Badge>
                )}
              </div>

              {/* Image */}
              {selectedPostForModal.photo_url && (
                <div className="mb-4">
                  <img
                    src={selectedPostForModal.photo_url}
                    alt="Post"
                    className="w-full rounded-lg max-h-96 object-cover"
                  />
                </div>
              )}

              {/* Reflection */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {selectedPostForModal.reflection}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 border-t border-gray-200 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePostModalLike}
                  className={`flex items-center space-x-2 ${
                    userInteractions.likes.includes(selectedPostForModal.id) 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${
                    userInteractions.likes.includes(selectedPostForModal.id) 
                      ? 'fill-current' 
                      : ''
                  }`} />
                  <span>{selectedPostForModal.likes_count || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePostModalComment}
                  className="flex items-center space-x-2 text-gray-600"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{selectedPostForModal.comments_count || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePostModalShare}
                  className="flex items-center space-x-2 text-gray-600"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showCommentsModal}
        postId={selectedPost?.id || selectedPostForModal?.id}
        onClose={() => {
          setShowCommentsModal(false);
          setSelectedPost(null);
          setSelectedPostForModal(null);
        }}
        onCommentAdded={onCommentAdded}
      />
    </div>
  );
};

export default CommunityPage;