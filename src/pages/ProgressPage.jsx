import React, { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import ChallengePacksGrid from '@/components/gamification/ChallengePacksGrid';
import { useToast } from '@/components/ui/use-toast';

const ProgressPage = () => {
  const navigate = useNavigate();
  const { profile, progress, userBadges, loading } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userTokens, setUserTokens] = useState(0);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [levelRewards, setLevelRewards] = useState([]);

  // Fetch user tokens and recent achievements
  useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!user) return;

      try {
        // Fetch tokens
        const { data: tokensData } = await supabase
          .from('user_tokens')
          .select('balance')
          .eq('user_id', user.id)
          .eq('token_type', 'streak_freeze')
          .single();

        setUserTokens(tokensData?.balance || 0);

        // Fetch level rewards to show what's unlocked
        const { data: rewardsData } = await supabase
          .from('level_rewards')
          .select('*')
          .lte('level', progress?.level || 1)
          .order('level', { ascending: false })
          .limit(3);

        setLevelRewards(rewardsData || []);

        // Fetch recent completed challenges for achievements
        const { data: recentData } = await supabase
          .from('completed_challenges')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5);

        setRecentAchievements(recentData || []);
      } catch (error) {
        console.error('Error fetching additional progress data:', error);
      }
    };

    fetchAdditionalData();
  }, [user, progress?.level]);

  // Use streak freeze token
  const useStreakFreeze = async () => {
    try {
      const { data, error } = await supabase.rpc('use_streak_freeze_token', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data) {
        setUserTokens(prev => prev - 1);
        toast({
          title: "Streak Freeze Used! ❄️",
          description: "Your streak is protected for today. Keep growing tomorrow!",
          duration: 4000,
        });
      } else {
        toast({
          title: "No Tokens Available",
          description: "You don't have any streak freeze tokens. Level up to earn more!",
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
  };

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

  const currentLevel = progress.level || 1;
  const currentXP = progress.xp || 0;
  const currentStreak = progress.streak || 0;
  const xpToNextLevel = 50 + (currentLevel - 1) * 25;
  const progressPercentage = (currentXP / xpToNextLevel) * 100;

  return (
    <div className="min-h-screen p-4 bg-sun-beige pb-20">
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
                  <span>{currentXP}/{xpToNextLevel}</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-white/20" />
                <p className="text-xs opacity-90">
                  {xpToNextLevel - currentXP} XP to Level {currentLevel + 1}
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
                <Shield className="w-6 h-6" />
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {userTokens}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Streak Freeze Tokens</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={useStreakFreeze}
                  disabled={userTokens === 0}
                  className="bg-white/20 hover:bg-white/30 text-white border-none text-xs py-1 px-2"
                >
                  Use Token
                </Button>
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

        {/* Challenge Packs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-forest-green" />
              Challenge Packs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChallengePacksGrid 
              maxPacks={6}
              onPackStart={(pack) => {
                // Handle pack start
                console.log('Pack started:', pack);
              }}
              onPackContinue={(pack) => {
                // Navigate to challenge page or pack details
                navigate('/challenge');
              }}
              onPackView={(pack) => {
                // Handle pack view/details
                console.log('View pack:', pack);
              }}
            />
          </CardContent>
        </Card>

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

        {/* User Badges */}
        {userBadges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Your Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userBadges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-medium text-sm text-center">{badge.badge_name}</h3>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Growth Area Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Your Growth Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-forest-green/10 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-forest-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {profile.assessment_results?.userSelection || 'Complete Assessment'}
                </h3>
                <p className="text-gray-600">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressPage;