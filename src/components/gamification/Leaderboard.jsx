import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  Flame, 
  Target, 
  ChevronLeft, 
  ChevronRight,
  Crown,
  Medal,
  Award,
  Users,
  Search,
  X
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const Leaderboard = ({ 
  title = "Leaderboard",
  maxUsers = 10,
  showPagination = true,
  showUserRank = true,
  defaultRankBy = 'xp' // 'xp', 'challenges', 'streak'
}) => {
  const { user } = useAuth();
  const { progress } = useData();
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankBy, setRankBy] = useState(defaultRankBy);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const itemsPerPage = maxUsers || 10;

  // Search users by username or full name
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      let searchQuery = supabase
        .from('user_progress')
        .select(`
          user_id,
          xp,
          level,
          streak,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url,
            assessment_results
          )
        `)
        .not('profiles.id', 'is', null);

      // Add search filter
      searchQuery = searchQuery.or(`profiles.username.ilike.%${query}%,profiles.full_name.ilike.%${query}%`);

      // Add order based on rank type
      switch (rankBy) {
        case 'challenges':
          // For search, we'll use a simpler approach
          searchQuery = searchQuery.order('xp', { ascending: false });
          break;
        case 'streak':
          searchQuery = searchQuery.order('streak', { ascending: false });
          break;
        case 'xp':
        default:
          searchQuery = searchQuery.order('xp', { ascending: false });
          break;
      }

      const { data, error } = await searchQuery.limit(20);
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch leaderboard data
  const fetchLeaderboard = async (page = 1, rankType = rankBy) => {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * itemsPerPage;
      
      let query = supabase
        .from('user_progress')
        .select(`
          user_id,
          xp,
          level,
          streak,
          profiles:user_id (
            id,
            full_name,
            username,
            avatar_url,
            assessment_results
          )
        `)
        .not('profiles.id', 'is', null); // Only users with profiles

      // Add order based on rank type
      switch (rankType) {
        case 'challenges':
          // We'll need to use a more complex query for challenge count
          const { data: challengeData, error: challengeError } = await supabase.rpc(
            'get_leaderboard_by_challenges',
            { 
              p_limit: itemsPerPage,
              p_offset: offset
            }
          );
          
          if (challengeError) throw challengeError;
          setLeaderboardData(challengeData || []);
          break;
          
        case 'streak':
          query = query
            .order('streak', { ascending: false })
            .order('xp', { ascending: false }); // Secondary sort
          break;
          
        case 'xp':
        default:
          query = query
            .order('xp', { ascending: false })
            .order('level', { ascending: false }); // Secondary sort
          break;
      }

      if (rankType !== 'challenges') {
        query = query.range(offset, offset + itemsPerPage - 1);
        const { data, error } = await query;
        if (error) throw error;
        setLeaderboardData(data || []);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .not('profiles.id', 'is', null);
      
      setTotalUsers(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (err) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user's rank
  const fetchUserRank = async (rankType = rankBy) => {
    if (!user || !showUserRank) return;

    try {
      const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
        p_user_id: user.id,
        p_rank_by: rankType
      });

      if (error) throw error;
      setUserRank(data?.[0] || null);
    } catch (err) {
      console.error('Error fetching user rank:', err);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchLeaderboard(currentPage, rankBy);
    fetchUserRank(rankBy);
  }, [currentPage, rankBy, user]);

  const handleRankTypeChange = (newRankBy) => {
    setRankBy(newRankBy);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankValue = (userData, type) => {
    const data = userData.profiles || userData;
    switch (type) {
      case 'challenges':
        return userData.challenge_count || 0;
      case 'streak':
        return userData.streak || 0;
      case 'xp':
      default:
        return userData.xp || 0;
    }
  };

  const getRankLabel = (type) => {
    switch (type) {
      case 'challenges':
        return 'Challenges';
      case 'streak':
        return 'Day Streak';
      case 'xp':
      default:
        return 'XP';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            {['xp', 'challenges', 'streak'].map((type) => (
              <Skeleton key={type} className="h-8 w-20" />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-500 mb-4">Error loading leaderboard: {error}</p>
          <Button 
            variant="outline" 
            onClick={() => fetchLeaderboard(currentPage, rankBy)}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-forest-green" />
          {title}
        </CardTitle>
        
        {/* Rank Type Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'xp', label: 'XP', icon: Trophy },
            { key: 'challenges', label: 'Challenges', icon: Target },
            { key: 'streak', label: 'Streak', icon: Flame }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={rankBy === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleRankTypeChange(key)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search users by name or username..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setIsSearching(false);
              }}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* User's Current Rank */}
        {showUserRank && userRank && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Your Rank</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                #{userRank.rank} of {userRank.total_count}
              </Badge>
              <span className="text-sm text-blue-600">
                {getRankValue(progress, rankBy)} {getRankLabel(rankBy)}
              </span>
            </div>
          </div>
        )}

        {/* Search Results or Regular Leaderboard */}
        {searchQuery && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Search className="w-4 h-4" />
              <span>
                {isSearching ? 'Searching...' : `Found ${searchResults.length} users matching "${searchQuery}"`}
              </span>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {(searchQuery ? searchResults : leaderboardData).map((userData, index) => {
              const rank = (currentPage - 1) * itemsPerPage + index + 1;
              const profile = userData.profiles || userData;
              const isCurrentUser = user && profile.id === user.id;
              
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    isCurrentUser 
                      ? 'bg-forest-green/10 border-2 border-forest-green/30' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={profile.avatar_url} 
                      alt={profile.full_name || profile.username} 
                    />
                    <AvatarFallback className="bg-forest-green text-white">
                      {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 
                        className="font-semibold text-gray-900 truncate cursor-pointer hover:text-forest-green transition-colors"
                        onClick={() => navigate(`/profile?userId=${profile.id}`)}
                      >
                        {profile.full_name || profile.username || 'Anonymous'}
                      </h3>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Level {userData.level || 1}</span>
                      {profile.assessment_results?.userSelection && (
                        <span className="text-xs">
                          {profile.assessment_results.userSelection}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rank Value */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-forest-green">
                      {getRankValue(userData, rankBy).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRankLabel(rankBy)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {searchQuery ? (
          // Empty search results
          searchResults.length === 0 && !isSearching && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No users found
              </h3>
              <p className="text-gray-500">
                No users match your search for "{searchQuery}"
              </p>
            </div>
          )
        ) : (
          // Empty leaderboard
          leaderboardData.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No rankings yet
              </h3>
              <p className="text-gray-500">
                Complete challenges to see rankings appear here!
              </p>
            </div>
          )
        )}

        {/* Pagination - only show when not searching */}
        {showPagination && totalPages > 1 && !searchQuery && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalUsers)} - {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <span className="text-sm font-medium px-3">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard; 