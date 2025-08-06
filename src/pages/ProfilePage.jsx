import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, UserPlus, Filter, MoreVertical, Lock } from 'lucide-react';
import PostCard from '@/components/community/PostCard';
import CommentsModal from '@/components/community/CommentsModal';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { countries } from '@/lib/countries.js';
import Cropper from 'react-easy-crop';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trophy, Flame, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from '@/contexts/DataContext'; // Add useData import
import CompletedPacksSection from '@/components/gamification/CompletedPacksSection';
import { getLevelInfo } from '@/lib/levelSystem';
import PasswordManager from '@/components/PasswordManager';

const DEFAULT_USER_SETTINGS = {
  show_streak: true,
  show_level_xp: true,
  show_badges: true,
  allow_follower_view: true,
  allow_following_view: true
};

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-gray-200 mb-3" />
      <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-24 bg-gray-200 rounded" />
    </div>
    <div className="flex justify-center gap-8">
      <div className="text-center">
        <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="text-center">
        <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="text-center">
        <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-200 h-32 rounded-lg" />
      ))}
    </div>
  </div>
);

const ProfilePage = () => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userBadges, refreshAllData } = useData(); // Add userBadges from DataContext
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  const userId = isOwnProfile ? user?.id : paramUserId;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState('all');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [postState, setPostState] = useState([]); // for optimistic updates
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const fileInputRef = React.useRef(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempImage, setTempImage] = useState('');
  const [editGender, setEditGender] = useState(profile?.gender || '');
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showBlockConfirmDialog, setShowBlockConfirmDialog] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;
  const [userSettings, setUserSettings] = useState(DEFAULT_USER_SETTINGS);
  const [progressData, setProgressData] = useState({
    level: 1,
    xp: 0,
    streak: 0,
    badges: []
  });

  // Prefetch next page of posts (simplified)
  const prefetchNextPage = useCallback(async () => {
    if (!userId || !profile) return;
    const nextPage = Math.ceil(posts.length / ITEMS_PER_PAGE) + 1;
    const from = nextPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data } = await supabase
      .from('posts')
      .select('id, reflection, challenge_title, photo_url, category, created_at, user_id, likes_count, comments_count, shares_count, views_count')
      .eq('user_id', userId)
      .or('privacy.eq.public,visibility.eq.public')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data && data.length > 0) {
      return data.map(post => ({
        ...post,
        profiles: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        }
      }));
    }
    return data;
  }, [userId, posts.length, profile]);

  // Load initial data
  useEffect(() => {
    if (!userId || !user?.id) return;
    
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load profile first (most important)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load profile data. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setProfile(profileData);

        // Load other data in parallel (less critical)
        const [postsData, followersCount, followingData, settingsData, progressDataResult] = await Promise.all([
          // Initial posts (simplified query)
          supabase
            .from('posts')
            .select('id, reflection, challenge_title, photo_url, category, created_at, user_id, likes_count, comments_count, shares_count, views_count')
            .eq('user_id', userId)
            .or('privacy.eq.public,visibility.eq.public')
            .order('created_at', { ascending: false })
            .range(0, ITEMS_PER_PAGE - 1)
            .then(async ({ data }) => {
              if (data && data.length > 0) {
                // Add profile data to posts
                return data.map(post => ({
                  ...post,
                  profiles: {
                    id: profileData.id,
                    full_name: profileData.full_name,
                    avatar_url: profileData.avatar_url
                  }
                }));
              }
              return data || [];
            }),

          // Followers count
          supabase
            .from('follows')
            .select('follower_id', { count: 'exact', head: true })
            .eq('followed_id', userId)
            .then(({ count }) => count || 0),

          // Following status (only if not own profile)
          !isOwnProfile && user.id !== userId
            ? supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('followed_id', userId)
                .then(({ data }) => data)
            : Promise.resolve(null),

          // User settings (with fallback)
          supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single()
            .then(({ data, error }) => {
              if (error && error.code === 'PGRST116') {
                return DEFAULT_USER_SETTINGS;
              }
              return data || DEFAULT_USER_SETTINGS;
            }),

          // Progress data (with fallback)
          supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .single()
            .then(({ data, error }) => {
              if (error) {
                return { level: 1, xp: 0, streak: 0 };
              }
              return data;
            })
        ]);

        setPosts(postsData);
        setPostState(postsData);
        setPostsHasMore(postsData.length === ITEMS_PER_PAGE);
        setFollowers(followersCount);
        setIsFollowing(!!(followingData && followingData.length > 0));
        setUserSettings(settingsData);

        // Set progress data
        if (progressDataResult) {
          setProgressData({
            level: progressDataResult.level || 1,
            xp: progressDataResult.xp || 0,
            streak: progressDataResult.streak || 0,
            badges: [] // Will be loaded from DataContext for own profile
          });
        }
        
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [userId, user?.id, isOwnProfile]);

  // Update badges when DataContext userBadges changes (for own profile)
  useEffect(() => {
    if (isOwnProfile && userBadges) {
      setProgressData(prev => prev ? ({
        ...prev,
        badges: userBadges
      }) : null);
    }
  }, [userBadges, isOwnProfile]);

  // Refresh follower/following counts periodically
  useEffect(() => {
    if (!user || !userId) return;
    
    const refreshCounts = async () => {
      try {
        // Refresh followers count
        const { count: followersCount } = await supabase
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('followed_id', userId);
        
        // Refresh following count
        const { count: followingCount } = await supabase
          .from('follows')
          .select('followed_id', { count: 'exact', head: true })
          .eq('follower_id', userId);
        
        setFollowers(followersCount || 0);
        setFollowing(followingCount || 0);
      } catch (error) {
        console.error('Error refreshing counts:', error);
      }
    };
    
    // Refresh counts every 30 seconds
    const interval = setInterval(refreshCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user, userId]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditEmail(profile.email || '');
      setEditLocation(profile.location || '');
      setEditAvatar(profile.avatar_url || '');
      setEditBio(profile.bio || '');
      // Suggest a username if missing
      if (!profile.username) {
        let base = (profile.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!base) base = 'user';
        setEditUsername(base);
      } else {
        setEditUsername(profile.username);
      }
      setEditGender(profile.gender || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!userId) return;
    
    // Fetch user settings
    const fetchSettings = async () => {
      const { data: existingSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === '42P01') {
          console.error('user_settings table does not exist:', error);
          return;
        }
        if (error.code === 'PGRST116') {
          // Settings don't exist for this user, create them if it's the current user
          if (isOwnProfile) {
            const { data: newSettings, error: createError } = await supabase
              .from('user_settings')
              .insert([{ 
                user_id: userId,
                ...DEFAULT_USER_SETTINGS
              }])
              .select()
              .single();

            if (createError) {
              console.error('Error creating user settings:', createError);
              toast({
                title: "Error",
                description: "Failed to create user settings. Please try again.",
                variant: "destructive",
              });
              return;
            }

            setUserSettings(newSettings);
          } else {
            // For other users' profiles, use default settings
            setUserSettings(DEFAULT_USER_SETTINGS);
          }
        } else {
          console.error('Error fetching user settings:', error);
          toast({
            title: "Error",
            description: "Failed to load user settings. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setUserSettings(existingSettings);
      }
    };

    fetchSettings();
  }, [userId, isOwnProfile]);

  // Listen for follow status changes from other components
  useEffect(() => {
    const handleFollowStatusChange = async (event) => {
      const { followerId, followedId, isFollowing } = event.detail;
      
      // If the current user is involved in the follow action, refresh counts
      if (followerId === user?.id || followedId === userId) {
        await refreshFollowerCount(userId);
        await refreshFollowingCount(user?.id);
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [user?.id, userId]);

  // Filter posts by growth area
  const filteredPosts = areaFilter === 'all' ? postState : postState.filter(p => p.category === areaFilter);
  const uniqueAreas = Array.from(new Set(posts.map(p => p.category))).filter(Boolean);

  const handleFollow = async () => {
    if (!user?.id || user.id === userId) return;
    try {
      if (isFollowing) {
        const { error } = await supabase.from('follows').delete().match({ follower_id: user.id, followed_id: userId });
        if (error) throw error;
        setIsFollowing(false);
        // Refresh follower count for the target user
        await refreshFollowerCount(userId);
        // Refresh following count for the current user
        await refreshFollowingCount(user.id);
        // Refresh all data globally
        await refreshAllData();
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, followed_id: userId });
        if (error) throw error;
        setIsFollowing(true);
        // Refresh follower count for the target user
        await refreshFollowerCount(userId);
        // Refresh following count for the current user
        await refreshFollowingCount(user.id);
        // Refresh all data globally
        await refreshAllData();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  // Like logic
  const handleLikeToggle = async (postId) => {
    const post = postState.find(p => p.id === postId);
    if (!post || !user?.id) return;
    
    const isLiked = post.likes.some(l => l.user_id === user.id);

    try {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
      
      // Optimistic update only after successful database operation
      setPostState(currentPosts => currentPosts.map(p => {
        if (p.id === postId) {
          const newLikes = isLiked
            ? p.likes.filter(l => l.user_id !== user.id)
            : [...p.likes, { user_id: user.id }];
          return { ...p, likes: newLikes };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete post logic
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      
      // Refresh the posts
      if (user?.id === profile?.id) { // Assuming profile.id is the user's own ID
        // This part needs to be implemented if fetchOwnPosts is defined elsewhere
        // For now, we'll just remove it from the current posts state
        setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
        setPostState(currentPosts => currentPosts.filter(p => p.id !== postId));
      }
      
      toast({
        title: "Success",
        description: "Post deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Share logic
  const handleShare = (post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
  };

  // Comment logic (open comments modal or navigate to post)
  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setIsCommentsModalOpen(true);
  };

  const handleEditProfile = async () => {
    setEditError('');
    if (!editName.trim() && !editUsername.trim()) {
      setEditError('Name and username are required.');
      return;
    }
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!editUsername.trim()) {
      setEditError('Username is required.');
      return;
    }
    if (!isLocationValid) {
      setEditError('Please select a valid location.');
      return;
    }
    if (!isGenderValid) {
      setEditError('Please select a gender.');
      return;
    }
    const updates = {
      full_name: editName,
      username: editUsername,
      location: editLocation,
      avatar_url: editAvatar,
      bio: editBio,
      gender: editGender,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      setProfile({ ...profile, ...updates });
      setShowEditModal(false);
    } else {
      setEditError('Error updating profile: ' + error.message);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showImageCropper = (imgUrl) => {
    setTempImage(imgUrl);
    setShowCropModal(true);
  };

  const getCroppedImg = async (imageSrc, crop) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });
    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    );
    return canvas.toDataURL('image/jpeg');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      showImageCropper(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (tempImage && croppedAreaPixels) {
      const croppedImg = await getCroppedImg(tempImage, croppedAreaPixels);
      setEditAvatar(croppedImg);
      setShowCropModal(false);
      setTempImage('');
    }
  };

  const handleAvatarEdit = () => {
    setShowPhotoOptions(true);
  };
  const handlePhotoOption = (option) => {
    setShowPhotoOptions(false);
    if (option === 'camera') {
      if (fileInputRef.current) fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    } else if (option === 'library') {
      if (fileInputRef.current) fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleAvatarLibrary = () => {
    if (fileInputRef.current) fileInputRef.current.removeAttribute('capture');
    fileInputRef.current.click();
  };

  const handleAvatarDelete = () => {
    setEditAvatar('');
  };

  const handleInputCapitalize = (setter) => (e) => {
    const value = e.target.value;
    setter(value.charAt(0).toUpperCase() + value.slice(1));
  };

  const handleLocationInput = (e) => {
    const value = e.target.value;
    setEditLocation(value.charAt(0).toUpperCase() + value.slice(1));
    setShowLocationDropdown(true);
  };

  const handleLocationSelect = (country) => {
    setEditLocation(country.label);
    setShowLocationDropdown(false);
  };

  const filteredCountries = countries.filter(c => c.label.toLowerCase().startsWith(editLocation.toLowerCase()));
  const isLocationValid = !editLocation || countries.some(c => c.label === editLocation);
  const isGenderValid = !!editGender;

  const handleUsernameChange = (e) => {
    // Replace spaces with underscores and remove invalid characters
    let value = e.target.value.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    setEditUsername(value.charAt(0).toUpperCase() + value.slice(1));
  };

  const fetchFollowers = async (pageNumber = 0) => {
    setIsLoadingFollowers(true);
    try {
      const from = pageNumber * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      // First, get the follow relationships
      const { data: followsData, error, count } = await supabase
        .from('follows')
        .select('follower_id, created_at', { count: 'exact' })
        .eq('followed_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!followsData || followsData.length === 0) {
        setFollowersList([]);
        setHasMore(false);
        return;
      }

      // Then, fetch the user profiles separately
      const followerIds = followsData.map(f => f.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, assessment_results')
        .in('id', followerIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = {};
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Get follow status for each user
      const followStatuses = await Promise.all(
        followsData.map(async (follow) => {
          const profile = profilesMap[follow.follower_id];
          if (!profile) return null;

          const { data: isFollowing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user?.id)
            .eq('followed_id', profile.id)
            .single();
          
          return { ...profile, isFollowing: !!isFollowing };
        })
      );

      // Filter out any null entries
      const validFollowStatuses = followStatuses.filter(Boolean);

      if (pageNumber === 0) {
        setFollowersList(validFollowStatuses);
      } else {
        setFollowersList(current => [...current, ...validFollowStatuses]);
      }

      setHasMore(count > (pageNumber + 1) * ITEMS_PER_PAGE);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast({
        title: "Error",
        description: "Failed to load followers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollowers(false);
      setLoadingMore(false);
    }
  };

  const fetchFollowing = async (pageNumber = 0) => {
    setIsLoadingFollowing(true);
    try {
      const from = pageNumber * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // First, get the follow relationships
      const { data: followsData, error, count } = await supabase
        .from('follows')
        .select('followed_id, created_at', { count: 'exact' })
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!followsData || followsData.length === 0) {
        setFollowingList([]);
        setHasMore(false);
        return;
      }

      // Then, fetch the user profiles separately
      const followedIds = followsData.map(f => f.followed_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, assessment_results')
        .in('id', followedIds);

      if (profilesError) throw profilesError;

      // Create a map of user profiles
      const profilesMap = {};
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Get follow status for each user
      const followStatuses = await Promise.all(
        followsData.map(async (follow) => {
          const profile = profilesMap[follow.followed_id];
          if (!profile) return null;

          const { data: isFollowing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user?.id)
            .eq('followed_id', profile.id)
            .single();
          
          return { ...profile, isFollowing: !!isFollowing };
        })
      );

      // Filter out any null entries
      const validFollowStatuses = followStatuses.filter(Boolean);

      if (pageNumber === 0) {
        setFollowingList(validFollowStatuses);
      } else {
        setFollowingList(current => [...current, ...validFollowStatuses]);
      }

      setHasMore(count > (pageNumber + 1) * ITEMS_PER_PAGE);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast({
        title: "Error",
        description: "Failed to load following list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollowing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    if (showFollowersModal) {
      await fetchFollowers(page + 1);
    } else if (showFollowingModal) {
      await fetchFollowing(page + 1);
    }
  };

  // Load more posts
  const handleLoadMorePosts = async () => {
    if (!userId || !profile) return;
    
    setLoadingMore(true);
    try {
      const nextPage = Math.ceil(posts.length / ITEMS_PER_PAGE) + 1;
      const from = nextPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('posts')
        .select('id, reflection, challenge_title, photo_url, category, created_at, user_id, likes_count, comments_count, shares_count, views_count')
        .eq('user_id', userId)
        .or('privacy.eq.public,visibility.eq.public')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error loading more posts:', error);
        return;
      }

      if (data && data.length > 0) {
        const newPosts = data.map(post => ({
          ...post,
          profiles: {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        }));
        
        setPosts(prev => [...prev, ...newPosts]);
        setPostState(prev => [...prev, ...newPosts]);
        setPostsHasMore(newPosts.length === ITEMS_PER_PAGE);
      } else {
        setPostsHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowToggle = async (targetUserId) => {
    if (!user) return;
    
    try {
      const isCurrentlyFollowing = followersList.find(f => f.id === targetUserId)?.isFollowing ||
                                 followingList.find(f => f.id === targetUserId)?.isFollowing;

      if (isCurrentlyFollowing) {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, followed_id: targetUserId });

        // Update UI
        const updateList = (list) => list.map(item => 
          item.id === targetUserId ? { ...item, isFollowing: false } : item
        );

        setFollowersList(updateList);
        setFollowingList(updateList);
        setFollowing(prev => prev - 1);
        
        // Refresh follower count for the target user's profile
        await refreshFollowerCount(targetUserId);
        // Refresh following count for the current user
        await refreshFollowingCount(user.id);
        // Refresh all data globally
        await refreshAllData();
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, followed_id: targetUserId });

        // Update UI
        const updateList = (list) => list.map(item => 
          item.id === targetUserId ? { ...item, isFollowing: true } : item
        );

        setFollowersList(updateList);
        setFollowingList(updateList);
        setFollowing(prev => prev + 1);
        
        // Refresh follower count for the target user's profile
        await refreshFollowerCount(targetUserId);
        // Refresh following count for the current user
        await refreshFollowingCount(user.id);
        // Refresh all data globally
        await refreshAllData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to refresh follower count for a specific user
  const refreshFollowerCount = async (targetUserId) => {
    try {
      const { count } = await supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('followed_id', targetUserId);
      
      // If this is the current user's profile, update the followers count
      if (targetUserId === userId) {
        setFollowers(count || 0);
      }
    } catch (error) {
      console.error('Error refreshing follower count:', error);
    }
  };

  // Function to refresh following count for a specific user
  const refreshFollowingCount = async (targetUserId) => {
    try {
      const { count } = await supabase
        .from('follows')
        .select('followed_id', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);
      
      // If this is the current user's profile, update the following count
      if (targetUserId === userId) {
        setFollowing(count || 0);
      }
    } catch (error) {
      console.error('Error refreshing following count:', error);
    }
  };

  const handleOpenFollowers = () => {
    // Only show followers if allowed by settings
    if (isOwnProfile || userSettings.allow_follower_view) {
      fetchFollowers();
      setShowFollowersModal(true);
    } else {
      toast({
        title: "Private List",
        description: "This user's follower list is private",
        variant: "default",
      });
    }
  };

  const handleOpenFollowing = () => {
    // Only show following if allowed by settings
    if (isOwnProfile || userSettings.allow_following_view) {
      fetchFollowing();
      setShowFollowingModal(true);
    } else {
      toast({
        title: "Private List",
        description: "This user's following list is private",
        variant: "default",
      });
    }
  };

  const handleBlock = async () => {
    if (!userToBlock) return;
    
    try {
      // Add to blocks table
      await supabase
        .from('blocks')
        .insert({ blocker_id: user.id, blocked_id: userToBlock.id });

      // Remove from followers if they were following
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: userToBlock.id, followed_id: user.id });

      // Remove from following if you were following them
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: user.id, followed_id: userToBlock.id });

      // Update UI
      setFollowersList(current => current.filter(f => f.id !== userToBlock.id));
      setFollowers(prev => prev - 1);
      
      // Show success toast
      toast({
        title: "User Blocked",
        description: "This user has been blocked and removed from your followers.",
        variant: "default",
      });
      
      setShowBlockConfirmDialog(false);
      setUserToBlock(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (followingId) => {
    try {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: user.id, followed_id: followingId });

      setFollowingList(current => current.filter(f => f.id !== followingId));
      setFollowing(prev => prev - 1);

      // Refresh following count for the current user
      await refreshFollowingCount(user.id);
      // Refresh all data globally
      await refreshAllData();

      toast({
        title: "Unfollowed",
        description: "You are no longer following this user.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get level title
  const getLevelTitle = (level) => {
    const titles = {
      1: "Eager Beginner",
      2: "Growth Explorer",
      3: "Steady Climber",
      4: "Dedicated Learner",
      5: "Consistent Achiever",
      6: "Growth Master",
      7: "Wisdom Seeker",
      8: "Journey Champion",
      9: "Growth Virtuoso",
      10: "Enlightened Leader"
    };
    return titles[level] || `Level ${level} Master`;
  };

  // Calculate XP progress using quadratic level system
  const calculateXpProgress = (xp, level) => {
    const levelInfo = getLevelInfo(xp);
    return Math.round(levelInfo.progressPercentage);
  };

  // Helper function to get badge emoji
  const getBadgeEmoji = (badgeType) => {
    switch (badgeType) {
      case 'FIRST_CHALLENGE':
        return '🎯';
      case 'CHALLENGES_5':
        return '🌟';
      case 'CHALLENGES_10':
        return '💫';
      case 'CHALLENGES_25':
        return '⭐';
      case 'CHALLENGES_50':
        return '🏆';
      case 'LEVEL_2':
        return '🥉';
      case 'LEVEL_3':
        return '🥈';
      case 'LEVEL_4':
        return '🥇';
      case 'LEVEL_5':
        return '👑';
      case 'STREAK_7':
        return '🔥';
      case 'STREAK_30':
        return '🔥';
      case 'FIRST_REFLECTION':
        return '💭';
      case 'FIRST_SHARE':
        return '🤝';
      default:
        return '🏆';
    }
  };

  // Helper function to get badge name
  const getBadgeName = (badgeType) => {
    switch (badgeType) {
      case 'FIRST_CHALLENGE':
        return 'First Challenge';
      case 'CHALLENGES_5':
        return '5 Challenges';
      case 'CHALLENGES_10':
        return '10 Challenges';
      case 'CHALLENGES_25':
        return '25 Challenges';
      case 'CHALLENGES_50':
        return '50 Challenges';
      case 'LEVEL_2':
        return 'Level 2';
      case 'LEVEL_3':
        return 'Level 3';
      case 'LEVEL_4':
        return 'Level 4';
      case 'LEVEL_5':
        return 'Level 5';
      case 'STREAK_7':
        return '7-Day Streak';
      case 'STREAK_30':
        return '30-Day Streak';
      case 'FIRST_REFLECTION':
        return 'Deep Thinker';
      case 'FIRST_SHARE':
        return 'Community Builder';
      default:
        return 'Achievement';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
        <div className="container mx-auto px-4 pt-8 pb-24 max-w-2xl">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
      <div className="container mx-auto px-4 pt-8 pb-24 max-w-2xl">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-24 h-24 mb-3">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-2xl font-bold text-forest-green">{profile.full_name}</div>
          {profile.username && <div className="text-charcoal-gray/70 text-sm">@{profile.username}</div>}
          {profile.bio && <div className="text-charcoal-gray/80 text-base mt-2 text-center max-w-xl">{profile.bio}</div>}
          {profile.assessment_results?.userSelection && (
            <Badge className="mt-2 bg-leaf-green/10 text-leaf-green">{profile.assessment_results.userSelection}</Badge>
          )}
          <div className="flex gap-3 mt-4">
            {isOwnProfile ? (
              <Button onClick={() => setShowEditModal(true)} variant="outline" className="border-leaf-green text-leaf-green">
                Edit Info
              </Button>
            ) : (
              <>
                <Button onClick={handleFollow} variant={isFollowing ? 'outline' : 'default'} className={isFollowing ? 'border-leaf-green text-leaf-green' : 'bg-leaf-green text-white'}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button onClick={handleShareProfile} variant="outline" className="border-leaf-green text-leaf-green">
                  <Share2 className="w-4 h-4 mr-1" /> Share Profile
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-8 mt-4 text-charcoal-gray/70">
            <div className="text-center">
              <div className="font-semibold text-charcoal-gray">{posts.length}</div>
              <div className="text-sm">Posts</div>
            </div>
            <button 
              onClick={handleOpenFollowers}
              className={`text-center ${(!isOwnProfile && !userSettings.allow_follower_view) ? 'cursor-not-allowed opacity-70' : 'hover:text-forest-green transition-colors cursor-pointer'}`}
            >
              <div className="font-semibold text-charcoal-gray">{followers}</div>
              <div className="text-sm">Followers</div>
              {!isOwnProfile && !userSettings.allow_follower_view && (
                <Lock className="w-3 h-3 inline-block ml-1 text-charcoal-gray/50" />
              )}
            </button>
            <button 
              onClick={handleOpenFollowing}
              className={`text-center ${(!isOwnProfile && !userSettings.allow_following_view) ? 'cursor-not-allowed opacity-70' : 'hover:text-forest-green transition-colors cursor-pointer'}`}
            >
              <div className="font-semibold text-charcoal-gray">{following}</div>
              <div className="text-sm">Following</div>
              {!isOwnProfile && !userSettings.allow_following_view && (
                <Lock className="w-3 h-3 inline-block ml-1 text-charcoal-gray/50" />
              )}
            </button>
          </div>
        </div>
        {/* Gamification Summary */}
        {(userSettings.show_streak || userSettings.show_level_xp || userSettings.show_badges) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 w-full"
          >
            <Card className="bg-white/50 border-black/10">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {userSettings.show_streak && progressData.streak > 0 && (
                    <div className="flex items-center gap-3 text-charcoal-gray/80">
                      <div className="bg-warm-orange/10 p-2 rounded-full">
                        <Flame className="w-5 h-5 text-warm-orange" />
                      </div>
                      <div>
                        <div className="font-semibold">{progressData.streak}-Day Streak</div>
                        <div className="text-sm text-charcoal-gray/60">Keep up the momentum!</div>
                      </div>
                    </div>
                  )}

                  {userSettings.show_level_xp && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-charcoal-gray/80">
                        <div className="bg-forest-green/10 p-2 rounded-full">
                          <Trophy className="w-5 h-5 text-forest-green" />
                        </div>
                        <div>
                          <div className="font-semibold">Level {progressData.level} – {getLevelTitle(progressData.level)}</div>
                          <div className="text-sm text-charcoal-gray/60">{progressData.xp} XP</div>
                        </div>
                      </div>
                      <Progress 
                        value={calculateXpProgress(progressData.xp, progressData.level)} 
                        className="h-2 w-full bg-forest-green/10"
                      />
                    </div>
                  )}

                  {userSettings.show_badges && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-charcoal-gray/80">
                        <div className="bg-leaf-green/10 p-2 rounded-full">
                          <Star className="w-5 h-5 text-leaf-green" />
                        </div>
                        <div className="font-semibold">Recent Badges</div>
                      </div>
                      {progressData.badges?.length > 0 ? (
                        <ScrollArea className="w-full whitespace-nowrap">
                          <div className="flex space-x-4 p-1">
                            {progressData.badges.slice(0, 5).map((badge) => (
                              <div
                                key={badge.id}
                                className="flex-none inline-flex flex-col items-center gap-1 bg-white/50 rounded-lg p-3 border border-black/5"
                              >
                                <div className="text-2xl">
                                  {getBadgeEmoji(badge.badge_type)}
                                </div>
                                <div className="text-xs font-medium text-charcoal-gray/70 whitespace-normal text-center max-w-[80px]">
                                  {getBadgeName(badge.badge_type)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-charcoal-gray/60">
                          <Trophy className="w-12 h-12 mx-auto mb-3 text-charcoal-gray/30" />
                          <p className="text-sm">No badges to display</p>
                          <p className="text-xs mt-1">Complete challenges to earn your first badge!</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-forest-green hover:bg-forest-green/5"
                    onClick={() => navigate(`/progress${!isOwnProfile ? `/${userId}` : ''}`)}
                  >
                    See Full Progress <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Completed Packs Section */}
        <CompletedPacksSection 
          userId={userId} 
          isOwnProfile={isOwnProfile}
        />

        {/* Posts Section */}
        {/* Posts Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-forest-green" />
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="all">All Growth Areas</option>
            {uniqueAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        {/* Posts Feed */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center text-charcoal-gray/60 italic py-12">This user hasn't posted yet — but they're still growing 🌱</div>
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isLiked={post.likes?.some(l => l.user_id === user?.id) || false}
                onLike={() => handleLikeToggle(post.id)}
                onComment={() => handleOpenComments(post)}
                onShare={() => handleShare(post)}
                onViewComments={() => handleOpenComments(post)}
                onProfileClick={() => {}} // Profile page doesn't need profile clicks
              />
            ))
          )}
          
          {/* Load More Posts Button */}
          {postsHasMore && filteredPosts.length > 0 && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleLoadMorePosts}
                variant="outline"
                disabled={loadingMore}
                className="px-6"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                Load More Posts
              </Button>
            </div>
          )}
        </div>
        {/* Comments Modal */}
        {selectedPost && (
          <CommentsModal
            isOpen={isCommentsModalOpen}
            postId={selectedPost.id}
            onClose={() => setIsCommentsModalOpen(false)}
            onCommentAdded={() => {
              // Simple refetch - just update the comments count
              if (selectedPost) {
                setPosts(prev => prev.map(post => 
                  post.id === selectedPost.id 
                    ? { ...post, comments_count: (post.comments_count || 0) + 1 }
                    : post
                ));
                setPostState(prev => prev.map(post => 
                  post.id === selectedPost.id 
                    ? { ...post, comments_count: (post.comments_count || 0) + 1 }
                    : post
                ));
              }
            }}
          />
        )}

        {/* Followers Modal */}
        {(isOwnProfile || userSettings.allow_follower_view) && (
          <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
            <DialogContent className="bg-white sm:max-w-[425px] max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {isOwnProfile ? 'Followers' : `${profile.full_name}'s Followers`}
                </DialogTitle>
                <DialogDescription>
                  People who follow {isOwnProfile ? 'you' : profile.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4">
                {isLoadingFollowers && !loadingMore ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
                  </div>
                ) : followersList.length === 0 ? (
                  <div className="text-center text-charcoal-gray/60 italic py-8">
                    No followers yet — your journey still matters 🌱
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followersList.map(follower => (
                      <div key={follower.id} className="flex items-center justify-between p-2 hover:bg-forest-green/5 rounded-lg">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => {
                            setShowFollowersModal(false);
                            navigate(`/profile/${follower.id}`);
                          }}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={follower.avatar_url} alt={follower.full_name} />
                            <AvatarFallback>{follower.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{follower.full_name}</div>
                            <div className="text-sm text-charcoal-gray/60">@{follower.username}</div>
                          </div>
                          {follower.assessment_results?.userSelection && (
                            <Badge className="ml-2 bg-leaf-green/10 text-leaf-green text-xs">
                              {follower.assessment_results.userSelection}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwnProfile ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-charcoal-gray/50 hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => {
                                setUserToBlock(follower);
                                setShowBlockConfirmDialog(true);
                              }}
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          ) : follower.id !== user?.id && (
                            <Button
                              variant={follower.isFollowing ? "outline" : "default"}
                              size="sm"
                              className={follower.isFollowing ? "border-leaf-green text-leaf-green" : "bg-leaf-green text-white"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowToggle(follower.id);
                              }}
                            >
                              {follower.isFollowing ? 'Following' : 'Follow'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <div className="pt-4 text-center">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="w-full"
                        >
                          {loadingMore ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest-green"></div>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Following Modal */}
        {(isOwnProfile || userSettings.allow_following_view) && (
          <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
            <DialogContent className="bg-white sm:max-w-[425px] max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {isOwnProfile ? 'Following' : `${profile.full_name}'s Following`}
                </DialogTitle>
                <DialogDescription>
                  People {isOwnProfile ? 'you follow' : `${profile.full_name} follows`}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4">
                {isLoadingFollowing && !loadingMore ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
                  </div>
                ) : followingList.length === 0 ? (
                  <div className="text-center text-charcoal-gray/60 italic py-8">
                    Not following anyone yet — find some inspiration 🌟
                  </div>
                ) : (
                  <div className="space-y-4">
                    {followingList.map(following => (
                      <div key={following.id} className="flex items-center justify-between p-2 hover:bg-forest-green/5 rounded-lg">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => {
                            setShowFollowingModal(false);
                            navigate(`/profile/${following.id}`);
                          }}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={following.avatar_url} alt={following.full_name} />
                            <AvatarFallback>{following.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{following.full_name}</div>
                            <div className="text-sm text-charcoal-gray/60">@{following.username}</div>
                          </div>
                          {following.assessment_results?.userSelection && (
                            <Badge className="ml-2 bg-leaf-green/10 text-leaf-green text-xs">
                              {following.assessment_results.userSelection}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwnProfile ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-leaf-green text-leaf-green hover:bg-leaf-green/10"
                              onClick={() => handleUnfollow(following.id)}
                            >
                              Unfollow
                            </Button>
                          ) : following.id !== user?.id && (
                            <Button
                              variant={following.isFollowing ? "outline" : "default"}
                              size="sm"
                              className={following.isFollowing ? "border-leaf-green text-leaf-green" : "bg-leaf-green text-white"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowToggle(following.id);
                              }}
                            >
                              {following.isFollowing ? 'Following' : 'Follow'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {hasMore && (
                      <div className="pt-4 text-center">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="w-full"
                        >
                          {loadingMore ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forest-green"></div>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Photo Options Modal */}
        {showPhotoOptions && (
          <Dialog open={showPhotoOptions} onOpenChange={setShowPhotoOptions}>
            <DialogContent className="bg-white max-w-xs w-full">
              <DialogHeader>
                <DialogTitle>Change Profile Photo</DialogTitle>
                <DialogDescription>
                  Choose how you want to add your photo
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 p-4">
                <Button onClick={() => handlePhotoOption('library')}>Upload from Library</Button>
                <Button onClick={() => handlePhotoOption('camera')}>Take a New Photo</Button>
                <Button variant="outline" onClick={() => setShowPhotoOptions(false)}>Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Cropper Modal */}
        {showCropModal && tempImage && (
          <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
            <DialogContent className="bg-white max-w-lg w-full">
              <DialogHeader>
                <DialogTitle>Adjust Photo</DialogTitle>
                <DialogDescription>
                  Move and resize your photo to crop it
                </DialogDescription>
              </DialogHeader>
              <div className="relative w-full h-64">
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCropSave} className="bg-leaf-green text-white flex-1">Save Crop</Button>
                <Button variant="outline" onClick={() => setShowCropModal(false)} className="flex-1">Cancel</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Profile Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-white sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 cursor-pointer" onClick={handleAvatarEdit}>
                    <AvatarImage src={editAvatar} alt="Profile" />
                    <AvatarFallback>{editName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-forest-green text-white rounded-full p-1 cursor-pointer" onClick={handleAvatarEdit}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <Input
                  value={editName}
                  onChange={handleInputCapitalize(setEditName)}
                  placeholder="Enter your full name"
                  className="border-gray-300 focus:border-forest-green focus:ring-forest-green"
                />
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username *</label>
                <Input
                  value={editUsername}
                  onChange={handleUsernameChange}
                  placeholder="Enter username"
                  className="border-gray-300 focus:border-forest-green focus:ring-forest-green"
                />
                <p className="text-xs text-gray-500">Username can only contain letters, numbers, and underscores</p>
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <div className="relative">
                  <Input
                    value={editLocation}
                    onChange={handleLocationInput}
                    placeholder="Enter your location"
                    className="border-gray-300 focus:border-forest-green focus:ring-forest-green"
                  />
                  {showLocationDropdown && filteredCountries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCountries.slice(0, 10).map((country) => (
                        <div
                          key={country.value}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleLocationSelect(country)}
                        >
                          {country.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Gender Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gender *</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-green focus:border-forest-green"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="border-gray-300 focus:border-forest-green focus:ring-forest-green"
                />
              </div>

              {/* Password Management Section */}
              <div className="border-t pt-6 mt-6">
                <PasswordManager />
              </div>

              {/* Error Message */}
              {editError && (
                <div className="text-red-500 text-sm">{editError}</div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleEditProfile}
                  className="bg-forest-green hover:bg-forest-green/90 text-white flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Block Confirmation Dialog */}
        <Dialog open={showBlockConfirmDialog} onOpenChange={setShowBlockConfirmDialog}>
          <DialogContent className="bg-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Block User</DialogTitle>
              <DialogDescription>
                Are you sure you want to block {userToBlock?.full_name}? They will:
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Be removed from your followers</li>
                  <li>No longer be able to see your profile</li>
                  <li>No longer be able to follow or interact with you</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => {
                setShowBlockConfirmDialog(false);
                setUserToBlock(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBlock}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Block User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfilePage;