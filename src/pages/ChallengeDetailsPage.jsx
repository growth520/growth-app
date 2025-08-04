import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Flame, Trophy, Gift, Sparkles, Crown, Target } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { getLevelInfo } from '@/lib/levelSystem';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import PackCompletionModal from '@/components/gamification/PackCompletionModal';

// Gamification Modal Components
const StreakModal = ({ open, onOpenChange, streakCount }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onOpenChange}
  >
    <motion.div
      initial={{ y: 50 }}
      animate={{ y: 0 }}
      exit={{ y: 50 }}
      className="bg-white rounded-2xl p-8 mx-4 max-w-sm text-center shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <Flame className="w-16 h-16 text-orange-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">🔥 Streak Day {streakCount}!</h2>
      </div>
      <p className="text-gray-600 mb-6">Keep the momentum going! You're building an amazing habit.</p>
      <Button onClick={onOpenChange} className="w-full bg-orange-500 hover:bg-orange-600">
        Continue Growing! 
      </Button>
    </motion.div>
  </motion.div>
);

const BonusModal = ({ open, onOpenChange, bonusType, bonusAmount }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onOpenChange}
  >
    <motion.div
      initial={{ y: 50 }}  
      animate={{ y: 0 }}
      exit={{ y: 50 }}
      className="bg-white rounded-2xl p-8 mx-4 max-w-sm text-center shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <Gift className="w-16 h-16 text-green-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">🎁 Bonus Unlocked!</h2>
      </div>
      <p className="text-gray-600 mb-6">
        {bonusType === 'tokens' && `+${bonusAmount} Streak Freeze Token${bonusAmount > 1 ? 's' : ''}!`}
        {bonusType === 'milestone' && `Milestone completed! +${bonusAmount} bonus XP!`}
      </p>
      <Button onClick={onOpenChange} className="w-full bg-green-500 hover:bg-green-600">
        Awesome!
      </Button>
    </motion.div>
  </motion.div>
);

const ChallengeDetailsPage = () => {
  const { challengeId, packId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, progress, refreshAllData, triggerChallengeCompletionRefresh } = useData();
  const { toast } = useToast();
  const navigateTimeoutRef = useRef(null);

  // State management
  const [challenge, setChallenge] = useState(null);
  const [packProgress, setPackProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gamification modal states
  const [levelUpModal, setLevelUpModal] = useState({ open: false, newLevel: 0 });
  const [streakModal, setStreakModal] = useState({ open: false, streakCount: 0 });
  const [bonusModal, setBonusModal] = useState({ open: false, bonusType: '', bonusAmount: 0 });
  const [completionModal, setCompletionModal] = useState({ isOpen: false, isCompleting: false });

  const fetchChallengeDetails = async () => {
    console.log('ChallengeDetailsPage: fetchChallengeDetails called');
    console.log('ChallengeDetailsPage: location.state:', location.state);
    console.log('ChallengeDetailsPage: location.state?.challenge:', location.state?.challenge);
    
    // Debug user's growth area selection
    console.log('=== CHALLENGE DETAILS DEBUG ===');
    console.log('User profile:', profile);
    console.log('User selected growth area:', profile?.assessment_results?.userSelection);
    console.log('Challenge category from location:', location.state?.challenge?.category);
    console.log('Mismatch detected:', profile?.assessment_results?.userSelection !== location.state?.challenge?.category);
    
    // Check for growth area mismatch and regenerate challenge if needed
    const userSelectedArea = profile?.assessment_results?.userSelection;
    const challengeFromLocation = location.state?.challenge;
    
    if (userSelectedArea && challengeFromLocation && challengeFromLocation.category !== userSelectedArea) {
      console.log('=== GROWTH AREA MISMATCH DETECTED ===');
      console.log('Regenerating challenge for user selected area:', userSelectedArea);
      
      // Import the challenge generation logic
      const { fetchChallengesFromCSV } = await import('@/lib/utils');
      
      try {
        // Fetch all challenges
        const allChallenges = await fetchChallengesFromCSV();
        
        // Filter challenges for the user's selected growth area
        const filteredChallenges = allChallenges.filter(c => c.category === userSelectedArea);
        
        console.log(`Found ${filteredChallenges.length} challenges for ${userSelectedArea}`);
        
        if (filteredChallenges.length > 0) {
          // Select a random challenge from the user's selected growth area
          const randomChallenge = filteredChallenges[Math.floor(Math.random() * filteredChallenges.length)];
          
          console.log('Generated new challenge:', randomChallenge);
          
          // Update the challenge state with the new challenge
          setChallenge({
            title: randomChallenge.title,
            description: randomChallenge.description,
            category: randomChallenge.category,
            id: Number(randomChallenge.id),
          });
          
          setLoading(false);
          return;
        } else {
          console.log(`No challenges found for ${userSelectedArea}, using fallback`);
        }
      } catch (error) {
        console.error('Error regenerating challenge:', error);
      }
    }
    
    // First, try to use the challenge passed via navigation state
    if (location.state?.challenge) {
      console.log('ChallengeDetailsPage: Using challenge from location.state:', location.state.challenge);
      setChallenge(location.state.challenge);
      setLoading(false); // Set loading to false since we have the challenge
      return;
    }
    
    console.log('ChallengeDetailsPage: No challenge in location.state, trying fallback...');
    
    // Fallback: try to fetch from challenges table by numeric id
    if (progress?.current_challenge_id) {
      console.log('ChallengeDetailsPage: Fetching challenge by ID:', progress.current_challenge_id);
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', progress.current_challenge_id)
        .single();
      if (error) {
        if (!import.meta.env.PROD) console.error('Error fetching challenge:', error);
        toast({ title: 'Error', description: 'Could not fetch challenge details.', variant: 'destructive' });
        navigate('/challenge');
      } else {
        console.log('ChallengeDetailsPage: Fetched challenge from database:', data);
        setChallenge(data);
        setLoading(false); // Set loading to false since we have the challenge
      }
    } else if (!loading) {
      console.log('ChallengeDetailsPage: No current_challenge_id, navigating back to challenge page');
      navigate('/challenge');
    }
  };

  useEffect(() => {
    console.log('ChallengeDetailsPage: useEffect triggered');
    console.log('ChallengeDetailsPage: progress:', progress);
    console.log('ChallengeDetailsPage: loading:', loading);
    console.log('ChallengeDetailsPage: location.state:', location.state);
    fetchChallengeDetails();
  }, [progress, loading, navigate, toast, location.state]);

  // Debug when challenge state changes
  useEffect(() => {
    console.log('ChallengeDetailsPage: challenge state updated:', challenge);
  }, [challenge]);

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, []);

  if (loading || !challenge) {
    return <div className="min-h-screen flex items-center justify-center bg-sun-beige"><div className="text-charcoal-gray">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen p-4 bg-sun-beige pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(packId ? `/challenge-packs/${packId}` : '/challenge')}
            className="text-forest-green hover:bg-forest-green/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-forest-green">Complete Challenge</h1>
            <p className="text-charcoal-gray/70">Share your experience to earn rewards</p>
          </div>
        </div>

        {/* Challenge Card */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-forest-green/10 rounded-full">
                <Target className="w-6 h-6 text-forest-green" />
              </div>
              <div>
                <CardTitle className="text-xl text-forest-green">
                  {challenge?.title || 'Today\'s Challenge'}
                </CardTitle>
                <CardDescription>
                  Read through your challenge and prepare to complete it
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {challenge?.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {challenge?.description}
              </p>
            </div>

            {/* Challenge Info */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-forest-green/10 text-forest-green">
                {challenge?.xp_reward || 10} XP
              </Badge>
              {challenge?.category && (
                <Badge variant="outline">
                  {challenge.category}
                </Badge>
              )}
            </div>

            {/* Complete Challenge Button */}
            <Button
              onClick={() => navigate(`/challenge-completion/${challenge?.id}${packId ? `/${packId}` : ''}`, { 
                state: { challenge: challenge } 
              })}
              className="w-full py-3 bg-forest-green hover:bg-forest-green/90 text-white"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Complete Challenge
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gamification Modals */}
      <LevelUpModal 
        open={levelUpModal.open} 
        onOpenChange={() => setLevelUpModal({ open: false, newLevel: 0 })}
        newLevel={levelUpModal.newLevel}
      />

      <AnimatePresence>
        {streakModal.open && (
          <StreakModal
            open={streakModal.open}
            onOpenChange={() => setStreakModal({ open: false, streakCount: 0 })}
            streakCount={streakModal.streakCount}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bonusModal.open && (
          <BonusModal
            open={bonusModal.open}
            onOpenChange={() => setBonusModal({ open: false, bonusType: '', bonusAmount: 0 })}
            bonusType={bonusModal.bonusType}
            bonusAmount={bonusModal.bonusAmount}
          />
        )}
      </AnimatePresence>

      {/* Pack Completion Modal */}
      {packId && (
        <PackCompletionModal
          isOpen={completionModal.isOpen}
          onClose={() => setCompletionModal({ isOpen: false, isCompleting: false })}
          pack={challenge?.pack}
          onComplete={async (completionData) => {
            setCompletionModal(prev => ({ ...prev, isCompleting: true }));
            try {
              const { data, error } = await supabase.rpc('complete_pack_challenge', {
                p_user_id: user.id,
                p_pack_id: parseInt(packId), // Convert to BIGINT for challenge_packs.id
                p_final_reflection: completionData.reflection.trim(),
                p_image_url: completionData.imageUrl || null,
                p_visibility: completionData.visibility || 'public'
              });

              if (error) throw error;

              setCompletionModal({ isOpen: false, isCompleting: false });
              
              toast({
                title: "🎉 Pack Completed!",
                description: `Congratulations! You earned ${data.xp_awarded} XP${data.community_post_created ? ' and shared with the community' : ''}.`,
                duration: 5000,
              });

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

              setTimeout(() => {
                navigate('/progress');
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
          }}
          isCompleting={completionModal.isCompleting}
        />
      )}
    </div>
  );
};

export default ChallengeDetailsPage;