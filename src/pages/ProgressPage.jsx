import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData, useAuth } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Lock, Trophy, Star, TrendingUp, CheckCircle, Flame, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';

const badgeDefinitions = {
    FIRST_CHALLENGE: { name: "First Step", icon: <Star className="w-8 h-8 text-yellow-400" />, description: "You completed your first challenge!" },
    CHALLENGES_5: { name: "Growing Strong", icon: <Trophy className="w-8 h-8 text-slate-400" />, description: "Completed 5 challenges." },
    CHALLENGES_10: { name: "Challenge Champion", icon: <Trophy className="w-8 h-8 text-yellow-500" />, description: "Completed 10 challenges." },
    CHALLENGES_25: { name: "Growth Guru", icon: <Trophy className="w-8 h-8 text-emerald-500" />, description: "Completed 25 challenges." },
    CHALLENGES_50: { name: "Master of Momentum", icon: <Trophy className="w-8 h-8 text-purple-500" />, description: "Completed 50 challenges." },
    LEVEL_2: { name: "Level 2", icon: <TrendingUp className="w-8 h-8 text-green-400" />, description: "You reached level 2!" },
    LEVEL_3: { name: "Level 3", icon: <TrendingUp className="w-8 h-8 text-green-500" />, description: "You reached level 3!" },
    LEVEL_4: { name: "Level 4", icon: <TrendingUp className="w-8 h-8 text-blue-400" />, description: "You reached level 4!" },
    LEVEL_5: { name: "Level 5", icon: <TrendingUp className="w-8 h-8 text-blue-500" />, description: "You've reached level 5. Keep going!" },
    LEVEL_6: { name: "Level 6", icon: <TrendingUp className="w-8 h-8 text-indigo-400" />, description: "You reached level 6!" },
    LEVEL_7: { name: "Level 7", icon: <TrendingUp className="w-8 h-8 text-indigo-500" />, description: "You reached level 7!" },
    LEVEL_8: { name: "Level 8", icon: <TrendingUp className="w-8 h-8 text-purple-400" />, description: "You reached level 8!" },
    LEVEL_9: { name: "Level 9", icon: <TrendingUp className="w-8 h-8 text-purple-500" />, description: "You reached level 9!" },
    LEVEL_10: { name: "Level 10 Legend", icon: <TrendingUp className="w-8 h-8 text-indigo-500" />, description: "Wow, level 10! You're a true inspiration." },
    LEVEL_15: { name: "Level 15 Titan", icon: <TrendingUp className="w-8 h-8 text-red-500" />, description: "Level 15! You are unstoppable." },
    STREAK_7: { name: "7-Day Streak", icon: <Flame className="w-8 h-8 text-orange-500" />, description: "A full week of consistent growth!" },
    STREAK_30: { name: "30-Day Streak", icon: <Flame className="w-8 h-8 text-red-600" />, description: "An entire month of dedication. Incredible!" },
    FIRST_REFLECTION: { name: "Deep Thinker", icon: <CheckCircle className="w-8 h-8 text-green-500" />, description: "You shared your first reflection." },
    FIRST_SHARE: { name: "Community Builder", icon: <CheckCircle className="w-8 h-8 text-cyan-500" />, description: "You shared a challenge with the community." },
};

const CompletedChallengesModal = ({ open, onOpenChange }) => {
    const { user } = useAuth();
    const [completed, setCompleted] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && user) {
            const fetchCompleted = async () => {
                setIsLoading(true);
                const { data, error } = await supabase.rpc('get_completed_challenges_with_posts', { p_user_id: user.id });
                if (error) {
                    console.error("Error fetching completed challenges:", error);
                } else {
                    setCompleted(data);
                }
                setIsLoading(false);
            };
            fetchCompleted();
        }
    }, [open, user]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[625px] bg-sun-beige">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-forest-green">Completed Challenges</DialogTitle>
                    <DialogDescription>A log of your accomplished goals and reflections.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4 -mr-4">
                    {isLoading ? <p>Loading...</p> : 
                    completed.length > 0 ? (
                        <div className="space-y-4">
                            {completed.map((item, index) => (
                                <Card key={index} className="bg-white/60">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-charcoal-gray">{item.challenge_title}</CardTitle>
                                        <CardDescription>{new Date(item.completed_at).toLocaleDateString()}</CardDescription>
                                    </CardHeader>
                                    {item.reflection && (
                                    <CardContent>
                                        <p className="text-sm italic text-charcoal-gray/80">"{item.reflection}"</p>
                                        {item.photo_url && <img src={item.photo_url} alt="User reflection" className="mt-4 rounded-lg max-h-48 w-auto"/>}
                                    </CardContent>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p>No completed challenges yet.</p>
                    )}
                </ScrollArea>
                 <DialogTrigger asChild>
                    <Button variant="outline" className="mt-4">Close</Button>
                </DialogTrigger>
            </DialogContent>
        </Dialog>
    );
};

const XP_TO_LEVEL = (level) => 50 + (level - 1) * 25;

const ProgressPage = () => {
  const { progress, userBadges } = useData();
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  if (!progress) {
    return <div className="min-h-screen flex items-center justify-center bg-sun-beige">Loading...</div>;
  }
  const progressPercentage = (progress.xp / XP_TO_LEVEL(progress.level)) * 100;
  const earnedBadgeTypes = userBadges ? userBadges.map(b => b.badge_type) : [];
  const streak = progress.streak || 0;

  return (
    <div className="min-h-screen bg-sun-beige p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold gradient-text mb-2">Your Progress</h1>
          <p className="text-charcoal-gray/80 text-lg">See how far you've come on your journey.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mt-8 bg-white/50 border-black/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-forest-green">Current Level: {progress.level}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-4 bg-forest-green/20 [&>div]:bg-gradient-to-r [&>div]:from-leaf-green [&>div]:to-forest-green" />
                <div className="flex justify-between text-sm font-medium text-charcoal-gray/80">
                  <span>{progress.xp} XP</span>
                  <span>Next Level at {XP_TO_LEVEL(progress.level)} XP</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="bg-white/50 border-black/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-forest-green">Completed Challenges</CardTitle>
                <CardDescription>Total goals you've achieved.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold text-warm-orange">{progress.completed_challenges_count || 0}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" onClick={() => setShowCompleted(true)}>
                  <History className="w-4 h-4 mr-2" />
                  View Completed
                </Button>
              </CardFooter>
            </Card>
            <Card className="bg-white/50 border-black/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-forest-green">Current Streak</CardTitle>
                <CardDescription>Consecutive days of challenges.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold text-leaf-green">{streak} days</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 bg-white/50 border-black/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-forest-green">My Badges</CardTitle>
              <CardDescription>Collectibles you've earned along the way.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {/* Show all defined badges */}
                {Object.entries(badgeDefinitions).map(([type, badge]) => {
                  const isEarned = earnedBadgeTypes.includes(type);
                  return (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + Object.keys(badgeDefinitions).indexOf(type) * 0.05 }}
                      onClick={() => setSelectedBadge({ ...badge, isEarned })}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl aspect-square transition-all duration-300 cursor-pointer ${
                        isEarned ? 'bg-gradient-to-br from-yellow-50 via-green-50 to-orange-50 border-2 border-yellow-300 shadow-md' : 'bg-gray-100 border border-gray-200 filter grayscale opacity-60'
                      }`}
                    >
                      {isEarned ? (
                        badge.icon
                      ) : (
                        <div className="relative">
                          {React.cloneElement(badge.icon, { className: 'w-8 h-8 text-gray-400' })}
                          <Lock className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-100 text-gray-500 rounded-full p-0.5" />
                        </div>
                      )}
                      <p className="text-xs text-center font-semibold mt-2 text-charcoal-gray">{badge.name}</p>
                    </motion.div>
                  );
                })}
                
                {/* Show any earned badges that don't have definitions */}
                {earnedBadgeTypes.filter(type => !badgeDefinitions[type]).map((type) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl aspect-square transition-all duration-300 cursor-pointer bg-gradient-to-br from-yellow-50 via-green-50 to-orange-50 border-2 border-yellow-300 shadow-md"
                    onClick={() => setSelectedBadge({ 
                      name: type.replace(/_/g, ' '), 
                      icon: <Trophy className="w-8 h-8 text-yellow-500" />, 
                      description: `You earned the ${type.replace(/_/g, ' ')} badge!`,
                      isEarned: true 
                    })}
                  >
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <p className="text-xs text-center font-semibold mt-2 text-charcoal-gray">{type.replace(/_/g, ' ')}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="bg-sun-beige border-forest-green/20">
          {selectedBadge && (
            <>
              <DialogHeader className="text-center items-center">
                <div className={`mb-4 ${selectedBadge.isEarned ? '' : 'filter grayscale opacity-60'}`}>
                  {React.cloneElement(selectedBadge.icon, { className: 'w-20 h-20' })}
                </div>
                <DialogTitle className="text-2xl font-bold text-forest-green">{selectedBadge.name}</DialogTitle>
                <DialogDescription className="text-charcoal-gray/80 pt-2">{selectedBadge.description}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 text-center">
                {selectedBadge.isEarned ? (
                  <Badge variant="secondary" className="bg-leaf-green/20 text-leaf-green border-leaf-green/30">
                    Unlocked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-charcoal-gray/70">
                    <Lock className="w-3 h-3 mr-1.5" /> Locked
                  </Badge>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CompletedChallengesModal open={showCompleted} onOpenChange={setShowCompleted} />
    </div>
  );
};

export default ProgressPage;