import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Zap, Users, BarChart, SkipForward, RefreshCw, Smile, Award, Settings, AlertTriangle, Globe, Lock, Camera, Trash2, Target, CheckCircle, Star, Sparkles, Plus, Flame, Trophy, Gift } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchChallengesFromCSV } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import PersonalizedSuggestion from '@/components/gamification/PersonalizedSuggestion';
import Leaderboard from '@/components/gamification/Leaderboard';

const motivationalQuotes = [
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain", year: "c. 1880" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", year: "c. 500 BC" },
    { quote: "Believe you can and you’re halfway there.", author: "Theodore Roosevelt", year: "c. 1910" },
];

const ChallengePage = () => {
  const { profile, progress, loading, refreshProgress, refreshAllData } = useData();
  const { user } = useAuth();
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [quote, setQuote] = useState(motivationalQuotes[0]);
  const [noMoreChallenges, setNoMoreChallenges] = useState(false);
  const [allChallenges, setAllChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [showExtraChallenge, setShowExtraChallenge] = useState(false);
  const [extraChallenge, setExtraChallenge] = useState(null);
  const [extraReflection, setExtraReflection] = useState('');
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);
  const [lastCompletedAt, setLastCompletedAt] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load challenges from CSV on mount
  useEffect(() => {
    const cachedChallenges = localStorage.getItem('allChallenges');
    if (cachedChallenges) {
      setAllChallenges(JSON.parse(cachedChallenges));
    } else {
      fetchChallengesFromCSV().then(data => {
        setAllChallenges(data);
        localStorage.setItem('allChallenges', JSON.stringify(data));
      }).catch(error => {
        console.error('Error loading challenges:', error);
        toast({
          title: "Error Loading Challenges",
          description: "Failed to load challenges. Please refresh the page.",
          variant: "destructive",
        });
      });
    }
  }, []);

  // Fetch completed challenge IDs from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchCompleted = async () => {
      const { data, error } = await supabase
        .from('completed_challenges')
        .select('challenge_id')
        .eq('user_id', user.id);
      if (!error && data) {
        const completedIds = data.map(row => Number(row.challenge_id));
        setCompletedChallenges(completedIds);
      } else {
        setCompletedChallenges([]);
      }
    };
    fetchCompleted();
  }, [user]);

  // Fetch the most recent completed challenge date for the user
  useEffect(() => {
    if (!user) return;
    const fetchLastCompleted = async () => {
      const { data, error } = await supabase
        .from('completed_challenges')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        setLastCompletedAt(data[0].completed_at);
      } else {
        setLastCompletedAt(null);
      }
    };
    fetchLastCompleted();
  }, [user, progress]);

  // Helper to get a random challenge from the CSV, filtered by area and not completed
  const getRandomChallenge = useCallback((area) => {
    const filtered = allChallenges.filter(c => c['category'] === area && !completedChallenges.includes(Number(c['id'])));
    if (filtered.length === 0) return null;

    // Check if we have a cached challenge
    const cachedChallenge = localStorage.getItem('currentChallenge');
    if (cachedChallenge) {
      const parsed = JSON.parse(cachedChallenge);
      // Only use the cached challenge if it's from the same area and not completed
      if (parsed.category === area && !completedChallenges.includes(Number(parsed.id))) {
        return parsed;
      }
    }

    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    
    // Cache the new challenge
    localStorage.setItem('currentChallenge', JSON.stringify(chosen));
    
    return chosen;
  }, [allChallenges, completedChallenges]);

  // Helper to get or retrieve persisted extra challenge
  const getOrCreateExtraChallenge = async () => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    // Check if we have a cached extra challenge for today
    const cachedExtra = localStorage.getItem('extraChallenge');
    const cachedDate = localStorage.getItem('extraChallengeDate');
    
    if (cachedExtra && cachedDate === today) {
      try {
        const parsed = JSON.parse(cachedExtra);
        return parsed;
      } catch (error) {
        localStorage.removeItem('extraChallenge');
        localStorage.removeItem('extraChallengeDate');
      }
    }
    
    // Generate a new extra challenge for today
    const { data: all } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', profile.assessment_results?.userSelection || 'Confidence');
    
    if (!all || all.length === 0) return null;
    
    // Pick a random challenge
    const newExtra = all[Math.floor(Math.random() * all.length)];
    
    // Cache it for today
    localStorage.setItem('extraChallenge', JSON.stringify(newExtra));
    localStorage.setItem('extraChallengeDate', today);
    
    return newExtra;
  };

  // Load persisted extra challenge on component mount
  useEffect(() => {
    if (!user || !profile) return;
    
    const loadExtraChallenge = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const cachedExtra = localStorage.getItem('extraChallenge');
      const cachedDate = localStorage.getItem('extraChallengeDate');
      
      if (cachedExtra && cachedDate === today) {
        try {
          const parsed = JSON.parse(cachedExtra);
          setExtraChallenge(parsed);
        } catch (error) {
          localStorage.removeItem('extraChallenge');
          localStorage.removeItem('extraChallengeDate');
        }
      }
    };
    
    loadExtraChallenge();
  }, [user, profile]);

  // Helper to get a random extra challenge from the same area, now allowing repeats
  const getRandomExtraChallenge = async () => {
    return getOrCreateExtraChallenge();
  };

  // Photo upload logic for extra challenge
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
        setPhotoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitExtraReflection = async () => {
    if (!extraReflection.trim()) {
      toast({ title: "Reflection Required", description: "Please share your thoughts to complete the extra challenge!", variant: "destructive" });
      return;
    }
    setIsSubmittingExtra(true);
    try {
      let postPhotoUrl = null;
      // If photo is uploaded, upload to Supabase Storage (optional, else keep as null)
      if (photoPreview && photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('photos').upload(fileName, photoFile, { upsert: true });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(fileName);
          postPhotoUrl = publicUrlData.publicUrl;
        } else {
          console.error('Photo upload error:', uploadError);
        }
      }
      // Insert into completed_challenges (always)
      await supabase.from('completed_challenges').insert({
        user_id: user.id,
        challenge_id: extraChallenge.id,
        completed_at: new Date().toISOString(),
        reflection: extraReflection,
        photo_url: postPhotoUrl,
        category: extraChallenge.category
      });
      // Insert into posts if public
      if (privacy === 'public' || privacy === 'friends') {
        const postData = {
          user_id: user.id,
          challenge_id: extraChallenge.id,
          reflection: extraReflection,
          photo_url: postPhotoUrl,
          category: extraChallenge.category,
          created_at: new Date().toISOString(),
          challenge_title: extraChallenge.title,
          visibility: privacy,
        };
        const { error: postError } = await supabase.from('posts').insert(postData);
        if (postError) {
          console.error('Error inserting extra challenge post:', postError);
          toast({ title: 'Error inserting post', description: postError.message || 'Unknown error', variant: 'destructive' });
        }
      }
      // Add 5 XP only
      let newXp = (progress?.xp || 0) + 5;
      await supabase.from('user_progress').update({ xp: newXp }).eq('user_id', user.id);
      await refreshAllData();
      toast({ title: "🎁 Extra Challenge Completed!", description: `You earned 5 XP!` });
      
      // Clear the extra challenge cache since it's completed
      localStorage.removeItem('extraChallenge');
      localStorage.removeItem('extraChallengeDate');
      
      setShowExtraChallenge(false);
      setExtraChallenge(null);
      setExtraReflection('');
      setPhotoPreview(null);
      setPhotoFile(null);
      setTimeout(() => navigate('/challenge'), 1500);
    } catch (error) {
      toast({ title: "Error Saving Progress", description: error.message || "Something went wrong. Please try again.", variant: "destructive" });
      setIsSubmittingExtra(false);
    }
  };

  // Helper to check if user has completed a challenge today
  const hasCompletedToday = () => {
    if (!lastCompletedAt || !progress) return false;
    const today = new Date().toISOString().slice(0, 10);
    const isToday = lastCompletedAt.slice(0, 10) === today && !progress.current_challenge_id;
    return isToday;
  };

  const generateNewChallenge = useCallback(async (isRetake = false) => {
    if (!profile) return;
    const primaryArea = profile.assessment_results?.userSelection || 'Confidence';
    const uniqueAreas = Array.from(new Set(allChallenges.map(c => c['category'])));
    const newChallengeData = getRandomChallenge(primaryArea);
    if (!newChallengeData) {
      setNoMoreChallenges(true);
      setCurrentChallenge(null);
      return;
    }
    setNoMoreChallenges(false);
    setCurrentChallenge({
      title: newChallengeData['title'],
      description: newChallengeData['title'],
      category: newChallengeData['category'],
      id: Number(newChallengeData['id']),
    });
  }, [profile, allChallenges, completedChallenges, getRandomChallenge]);

  useEffect(() => {
    if (loading || allChallenges.length === 0) return;
    
    // Only redirect to assessment if profile is loaded AND assessment is explicitly not completed
    // Don't redirect if profile is still loading (undefined) or if assessment is completed
    if (profile && profile.has_completed_assessment === false) {
      navigate('/assessment', { replace: true });
      return;
    }
    
    // Only proceed if we have profile data and assessment is completed
    if (!profile || profile.has_completed_assessment !== true) return;
    
    setIsFirstTime(!progress?.current_challenge_id && progress?.xp === 0);
    
    // If there's an active challenge, load it from allChallenges
    if (progress?.current_challenge_id) {
      const found = allChallenges.find(c => Number(c['id']) === progress.current_challenge_id);
      if (found) {
        setCurrentChallenge({
          title: found['title'],
          description: found['title'],
          category: found['category'],
          id: Number(found['id']),
        });
      }
    }
    // Only generate a new challenge if:
    // 1. There's no active challenge AND
    // 2. User hasn't completed today's challenge AND
    // 3. There's no cached challenge from previous session
    else if (!hasCompletedToday()) {
      
      // First, try to load from cache
      const cachedChallenge = localStorage.getItem('currentChallenge');
      if (cachedChallenge) {
        try {
          const parsed = JSON.parse(cachedChallenge);
          setCurrentChallenge({
            title: parsed.title,
            description: parsed.title,
            category: parsed.category,
            id: Number(parsed.id),
          });
          return;
        } catch (error) {
          localStorage.removeItem('currentChallenge');
        }
      }
      
      // Only generate new challenge if no cache and allChallenges is loaded
      if (allChallenges.length > 0) {
        generateNewChallenge();
      }
    }
  }, [loading, profile, progress?.current_challenge_id, navigate, generateNewChallenge, allChallenges, lastCompletedAt]);
  
  const retakeAssessment = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ has_completed_assessment: false }).eq('id', user.id);
    await refreshAllData();
    navigate('/assessment', { replace: true });
  }

  // When user accepts a challenge, mark it as completed
  const handleAccept = async () => {
    if (currentChallenge && user) {
      // Don't remove from cache yet - keep it until challenge is completed
      const { error, data } = await supabase.from('user_progress').update({
        current_challenge_id: currentChallenge.id,
        challenge_assigned_at: new Date().toISOString()
      }).eq('user_id', user.id);
      await refreshProgress();
      // Pass the full challenge object to the detail screen
      navigate('/challenge-details', { state: { challenge: currentChallenge } });
      return;
    }
    navigate('/challenge-details');
  };

  const handleSkip = () => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    setShowSkipModal(true);
  };

  // Only generate a new challenge on skip confirmation
  const handleConfirmSkipAndGetNew = async () => {
    setShowSkipModal(false);
    if (!user) return;
    
    // Clear the cached challenge and generate a new one
    localStorage.removeItem('currentChallenge');
    
    // Reset streak if needed and clear current challenge
    await supabase
      .from('user_progress')
      .update({ streak: 0, current_challenge_id: null })
      .eq('user_id', user.id);
    
    await generateNewChallenge();
    await refreshProgress();
  };

  // Reset extra challenge at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0) - now;
    
    // Don't set timeout if it's more than 24 hours away (prevent overflow)
    if (msUntilMidnight > 24 * 60 * 60 * 1000) return;
    
    const timeout = setTimeout(() => {
      // Clear extra challenge at midnight
      localStorage.removeItem('extraChallenge');
      localStorage.removeItem('extraChallengeDate');
      setShowExtraChallenge(false);
      setExtraChallenge(null);
      setExtraReflection('');
    }, msUntilMidnight);
    
    return () => clearTimeout(timeout);
  }, []); // Run once on component mount

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto mb-4"></div>
          <p className="text-charcoal-gray">Loading your growth journey...</p>
        </div>
      </div>
    );
  }

  if (!profile.has_completed_assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <Target className="w-16 h-16 text-forest-green mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal-gray mb-4">
              Complete Your Assessment
            </h2>
            <p className="text-charcoal-gray/80 mb-6">
              Take our growth assessment to discover your personalized challenges and start your journey.
            </p>
            <Button 
              onClick={() => navigate('/assessment')} 
              className="w-full"
              size="lg"
            >
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = progress ? (progress.xp / progress.xp_to_next_level) * 100 : 0;

  return (
    <div className="min-h-screen bg-sun-beige p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with user progress */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-forest-green">
                Level {progress?.level || 1}
              </div>
              <div className="text-sm text-gray-600">
                {progress?.xp || 0} XP
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500 flex items-center gap-1">
                <Flame className="w-6 h-6" />
                {progress?.streak || 0}
              </div>
              <div className="text-sm text-gray-600">
                Day Streak
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-forest-green"
          >
            Your Growth Journey
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-charcoal-gray/80 max-w-2xl mx-auto"
          >
            {profile.assessment_results?.userSelection 
              ? `Focusing on ${profile.assessment_results.userSelection} development • ${quote.text}`
              : 'Welcome to your personalized growth experience'
            }
          </motion.p>
        </div>

        {/* AI Personalized Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PersonalizedSuggestion 
            onSuggestionUsed={(suggestion) => {
              // Could navigate to a challenge or create a custom challenge
              console.log('Suggestion used:', suggestion);
            }}
            onDismiss={() => {
              // Handle dismissal if needed
            }}
          />
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="text-center p-4">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {progress?.level || 1}
            </div>
            <div className="text-sm text-gray-600">Level</div>
          </Card>
          
          <Card className="text-center p-4">
            <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {progress?.xp || 0}
            </div>
            <div className="text-sm text-gray-600">XP</div>
          </Card>
          
          <Card className="text-center p-4">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {progress?.streak || 0}
            </div>
            <div className="text-sm text-gray-600">Streak</div>
          </Card>
          
          <Card className="text-center p-4">
            <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {progress?.tokens || 0}
            </div>
            <div className="text-sm text-gray-600">Tokens</div>
          </Card>
        </motion.div>

        {/* Main Challenge Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {noMoreChallenges ? (
            <Card className="text-center p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-charcoal-gray mb-4">
                Amazing Work! 🎉
              </h2>
              <p className="text-charcoal-gray/80 mb-6">
                You've completed all available challenges in your growth area. 
                New challenges are added regularly, so check back soon!
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/progress')}>
                  View Progress
                </Button>
                <Button variant="outline" onClick={() => navigate('/community')}>
                  Join Community
                </Button>
              </div>
            </Card>
          ) : currentChallenge ? (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-forest-green to-leaf-green text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl mb-2">
                      Today's Challenge
                    </CardTitle>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {currentChallenge.category}
                    </Badge>
                  </div>
                  <Target className="w-8 h-8" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-charcoal-gray mb-4">
                  {currentChallenge.title}
                </h3>
                <p className="text-charcoal-gray/80 mb-6 leading-relaxed">
                  {currentChallenge.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => navigate('/challenge-details', { 
                      state: { challenge: currentChallenge } 
                    })}
                    className="flex-1"
                    size="lg"
                  >
                    Start Challenge
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSkipModal(true)}
                    className="sm:w-auto"
                  >
                    Skip Today
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto mb-4"></div>
              <p className="text-charcoal-gray">Preparing your challenge...</p>
            </Card>
          )}
        </motion.div>

        {/* Extra Challenge Section */}
        {showExtraChallenge && extraChallenge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Star className="w-5 h-5" />
                  Bonus Challenge Available!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-orange-800 mb-2">
                  {extraChallenge.title}
                </h3>
                <p className="text-orange-700 mb-4">
                  {extraChallenge.description}
                </p>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Share your experience with this bonus challenge..."
                    value={extraReflection}
                    onChange={(e) => setExtraReflection(e.target.value)}
                    className="bg-white"
                  />
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-orange-700">
                      <input
                        type="radio"
                        name="extraPrivacy"
                        value="public"
                        checked={privacy === 'public'}
                        onChange={(e) => setPrivacy(e.target.value)}
                      />
                      Share publicly
                    </label>
                    <label className="flex items-center gap-2 text-sm text-orange-700">
                      <input
                        type="radio"
                        name="extraPrivacy"
                        value="private"
                        checked={privacy === 'private'}
                        onChange={(e) => setPrivacy(e.target.value)}
                      />
                      Keep private
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSubmitExtraReflection}
                      disabled={!extraReflection.trim() || isSubmittingExtra}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isSubmittingExtra ? 'Submitting...' : 'Complete Bonus (+5 XP)'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowExtraChallenge(false)}
                    >
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mini Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Leaderboard 
            title="Top Performers This Week"
            maxUsers={5}
            showPagination={false}
            showUserRank={true}
            defaultRankBy="xp"
          />
        </motion.div>

        {/* Quick Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Button 
            variant="outline" 
            onClick={() => navigate('/progress')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-sm">Progress</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/leaderboard')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-sm">Leaderboard</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/community')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Users className="w-6 h-6 text-blue-500" />
            <span className="text-sm">Community</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Star className="w-6 h-6 text-purple-500" />
            <span className="text-sm">Profile</span>
          </Button>
        </motion.div>
      </div>

      {/* Skip Challenge Modal - keeping existing modal code */}
      <Dialog open={showSkipModal} onOpenChange={setShowSkipModal}>
        <DialogContent className="bg-sun-beige border-forest-green/20 font-lato">
          <DialogHeader>
            <DialogTitle className="font-poppins text-2xl text-forest-green text-center">A Moment of Inspiration</DialogTitle>
            <DialogDescription className="text-center text-charcoal-gray/80 pt-4">
              <p className="text-lg italic">"{quote.quote}"</p>
              <p className="mt-4 font-bold">- {quote.author} ({quote.year})</p>
            </DialogDescription>
          </DialogHeader>
          <div className="border-t border-charcoal-gray/20 my-4"></div>
          <div className="text-center text-charcoal-gray/80 mb-4">
            ❓ Still want to skip this challenge?
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setShowSkipModal(false)} variant="outline" className="border-forest-green text-forest-green hover:bg-forest-green/10 hover:text-forest-green">
              <Smile className="w-4 h-4 mr-2" /> Okay, let’s grow
            </Button>
            <Button onClick={handleConfirmSkipAndGetNew} className="bg-forest-green text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Give me another
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallengePage;