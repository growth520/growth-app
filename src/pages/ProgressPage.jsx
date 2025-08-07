import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Target, 
  Trophy, 
  Flame, 
  Calendar, 
  Star, 
  Zap,
  Gift,
  Coins,
  Shield,
  Snowflake
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import ChallengePackCarousel from '@/components/gamification/ChallengePackCarousel';
import ChallengePackDetailsModal from '@/components/gamification/ChallengePackDetailsModal';
import CompletedPackDetailsModal from '@/components/gamification/CompletedPackDetailsModal';
import BadgeLocker from '@/components/gamification/BadgeLocker';
import { useToast } from '@/components/ui/use-toast';
import { checkStreakAtRisk, useStreakFreezeToken } from '@/lib/tokenSystem';
import { getLevelInfo } from '@/lib/levelSystem';

// Feature flags to prevent 404/400 errors on non-existent tables
const USER_TOKENS_ENABLED = true;
const LEVEL_REWARDS_ENABLED = true;

const ProgressPage = () => {
  const navigate = useNavigate();
  const { profile, progress, userBadges, loading } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userTokens, setUserTokens] = useState(0);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [levelRewards, setLevelRewards] = useState([]);
  const [streakAtRisk, setStreakAtRisk] = useState(false);

  // Challenge Pack Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    selectedPack: null,
    isAccepting: false,
    existingProgress: null
  });

  // Completed Pack Details Modal state
  const [completedPackModal, setCompletedPackModal] = useState({
    isOpen: false,
    packId: null
  });

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

  // Memoize user ID and progress level to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  const userLevel = useMemo(() => progress?.level, [progress?.level]);
  const userStreak = useMemo(() => progress?.streak, [progress?.streak]);

  // Debug logging
  useEffect(() => {
    console.log('📊 ProgressPage: Received progress data:', {
      progress: progress,
      userLevel: userLevel,
      userStreak: userStreak,
      loading: loading
    });
    
    // Also log the raw values that will be displayed
    if (progress) {
      console.log('📊 ProgressPage: Raw display values:', {
        xp: progress.xp,
        level: progress.level,
        streak: progress.streak,
        total_challenges_completed: progress.total_challenges_completed
      });
    }
  }, [progress, userLevel, userStreak, loading]);

  // Fetch user tokens and recent achievements
  const fetchAdditionalData = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch tokens - handle table not existing
      if (USER_TOKENS_ENABLED) {
        try {
          const { data: tokensData } = await supabase
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .eq('token_type', 'streak_freeze')
            .single();

          setUserTokens(tokensData?.balance || 0);
        } catch (tokenError) {
          // Silently handle table not existing - feature not implemented yet
          if (tokenError?.code === 'PGRST106' || tokenError?.status === 404 || tokenError?.status === 400) {
            setUserTokens(0);
          } else {
            throw tokenError;
          }
        }
      } else {
        setUserTokens(0); // Disable feature
      }

      // Fetch level rewards to show what's unlocked - handle table not existing
      if (LEVEL_REWARDS_ENABLED) {
        try {
          const { data: rewardsData } = await supabase
            .from('level_rewards')
            .select('*')
            .lte('level', userLevel || 1)
            .order('level', { ascending: false })
            .limit(3);

          setLevelRewards(rewardsData || []);
        } catch (rewardsError) {
          // Silently handle table not existing
          if (rewardsError?.code === 'PGRST106' || rewardsError?.status === 404 || rewardsError?.status === 400) {
            setLevelRewards([]);
          } else {
            throw rewardsError;
          }
        }
      } else {
        setLevelRewards([]); // Disable feature
      }

      // Fetch recent completed challenges for achievements
      const { data: recentData } = await supabase
        .from('completed_challenges')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);

      setRecentAchievements(recentData || []);
    } catch (error) {
      console.error('Error fetching additional progress data:', error);
    }
  }, [userId, userLevel]);

  useEffect(() => {
    fetchAdditionalData();
  }, [fetchAdditionalData]);

  // Listen for challenge completion events to refresh UI
  useEffect(() => {
    const handleChallengeCompleted = (event) => {
      const { detail } = event;
      console.log('Challenge completed, refreshing Progress Page:', detail);
      
      // Show immediate feedback if user gained XP or leveled up
      if (detail.levelUp) {
        toast({
          title: "🎉 Level Up!",
          description: `Congratulations! You reached Level ${detail.newLevel}!`,
          duration: 4000,
        });
      }
      
      if (detail.tokensEarned > 0) {
        toast({
          title: "🎁 Tokens Earned!",
          description: `You earned ${detail.tokensEarned} Streak Freeze Token${detail.tokensEarned > 1 ? 's' : ''}!`,
          duration: 4000,
        });
      }
      
      // Refresh data after a short delay to show immediate feedback first
      setTimeout(() => {
        fetchAdditionalData();
      }, 1500);
    };

    window.addEventListener('challengeCompleted', handleChallengeCompleted);
    return () => window.removeEventListener('challengeCompleted', handleChallengeCompleted);
  }, [toast, fetchAdditionalData]);

  // Check if streak is at risk when component loads
  const checkStreakRisk = useCallback(async () => {
    if (!userId) return;
    
    try {
      const isAtRisk = await checkStreakAtRisk(userId);
      setStreakAtRisk(isAtRisk);
    } catch (error) {
      console.error('Error checking streak risk:', error);
      setStreakAtRisk(false);
    }
  }, [userId, userStreak]);

  useEffect(() => {
    checkStreakRisk();
  }, [checkStreakRisk]);

  // Use streak freeze token
  const useStreakFreeze = useCallback(async () => {
    if (!USER_TOKENS_ENABLED) {
      toast({
        title: "Feature Not Available",
        description: "Streak freeze tokens are not available yet.",
        variant: "destructive",
      });
      return;
    }

    if (userTokens < 1) {
      toast({
        title: "No Tokens Available",
        description: "You don't have any streak freeze tokens. Level up or complete milestones to earn more!",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Use 1 Streak Freeze Token to protect your ${userStreak || 0}-day streak?`
    );
    
    if (!confirmed) return;

    try {
      const result = await useStreakFreezeToken(userId);

      if (result.success && result.used) {
        setUserTokens(prev => prev - 1);
        setStreakAtRisk(false); // Streak is now safe
        toast({
          title: "❄️ Streak Frozen!",
          description: `Your ${userStreak || 0}-day streak is now protected! 1 token used.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Unable to Use Token",
          description: "You don't have enough tokens or there was an error.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error using streak freeze:', error);
      toast({
        title: "Error",
        description: "Failed to use streak freeze token. Please try again.",
        variant: "destructive",
      });
    }
  }, [userId, userTokens, userStreak, toast]);

  // Challenge Pack Modal Handlers
  const handlePackClick = useCallback(async (pack) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view challenge packs.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if user has existing progress on this pack
      const { data: existingProgress, error } = await supabase
        .from('user_pack_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('pack_id', pack.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking pack progress:', error);
      }

      // Get completed challenges count if progress exists
      let progressData = null;
      if (existingProgress) {
        const { data: completedChallenges, error: challengeError } = await supabase
          .from('user_pack_challenge_progress')
          .select('challenge_index')
          .eq('user_id', user.id)
          .eq('pack_id', pack.id);

        if (!challengeError) {
          progressData = {
            ...existingProgress,
            completed: completedChallenges?.length || 0
          };
        }
      }

      // Check if pack is completed
      if (progressData && progressData.is_completed) {
        // Pack is completed - show completion details
        setCompletedPackModal({
          isOpen: true,
          packId: pack.id
        });
      } else {
        // Pack is not completed or doesn't exist - show pack details modal
        setModalState({
          isOpen: true,
          selectedPack: pack,
          isAccepting: false,
          existingProgress: progressData
        });
      }
    } catch (error) {
      console.error('Error opening pack modal:', error);
      toast({
        title: "Error",
        description: "Failed to load pack details. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const handleAcceptPack = useCallback(async (pack) => {
    if (!user) return;

    setModalState(prev => ({ ...prev, isAccepting: true }));

    try {
      // Check if user already has this pack started
      const { data: existingPack, error: checkError } = await supabase
        .from('user_pack_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('pack_id', pack.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPack) {
        // Pack already started, just navigate to it
        setModalState({
          isOpen: false,
          selectedPack: null,
          isAccepting: false,
          existingProgress: null
        });
        
        toast({
          title: "Pack Continued! 🚀",
          description: "Redirecting to your challenge pack...",
        });
        
        setTimeout(() => {
          navigate(`/challenge-pack/${pack.id}`);
        }, 1000);
        return;
      }

      // Start new pack
      const { error: insertError } = await supabase
        .from('user_pack_progress')
        .insert({
          user_id: user.id,
          pack_id: pack.id,
          started_at: new Date().toISOString(),
          is_completed: false,
          completion_percentage: 0,
          current_day: 1
        });

      if (insertError) throw insertError;

      // Close modal and show success
      setModalState({
        isOpen: false,
        selectedPack: null,
        isAccepting: false,
        existingProgress: null
      });

      toast({
        title: "Pack Started! 🎉",
        description: "Your challenge pack is ready. Continue on the Challenge page!",
      });

      // Optional: Navigate to challenge page or pack details
      setTimeout(() => {
        navigate('/challenge');
      }, 1500);

    } catch (error) {
      console.error('Error accepting pack:', error);
      toast({
        title: "Error Starting Pack",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setModalState(prev => ({ ...prev, isAccepting: false }));
    }
  }, [user, toast, navigate]);

  const handleCloseModal = useCallback(() => {
    setModalState({
      isOpen: false,
      selectedPack: null,
      isAccepting: false,
      existingProgress: null
    });
  }, []);

  const handleCloseCompletedPackModal = useCallback(() => {
    setCompletedPackModal({
      isOpen: false,
      packId: null
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-sun-beige">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !progress) {
    return (
      <div className="min-h-screen p-4 bg-sun-beige flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Complete Your Assessment</h2>
            <p className="text-gray-600 mb-4">
              Take the growth assessment to see your progress and unlock features.
            </p>
            <Button onClick={() => navigate('/assessment')} className="w-full">
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentXP = progress.xp || 0;
  const currentStreak = progress.streak || 0;
  
  // Use quadratic level system
  const levelInfo = getLevelInfo(currentXP);
  const currentLevel = levelInfo.level;
  const xpInCurrentLevel = levelInfo.xpInCurrentLevel;
  const xpNeededForNextLevel = levelInfo.xpNeededForNextLevel;
  const progressPercentage = levelInfo.progressPercentage;

  return (
    <div className="min-h-screen p-4 bg-sun-beige pb-20" key="progress-page-container">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-forest-green hover:bg-forest-green/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-forest-green">Your Progress</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Level Card */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Trophy className="w-6 h-6" />
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Level {currentLevel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>XP Progress</span>
                  <span>{xpInCurrentLevel}/{xpNeededForNextLevel}</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-white/20" />
                <p className="text-xs opacity-90">
                  {xpNeededForNextLevel - xpInCurrentLevel} XP to Level {currentLevel + 1}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Flame className="w-6 h-6" />
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {currentStreak} days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Streak</p>
                <p className="text-xs opacity-90">
                  {currentStreak === 0 
                    ? "Complete a challenge to start your streak!" 
                    : "Keep it going! 🔥"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tokens Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-6 h-6" />
                  {streakAtRisk && (
                    <span className="animate-pulse text-yellow-300">⚠️</span>
                  )}
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {userTokens}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Streak Freeze Tokens</p>
                {streakAtRisk ? (
                  <div className="space-y-2">
                    <p className="text-xs text-yellow-200 font-medium">
                      ⚠️ Your streak is at risk!
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={useStreakFreeze}
                      disabled={userTokens === 0}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white border-none text-xs py-1 px-2"
                    >
                      <Snowflake className="w-3 h-3 mr-1" />
                      Use Token to Freeze
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs opacity-90">
                      {userTokens === 0 
                        ? "Level up or complete milestones to earn tokens!" 
                        : `${userTokens} token${userTokens !== 1 ? 's' : ''} available`}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={useStreakFreeze}
                      disabled={userTokens === 0}
                      className="bg-white/20 hover:bg-white/30 text-white border-none text-xs py-1 px-2"
                    >
                      <Snowflake className="w-3 h-3 mr-1" />
                      Use Token
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Star className="w-6 h-6" />
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {userBadges.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Badges Earned</p>
                <p className="text-xs opacity-90">
                  {userBadges.length === 0 
                    ? "Complete challenges to earn badges!" 
                    : `${userBadges.length} achievement${userBadges.length !== 1 ? 's' : ''} unlocked`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Section */}
        {profile.has_completed_assessment && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-2xl">{getBadgeEmoji(profile.assessment_results?.userSelection)}</div>
              <div>
                <h3 className="font-bold text-lg text-forest-green">
                  Your Growth Focus
                </h3>
                <p className="text-sm text-gray-600">
                  {profile.assessment_results?.userSelection 
                    ? `You're focusing on ${profile.assessment_results.userSelection.toLowerCase()} development`
                    : 'Take the assessment to discover your growth area'
                  }
                </p>
              </div>
              {!profile.has_completed_assessment && (
                <Button onClick={() => navigate('/assessment')}>
                  Start Assessment
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Challenge Packs Section */}
        <div className="mt-8">
          <ChallengePackCarousel 
            title="Challenge Packs" 
            onPackClick={handlePackClick}
          />
        </div>

        {/* Recent Level Rewards */}
        {levelRewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Recent Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {levelRewards.map((reward) => (
                  <div key={reward.level} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Level {reward.level}: {reward.special_reward_title}</h3>
                      <p className="text-sm text-gray-600">{reward.special_reward_description}</p>
                      {reward.tokens_awarded > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          +{reward.tokens_awarded} Streak Freeze Token{reward.tokens_awarded !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badge Locker */}
        <BadgeLocker 
          userId={userId} 
          onViewAll={() => navigate('/badges')}
        />
      </div>

      {/* Challenge Pack Details Modal */}
      <ChallengePackDetailsModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        pack={modalState.selectedPack}
        onAcceptPack={handleAcceptPack}
        isAccepting={modalState.isAccepting}
        existingProgress={modalState.existingProgress}
      />

      {/* Completed Pack Details Modal */}
      <CompletedPackDetailsModal
        isOpen={completedPackModal.isOpen}
        onClose={handleCloseCompletedPackModal}
        packId={completedPackModal.packId}
        onShareSuccess={() => {
          // Optionally refresh data or show success message
          toast({
            title: "🎉 Shared Successfully!",
            description: "Your pack completion has been shared to the community",
          });
        }}
      />
    </div>
  );
};

export default React.memo(ProgressPage);