import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Flame, 
  Target, 
  Users,
  Crown,
  TrendingUp,
  Award,
  Star,
  Search,
  Medal,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { progress } = useData();
  
  // State management
  const [selectedFilter, setSelectedFilter] = useState('xp');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [communityStats, setCommunityStats] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastCommunityStatsUpdate, setLastCommunityStatsUpdate] = useState(0);

  // Filter configuration - Using correct database column names
  const filters = [
    {
      key: 'xp',
      label: 'XP',
      description: 'Users with the highest experience points',
      icon: Crown,
      sortField: 'xp',
      statLabel: 'XP'
    },
    {
      key: 'streak',
      label: 'Streak',
      description: 'Longest current streaks',
      icon: Flame,
      sortField: 'streak',
      statLabel: 'Days'
    },
    {
      key: 'challenges',
      label: 'Challenges Completed',
      description: 'Most challenges completed',
      icon: Target,
      sortField: 'total_challenges_completed',
      statLabel: 'Challenges'
    }
  ];

  const currentFilter = filters.find(f => f.key === selectedFilter);

  // Fetch leaderboard data with exact requirements
  const fetchLeaderboardData = async (filterKey, pageNum = 1, isSearch = false, searchQuery = '') => {
    try {
      const filter = filters.find(f => f.key === filterKey);
      const limit = 10; // Top 10 as requested
      const offset = (pageNum - 1) * limit;

      let progressData, error;

      // Use different approach for challenges filter
      if (filterKey === 'challenges') {
        try {
          // Use the get_leaderboard_by_challenges function
          const { data: challengeData, error: challengeError } = await supabase.rpc(
            'get_leaderboard_by_challenges',
            { 
              p_limit: limit,
              p_offset: offset
            }
          );
          
          if (challengeError) throw challengeError;
          
          // Transform the data to match expected format
          progressData = (challengeData || []).map(user => ({
            user_id: user.user_id,
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            total_challenges_completed: user.challenge_count,
            profiles: user.profiles
          }));
        } catch (challengeError) {
          console.warn('Challenge leaderboard function not available, falling back to regular query');
          // Fallback to regular query - fetch user_progress first, then profiles separately
          let query = supabase
            .from('user_progress')
            .select(`
              user_id,
              xp,
              streak,
              total_challenges_completed
            `)
            .order('total_challenges_completed', { ascending: false });

          if (!isSearch) {
            query = query.range(offset, offset + limit - 1);
          }

          const result = await query;
          progressData = result.data;
          error = result.error;

          // If we got user_progress data, fetch profiles separately
          if (progressData && progressData.length > 0) {
            const userIds = [...new Set(progressData.map(user => user.user_id))];
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, username, avatar_url')
              .in('id', userIds)
              .eq('has_completed_assessment', true);
            
            if (profilesError) {
              console.error('Profiles Error:', profilesError);
            } else {
              // Create a map of user_id to profile data
              const profilesMap = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile;
                return acc;
              }, {});
              
              // Filter progressData to only include users with profiles (who completed assessment)
              progressData = progressData.filter(user => profilesMap[user.user_id]);
              
              // Add profiles data to each user
              progressData = progressData.map(user => ({
                ...user,
                profiles: profilesMap[user.user_id]
              }));
            }
          }
        }
      } else {
        // For XP and streak - fetch ALL users with completed assessment, even if they don't have user_progress records
        console.log('Fetching all users with completed assessment...');
        
        // First, get all users with completed assessment
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('has_completed_assessment', true);

        if (profilesError) {
          console.error('Profiles Error:', profilesError);
          throw profilesError;
        }

        console.log(`Found ${allProfiles.length} users with completed assessment`);

        // Then, get their user_progress data (if any)
        const userIds = allProfiles.map(p => p.id);
        const { data: userProgressData, error: progressError } = await supabase
          .from('user_progress')
          .select('user_id, xp, level, streak, total_challenges_completed')
          .in('user_id', userIds);

        if (progressError) {
          console.error('Progress Error:', progressError);
        }

        console.log(`Found ${userProgressData?.length || 0} user_progress records`);

        // Create a map of user_id to progress data
        const progressMap = {};
        if (userProgressData) {
          userProgressData.forEach(progress => {
            progressMap[progress.user_id] = progress;
          });
        }

        // Combine profiles with progress data, defaulting to 0 for missing progress
        progressData = allProfiles.map(profile => {
          const progress = progressMap[profile.id] || {
            user_id: profile.id,
            xp: 0,
            level: 1,
            streak: 0,
            total_challenges_completed: 0
          };

          return {
            ...progress,
            profiles: profile
          };
        });

        // Sort by the selected field
        progressData.sort((a, b) => (b[filter.sortField] || 0) - (a[filter.sortField] || 0));

        // Apply pagination
        if (!isSearch) {
          progressData = progressData.slice(offset, offset + limit);
        }

        console.log(`Returning ${progressData.length} users for leaderboard`);
      }

      if (error) throw error;

      // Process the data - profiles are now handled consistently across all filters
      let validData = [];
      
      if (filterKey === 'challenges') {
        // For challenges, we still need to fetch profiles separately since we use the RPC function
        let profilesData = {};
        if (progressData && progressData.length > 0) {
          const userIds = [...new Set(progressData.map(user => user.user_id))];
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
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

        // Combine user_progress with profiles data for challenges
        validData = (progressData || []).map(user => ({
          ...user,
          profiles: profilesData[user.user_id] || {
            id: user.user_id,
            full_name: 'User',
            username: null,
            avatar_url: null
          }
        }));
      } else {
        // For XP and streak, profiles are already included from the separate fetch
        validData = (progressData || []).map(user => ({
          user_id: user.user_id,
          xp: user.xp,
          streak: user.streak,
          total_challenges_completed: user.total_challenges_completed,
          profiles: user.profiles
        }));
      }

      // Filter out users without profiles and add rank numbers
      const rankedData = validData
        .filter(user => user.profiles && (user.profiles.username || user.profiles.full_name))
        .map((user, index) => ({
          ...user,
          rank: isSearch ? null : offset + index + 1
        }));

      return { data: rankedData, hasMore: validData.length === limit };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return { data: [], hasMore: false };
    }
  };

  // Fetch current user rank using Supabase function as requested
  const fetchCurrentUserRank = async (filterKey) => {
    if (!user) return;

    try {
      const filter = filters.find(f => f.key === filterKey);
      
      // Map filter keys to function parameter
      const rankBy = filterKey === 'challenges' ? 'challenges' : filterKey;
      
      // Call the Supabase function get_user_leaderboard_rank
      const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
        p_user_id: user.id,
        p_rank_by: rankBy
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const rankData = data[0];
        
        // Get user's current stat value and profile for display
        const { data: userData, error: userError } = await supabase
          .from('user_progress')
          .select(`
            user_id,
            ${filter.sortField}
          `)
          .eq('user_id', user.id)
          .single();

        // Fetch profile data separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (!userError && userData) {
          setCurrentUserRank({
            rank: rankData.rank,
            totalCount: rankData.total_count,
            user: {
              ...userData,
              profiles: profileData || { username: null, full_name: 'User', avatar_url: null }
            },
            stat: userData[filter.sortField] || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  // Call get_user_leaderboard_rank function as requested in requirements
  const fetchUserRanks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
        p_user_id: user.id,
        p_rank_by: selectedFilter
      });

      if (error) {
        console.error('Error fetching user ranks:', error);
        return;
      }

      if (data && data.length > 0) {
        const ranks = data[0];
        console.log('User ranks fetched:', {
          xpRank: ranks.xp_rank,
          streakRank: ranks.streak_rank,
          challengesRank: ranks.challenges_rank,
          totalUsers: {
            xp: ranks.xp_total_count,
            streak: ranks.streak_total_count,
            challenges: ranks.challenges_total_count
          }
        });
        
        // Store ranks in localStorage for potential use elsewhere
        localStorage.setItem('userRanks', JSON.stringify(ranks));
      }
    } catch (error) {
      console.error('Error in fetchUserRanks:', error);
    }
  };

  // Fetch community stats with correct challenge counting
  const fetchCommunityStats = async () => {
    try {
      // Get community stats by summing total_challenges_completed from user_progress
      const [
        { count: totalActiveMembers, error: profilesError },
        { data: progressData, error: progressError }
      ] = await Promise.all([
        // Total active members from profiles
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        
        // All user progress data for calculations
        supabase
          .from('user_progress')
          .select('xp, streak, total_challenges_completed')
      ]);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      if (progressError) {
        console.error('Error fetching progress data:', progressError);
      }

      // Ensure we have valid data
      const validProgressData = progressData || [];
      
      const stats = {
        totalActiveMembers: totalActiveMembers || 0,
        totalXP: validProgressData.reduce((sum, user) => sum + (user.xp || 0), 0),
        totalCompletedChallenges: validProgressData.reduce((sum, user) => sum + (user.total_challenges_completed || 0), 0),
        totalActiveStreaks: validProgressData.filter(user => (user.streak || 0) > 0).length
      };

      console.log('Community stats calculated:', stats);
      setCommunityStats(stats);
    } catch (error) {
      console.error('Error fetching community stats:', error);
      setCommunityStats({
        totalActiveMembers: 0,
        totalXP: 0,
        totalCompletedChallenges: 0,
        totalActiveStreaks: 0
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setPage(1);
      const { data, hasMore } = await fetchLeaderboardData(selectedFilter, 1);
      
      // Just set the data as is - current user will be shown at bottom if not in top 10
      setLeaderboardData(data);
      setHasMore(hasMore);
      await fetchCurrentUserRank(selectedFilter);
      await fetchUserRanks(); // Call get_user_ranks when leaderboard loads
      setLoading(false);
    };

    loadData();
  }, [selectedFilter, user]);

  // Load community stats on mount and set up smooth live refresh
  useEffect(() => {
    fetchCommunityStats();
    
    // Set up smooth live refresh for community stats (every 30 seconds)
    const communityStatsInterval = setInterval(() => {
      const now = Date.now();
      // Only refresh if it's been at least 30 seconds since last update
      if (now - lastCommunityStatsUpdate > 30000) {
        fetchCommunityStats();
        setLastCommunityStatsUpdate(now);
      }
    }, 30000);
    
    // Listen for challenge completion events to update stats immediately
    const handleChallengeCompleted = () => {
      fetchCommunityStats();
      setLastCommunityStatsUpdate(Date.now());
    };
    
    // Listen for user progress updates
    const handleUserProgressUpdate = () => {
      fetchCommunityStats();
      setLastCommunityStatsUpdate(Date.now());
    };
    
    window.addEventListener('challengeCompleted', handleChallengeCompleted);
    window.addEventListener('userProgressUpdated', handleUserProgressUpdate);
    
    return () => {
      clearInterval(communityStatsInterval);
      window.removeEventListener('challengeCompleted', handleChallengeCompleted);
      window.removeEventListener('userProgressUpdated', handleUserProgressUpdate);
    };
  }, [lastCommunityStatsUpdate]);

  // Call get_user_ranks when user logs in
  useEffect(() => {
    if (user) {
      fetchUserRanks();
    }
  }, [user]);

  // Handle search with debouncing
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim()) {
        // Search in profiles table first
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
          .limit(20);

        if (profilesError) {
          console.error('Error searching profiles:', profilesError);
          setSearchResults([]);
          return;
        }

        if (profiles && profiles.length > 0) {
          // Get user_progress data for these users
          const userIds = profiles.map(p => p.id);
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('user_id, xp, streak, total_challenges_completed')
            .in('user_id', userIds);

          if (progressError) {
            console.error('Error fetching progress data:', progressError);
            setSearchResults([]);
            return;
          }

          // Combine the data
          const combinedData = profiles.map(profile => {
            const progress = progressData?.find(p => p.user_id === profile.id);
            return {
              user_id: profile.id,
              xp: progress?.xp || 0,
              streak: progress?.streak || 0,
              total_challenges_completed: progress?.total_challenges_completed || 0,
              profiles: profile
            };
          });

          // Sort by the selected filter
          const filter = filters.find(f => f.key === selectedFilter);
          combinedData.sort((a, b) => b[filter.sortField] - a[filter.sortField]);

          // Add ranks for search results using the Supabase function
          const rankedSearchResults = await Promise.all(
            combinedData.map(async (userData) => {
              try {
                const rankBy = selectedFilter === 'challenges' ? 'challenges' : selectedFilter;
                
                const { data: rankData, error } = await supabase.rpc('get_user_leaderboard_rank', {
                  p_user_id: userData.user_id,
                  p_rank_by: rankBy
                });
                
                if (!error && rankData && rankData.length > 0) {
                  return {
                    ...userData,
                    rank: rankData[0].rank
                  };
                }
                return userData;
              } catch (error) {
                console.error('Error getting rank for search result:', error);
                return userData;
              }
            })
          );
          setSearchResults(rankedSearchResults);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, selectedFilter]);

  // Listen for challenge completion events to refresh leaderboard
  useEffect(() => {
    const handleChallengeCompleted = (event) => {
      const { detail } = event;
      console.log('Challenge completed, refreshing Leaderboard:', detail);
      
      // Refresh leaderboard data if XP or other stats changed
      if (detail.xpGained > 0 || detail.levelUp) {
        setTimeout(async () => {
          setLoading(true);
          setPage(1);
          const { data, hasMore } = await fetchLeaderboardData(selectedFilter, 1);
          setLeaderboardData(data);
          setHasMore(hasMore);
          await fetchCurrentUserRank(selectedFilter);
          await fetchUserRanks(); // Call get_user_ranks after challenge completion
          await fetchCommunityStats(); // Refresh community stats too
          setLoading(false);
        }, 2000); // Small delay to allow database to update
      }
    };

    window.addEventListener('challengeCompleted', handleChallengeCompleted);
    return () => window.removeEventListener('challengeCompleted', handleChallengeCompleted);
  }, [selectedFilter]);

  // Load more data - next 20 as requested
  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data, hasMore } = await fetchLeaderboardData(selectedFilter, nextPage);
    setLeaderboardData(prev => [...prev, ...data]);
    setHasMore(hasMore);
    setPage(nextPage);
    setLoadingMore(false);
  };

  // Get rank styling for top 3
  const getRankStyling = (rank) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 font-bold text-lg';
      case 2:
        return 'text-gray-500 font-bold text-lg';
      case 3:
        return 'text-amber-600 font-bold text-lg';
      default:
        return 'text-gray-700 font-semibold';
    }
  };

  // Get rank icon for top 3
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-500" />;
      default:
        return null;
    }
  };

  // Format numbers with short form for large numbers (1.2K, 1.5M, etc.)
  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    
    // Round to nearest whole number first
    const roundedNum = Math.round(num);
    
    if (roundedNum < 1000) {
      return roundedNum.toLocaleString();
    } else if (roundedNum < 1000000) {
      return (roundedNum / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else if (roundedNum < 1000000000) {
      return (roundedNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else {
      return (roundedNum / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
  };

  // Render user row - Instagram-like styling
  const renderUserRow = (userData, isCurrentUser = false, showRank = true) => {
    const userProfile = userData.profiles;
    const displayName = userProfile?.username || userProfile?.full_name || 'Anonymous';
    const stat = userData[currentFilter.sortField] || 0;

    return (
      <motion.div
        key={userData.user_id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
          isCurrentUser 
            ? 'bg-green-50 border-green-300 shadow-lg ring-2 ring-green-200' 
            : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
        }`}
      >
        <div className="flex items-center space-x-4">
          {showRank && (
            <div className={`flex items-center justify-center w-10 h-10 ${getRankStyling(userData.rank)}`}>
              {getRankIcon(userData.rank) || (
                <span className="font-bold">#{userData.rank}</span>
              )}
            </div>
          )}
          
          <Avatar className="w-12 h-12 border-2 border-gray-200">
            <AvatarImage 
              src={userProfile?.avatar_url} 
              alt={displayName}
            />
            <AvatarFallback className="bg-gradient-to-br from-forest-green to-leaf-green text-white font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <p className={`font-semibold text-lg ${isCurrentUser ? 'text-green-900' : 'text-gray-900'}`}>
              {displayName}
              {isCurrentUser && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800 border-green-300">
                  You
                </Badge>
              )}
            </p>
            {userProfile?.username && userProfile?.full_name && (
              <p className="text-sm text-gray-500">@{userProfile.username}</p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className={`font-bold text-xl ${isCurrentUser ? 'text-green-900' : 'text-gray-900'}`}>
            {formatNumber(stat)}
          </p>
          <p className="text-sm text-gray-500 font-medium">{currentFilter.statLabel}</p>
        </div>
      </motion.div>
    );
  };

  const displayData = searchTerm ? searchResults : leaderboardData;
  const isCurrentUserInTop10 = leaderboardData.some(userData => 
    userData.user_id === user?.id
  );

  return (
    <div className="min-h-screen p-4 bg-sun-beige pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-forest-green">Community Leaderboard</h1>
            <p className="text-gray-600">See how you rank among the growth community</p>
          </div>
        </div>

        {/* Personal Stats */}
        {progress && (
          <Card className="bg-gradient-to-r from-forest-green to-leaf-green text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.level || 1}</div>
                  <div className="text-sm opacity-90">Your Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatNumber(progress.xp || 0)}</div>
                  <div className="text-sm opacity-90">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.streak || 0}</div>
                  <div className="text-sm opacity-90">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatNumber(progress.total_challenges_completed || 0)}
                  </div>
                  <div className="text-sm opacity-90">Challenges</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Stats Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Growth Community Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 truncate">
                  {formatNumber(communityStats.totalActiveMembers)}
                </div>
                <div className="text-sm font-medium">Active Members</div>
                <div className="text-xs text-gray-600">Total profiles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600 truncate">
                  {formatNumber(communityStats.totalXP)}
                </div>
                <div className="text-sm font-medium">Total XP</div>
                <div className="text-xs text-gray-600">Community earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 truncate">
                  {formatNumber(communityStats.totalCompletedChallenges)}
                </div>
                <div className="text-sm font-medium">Challenges</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-orange-600 truncate">
                  {formatNumber(communityStats.totalActiveStreaks)}
                </div>
                <div className="text-sm font-medium">Active Streaks</div>
                <div className="text-xs text-gray-600">Burning bright</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Leaderboard */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <currentFilter.icon className="w-6 h-6" />
                  {currentFilter.label} Leaderboard
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {currentFilter.description}
                </p>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.key}
                    variant={selectedFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.key)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <Skeleton className="w-10 h-10" />
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayData.length > 0 ? (
                  <AnimatePresence>
                    {displayData.map((userData) => (
                      renderUserRow(
                        userData,
                        userData.user_id === user?.id
                      )
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No users found matching your search.' : 'No leaderboard data available.'}
                  </div>
                )}

                {/* View More Button - loads next 20 */}
                {!searchTerm && hasMore && displayData.length > 0 && (
                  <div className="text-center pt-6">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full sm:w-auto px-8 py-3"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          View More (Load Next 20)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Current User Rank (if not in top 10) - Now shown at position 11 */}
                {!searchTerm && currentUserRank && !isCurrentUserInTop10 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-600">Your Position</span>
                    </div>
                    {renderUserRow({
                      ...currentUserRank.user,
                      rank: currentUserRank.rank,
                      [currentFilter.sortField]: currentUserRank.stat,
                      profiles: currentUserRank.user.profiles
                    }, true)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivational Banner */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Keep Climbing the Leaderboard!
            </h3>
            <p className="text-gray-600 mb-4">
              Complete challenges, maintain your streak, and level up to rise in the rankings.
              Every step of growth matters!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                💪 Complete Daily Challenges
              </Badge>
              <Badge variant="outline" className="border-orange-400 text-orange-700">
                🔥 Maintain Your Streak
              </Badge>
              <Badge variant="outline" className="border-green-400 text-green-700">
                📈 Level Up
              </Badge>
              <Badge variant="outline" className="border-blue-400 text-blue-700">
                🎯 Join Challenge Packs
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage; 