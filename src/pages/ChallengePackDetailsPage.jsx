import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Trophy, 
  Calendar, 
  Star,
  Lock,
  Play,
  Share2
} from 'lucide-react';
import { useChallengePacks } from '@/hooks/useChallengePacks';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import ChallengePackShareModal from '@/components/community/ChallengePackShareModal';
import PackCompletionModal from '@/components/gamification/PackCompletionModal';
import { supabase } from '@/lib/customSupabaseClient';

const ChallengePackDetailsPage = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress } = useData();
  const { toast } = useToast();
  
  const {
    challengePacks,
    getPackProgress,
    getCompletedChallenges,
    completePackChallenge,
    startChallengePack,
    isPackUnlocked,
    loading
  } = useChallengePacks();

  const [pack, setPack] = useState(null);
  const [packProgress, setPackProgress] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [completingChallenge, setCompletingChallenge] = useState(null);
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    challengeText: '',
    challengeIndex: null
  });
  const [completionModal, setCompletionModal] = useState({
    isOpen: false,
    isCompleting: false
  });

  // Find the specific pack
  useEffect(() => {
    console.log('ChallengePackDetailsPage: Looking for pack', { packId, challengePacksLength: challengePacks.length });
    if (challengePacks.length > 0) {
      const foundPack = challengePacks.find(p => p.id === packId); // Remove parseInt - use UUID directly
      console.log('ChallengePackDetailsPage: Found pack', { foundPack, packId });
      if (foundPack) {
        setPack(foundPack);
        setPackProgress(getPackProgress(packId)); // Remove parseInt - use UUID directly
      }
    }
  }, [challengePacks, packId, getPackProgress]);

  // Load completed challenges
  useEffect(() => {
    const loadCompletedChallenges = async () => {
      if (pack && user) {
        const completed = await getCompletedChallenges(packId); // Remove parseInt - use UUID directly
        setCompletedChallenges(completed);
      }
    };

    loadCompletedChallenges();
  }, [pack, packId, user, getCompletedChallenges]);

  const handleStartPack = async () => {
    const result = await startChallengePack(packId); // packId is already a string, will be converted to BIGINT in hook
    if (result.success) {
      toast({
        title: "🚀 Pack Started!",
        description: `You've started ${pack.title}. Let's begin your journey!`,
      });
      setPackProgress(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to start pack",
        variant: "destructive",
      });
    }
  };

  const handleCompleteChallenge = async (challengeIndex) => {
    if (completedChallenges.includes(challengeIndex)) return;

    setCompletingChallenge(challengeIndex);
    
    const result = await completePackChallenge(packId, challengeIndex); // packId is already a string, will be converted to BIGINT in hook
    
    if (result.success) {
      setCompletedChallenges(prev => [...prev, challengeIndex]);
      
      // Show sharing modal for the completed challenge
      const challengeText = pack.challenges[challengeIndex];
      setShareModal({
        isOpen: true,
        challengeText,
        challengeIndex
      });

      toast({
        title: "✅ Challenge Complete!",
        description: "Great job! Share your achievement with the community?",
        duration: 3000,
      });

      // Check if all challenges are completed
      const totalChallenges = pack.challenges?.length || 0;
      const newCompletedCount = completedChallenges.length + 1;
      
      if (newCompletedCount === totalChallenges) {
        // All challenges completed, but pack isn't fully completed until final reflection
        // Don't auto-show completion modal - let user click the "Complete Pack" button
        toast({
          title: "🎉 All Challenges Complete!",
          description: "Great job! Click 'Complete Pack' to finish with your final reflection.",
          duration: 4000,
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
    }
    
    setCompletingChallenge(null);
  };

  const closeShareModal = () => {
    setShareModal({
      isOpen: false,
      challengeText: '',
      challengeIndex: null
    });
  };

  const handlePackCompletion = async (completionData) => {
    setCompletionModal(prev => ({ ...prev, isCompleting: true }));

    try {
      // Validate required data
      if (!user?.id) {
        throw new Error("User authentication required");
      }
      
      if (!packId) {
        throw new Error("Pack ID not found");
      }
      
      if (!completionData.reflection || completionData.reflection.trim().length < 10) {
        throw new Error("Final reflection must be at least 10 characters");
      }

      console.log('Completing pack:', {
        user_id: user.id,
        pack_id: packId,
        final_reflection: completionData.reflection.trim(),
        image_url: completionData.imageUrl,
        visibility: completionData.visibility
      });

      // Call the database function to complete the pack
      const { data, error } = await supabase.rpc('complete_pack_challenge', {
        p_user_id: user.id,
        p_pack_id: parseInt(packId), // Convert to BIGINT for challenge_packs.id
        p_final_reflection: completionData.reflection.trim(),
        p_image_url: completionData.imageUrl || null,
        p_visibility: completionData.visibility || 'public'
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        // Handle specific Supabase errors
        if (error.code === 'PGRST116') {
          throw new Error("Pack not found. Please try refreshing the page.");
        } else if (error.message?.includes('Not all challenges completed')) {
          throw new Error("Please complete all challenges before finalizing the pack.");
        } else if (error.message?.includes('not found')) {
          throw new Error("Pack not found. Please try refreshing the page.");
        } else {
          throw new Error(error.message || "Failed to complete pack");
        }
      }

      if (!data) {
        throw new Error("No response from server. Please try again.");
      }

      console.log('Pack completion result:', data);

      // Update local state
      setPackProgress(prev => prev ? { ...prev, is_completed: true } : null);

      // Close modal and show success
      setCompletionModal({
        isOpen: false,
        isCompleting: false
      });

      // Show detailed success message
      let successMessage = `Pack Completed! You earned ${data.xp_awarded} XP.`;
      if (data.community_post_created) {
        successMessage += " Your achievement has been shared with the community!";
      }

      toast({
        title: "🎉 Pack Completed!",
        description: successMessage,
        duration: 5000,
      });

      // Dispatch event for real-time community updates
      if (data.community_post_created) {
        window.dispatchEvent(new CustomEvent('newCommunityPost', {
          detail: {
            type: 'pack_completion',
            packTitle: data.pack_title,
            reflection: completionData.reflection,
            xpAwarded: data.xp_awarded
          }
        }));
      }

      // Navigate back to Challenge page after a delay
      setTimeout(() => {
        navigate('/challenge');
      }, 3000);

    } catch (error) {
      console.error('Error completing pack:', error);
      toast({
        title: "Error Completing Pack",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletionModal(prev => ({ ...prev, isCompleting: false }));
    }
  };

  const closeCompletionModal = () => {
    setCompletionModal({
      isOpen: false,
      isCompleting: false
    });
  };

  if (loading || !pack) {
    console.log('ChallengePackDetailsPage: Loading state', { loading, pack, packId, challengePacksLength: challengePacks.length });
    return (
      <div className="min-h-screen p-4 bg-sun-beige">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUnlocked = isPackUnlocked(pack);
  const isStarted = packProgress !== null;
  const isCompleted = packProgress?.is_completed;
  const totalChallenges = pack.challenges?.length || 0;
  const completedCount = completedChallenges.length;
  const completionPercentage = totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;
  
  // Check if all challenges are completed but pack isn't fully completed yet
  const allChallengesCompleted = completedCount === totalChallenges && totalChallenges > 0;
  const needsFinalReflection = allChallengesCompleted && !isCompleted;

  // Pack gradient mapping (same as carousel)
  const getPackGradient = (title) => {
    const gradientMap = {
      'Confidence Sprint': 'from-orange-400 via-orange-500 to-yellow-400',
      'Mindful Morning': 'from-blue-400 via-cyan-500 to-teal-400',
      'Self-Control Boost': 'from-purple-400 via-pink-500 to-red-400',
      'Resilience Builder': 'from-green-400 via-emerald-500 to-teal-500',
      'Gratitude Growth': 'from-purple-500 via-violet-500 to-pink-500',
      'Purpose Path': 'from-indigo-400 via-purple-500 to-pink-400',
      'Communication Upgrade': 'from-blue-500 via-sky-500 to-cyan-400',
      'Humility & Perspective': 'from-slate-400 via-gray-500 to-zinc-400',
      'Energy & Movement': 'from-red-400 via-pink-500 to-rose-400',
      'Digital Detox': 'from-slate-500 via-gray-600 to-neutral-500'
    };
    
    return gradientMap[title] || 'from-forest-green via-green-500 to-emerald-400';
  };

  const packGradient = pack ? getPackGradient(pack.title) : 'from-forest-green via-green-500 to-emerald-400';

  return (
    <div className="min-h-screen p-4 bg-sun-beige pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
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
        </div>

        {/* Pack Info Card */}
        <Card className="overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${packGradient} text-white relative`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{pack.icon || '🎯'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl font-bold text-white">{pack.title}</CardTitle>
                    {isCompleted && <Trophy className="w-6 h-6 text-yellow-300" />}
                  </div>
                  <p className="text-white/90 mb-4">{pack.description}</p>
                  
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Badge variant="outline" className="flex items-center gap-1 bg-white/20 text-white border-white/30">
                      <Calendar className="w-3 h-3" />
                      {totalChallenges} challenges
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 bg-white/20 text-white border-white/30">
                      <Star className="w-3 h-3" />
                      Level {pack.level_required}+
                    </Badge>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30">{pack.category || 'Growth'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Progress Section */}
            {isStarted ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Your Progress</h3>
                  <span className="text-sm text-gray-500">
                    {completedCount} of {totalChallenges} completed
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-3 mb-2" />
                <p className="text-sm text-gray-600">
                  {Math.round(completionPercentage)}% complete
                </p>
              </div>
            ) : (
              <div className="mb-6 text-center">
                {isUnlocked ? (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to Start?</h3>
                    <p className="text-gray-600 mb-4">
                      Begin your {pack.duration_days}-day journey with {totalChallenges} meaningful challenges.
                    </p>
                    <Button onClick={handleStartPack} size="lg" className="bg-forest-green hover:bg-forest-green/90">
                      <Play className="w-4 h-4 mr-2" />
                      Start Pack
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-2">Pack Locked</h3>
                    <p className="text-gray-600">
                      Reach Level {pack.level_required} to unlock this challenge pack.
                      You're currently at Level {progress?.level || 1}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Challenges List */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Challenges</h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {pack.challenges?.map((challenge, index) => {
                    const isChallengeCompleted = completedChallenges.includes(index);
                    const isCompletingThis = completingChallenge === index;
                    const canComplete = isStarted && !isChallengeCompleted && isUnlocked;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`transition-all duration-200 ${
                          isChallengeCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : canComplete 
                              ? 'hover:shadow-md cursor-pointer border-blue-200' 
                              : 'opacity-60'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {isChallengeCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm text-gray-600">
                                    Challenge {index + 1}
                                  </h4>
                                  {isChallengeCompleted && (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <p className={`mt-1 ${isChallengeCompleted ? 'line-through text-gray-500' : ''}`}>
                                  {challenge}
                                </p>
                                {canComplete && (
                                  <Button
                                    onClick={() => handleCompleteChallenge(index)}
                                    size="sm"
                                    className="mt-2 bg-blue-600 hover:bg-blue-700"
                                    disabled={isCompletingThis}
                                  >
                                    {isCompletingThis ? 'Completing...' : 'Mark Complete'}
                                  </Button>
                                )}
                                {isChallengeCompleted && (
                                  <Button
                                    onClick={() => setShareModal({
                                      isOpen: true,
                                      challengeText: challenge,
                                      challengeIndex: index
                                    })}
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    <Share2 className="w-3 h-3 mr-1" />
                                    Share
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Final Reflection Needed */}
            {needsFinalReflection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg text-center"
              >
                <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-bold text-lg text-blue-800">Almost There!</h3>
                <p className="text-blue-700 mb-4">
                  You've completed all challenges! Now share your final reflection to complete the pack.
                </p>
                <Button 
                  onClick={() => setCompletionModal({ isOpen: true, isCompleting: false })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Complete Pack
                </Button>
              </motion.div>
            )}

            {/* Completion Reward */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg text-center"
              >
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-bold text-lg text-green-800">Pack Completed!</h3>
                <p className="text-green-700">
                  You earned 50 XP and 2 Streak Freeze Tokens for completing this pack!
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Challenge Pack Share Modal */}
      <ChallengePackShareModal
        isOpen={shareModal.isOpen}
        onClose={closeShareModal}
        packTitle={pack?.title}
        challengeText={shareModal.challengeText}
        challengeIndex={shareModal.challengeIndex}
        packId={packId}
      />

      {/* Pack Completion Modal */}
      <PackCompletionModal
        isOpen={completionModal.isOpen}
        onClose={closeCompletionModal}
        pack={pack}
        onComplete={handlePackCompletion}
        isCompleting={completionModal.isCompleting}
      />
    </div>
  );
};

export default ChallengePackDetailsPage; 