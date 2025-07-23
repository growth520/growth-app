import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Zap, Users, BarChart, SkipForward, RefreshCw, Smile, Award, Settings, AlertTriangle, Globe, Lock, Camera, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchChallengesFromCSV } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

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
      }).catch(console.error);
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
    
    // Only redirect to assessment if we're certain the user hasn't completed it
    // Don't redirect if profile is still loading (undefined)
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

  if (loading || !profile || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto"></div>
          <div className="text-charcoal-gray text-lg">
            {!profile ? 'Loading profile...' : !progress ? 'Loading progress...' : 'Loading your journey...'}
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = progress ? (progress.xp / progress.xp_to_next_level) * 100 : 0;

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
      <div className="container mx-auto px-4 pt-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-forest-green mb-1">
              {isFirstTime ? "Welcome to Growth 👋" : `Welcome back, ${profile.full_name} 👋`}
            </h1>
            <p className="text-charcoal-gray/80 text-lg">
              {isFirstTime ? "This is where your journey begins." : "Let’s keep growing today."}
            </p>
          </div>
        </motion.div>

        {noMoreChallenges ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl overflow-hidden text-center p-8">
              <Award className="w-16 h-16 text-warm-orange mx-auto mb-4" />
              <CardTitle className="font-poppins text-2xl font-bold text-forest-green">Wow, Incredible!</CardTitle>
              <CardContent className="p-0 pt-4">
                <p className="text-lg text-charcoal-gray leading-relaxed mb-6">
                  You've completed all the challenges in this category for now. Check back soon for new ones!
                </p>
                <Button onClick={() => navigate('/community')} className="bg-leaf-green text-white">
                  Visit the Community
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : hasCompletedToday() && !showExtraChallenge ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl overflow-hidden text-center p-8">
              <CardTitle className="font-poppins text-2xl font-bold text-forest-green mb-4">You've completed today's challenge!</CardTitle>
              <CardContent className="p-0 pt-4">
                <Button onClick={async () => {
                  // If we already have an extra challenge for today, show it
                  if (extraChallenge) {
                    setShowExtraChallenge(true);
                    return;
                  }
                  
                  // Otherwise, get or create one
                  const extra = await getRandomExtraChallenge();
                  if (extra) {
                    setExtraChallenge(extra);
                    setShowExtraChallenge(true);
                  } else {
                    toast({ title: 'No Extra Challenges', description: 'No extra challenges available in this area right now!', variant: 'destructive' });
                  }
                }} className="bg-warm-orange text-white font-bold py-3 text-base rounded-xl">
                  Give me an extra challenge
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : showExtraChallenge && extraChallenge ? (
          <motion.div key="extra" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="font-poppins text-3xl font-bold text-forest-green">Extra Challenge</CardTitle>
                <CardDescription className="text-charcoal-gray/80 text-base pt-1">{extraChallenge.title}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <p className="text-lg text-charcoal-gray leading-relaxed">{extraChallenge.description || extraChallenge.title}</p>
                <Textarea
                  value={extraReflection}
                  onChange={(e) => setExtraReflection(e.target.value)}
                  placeholder="How did this extra challenge make you feel? What did you learn?"
                  className="min-h-[150px] text-base rounded-xl bg-white/80 border-charcoal-gray/20"
                  disabled={isSubmittingExtra}
                />
                {photoPreview && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                    <img src={photoPreview} alt="Reflection preview" className="w-full h-full object-cover" />
                    {!isSubmittingExtra && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="destructive" size="icon" onClick={handleRemovePhoto}>
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                  accept="image/*"
                  disabled={isSubmittingExtra}
                />
                <Button
                  variant="outline"
                  className="w-full border-charcoal-gray/30 text-charcoal-gray font-bold py-6 text-base rounded-xl"
                  onClick={() => fileInputRef.current.click()}
                  disabled={isSubmittingExtra}
                >
                  <Camera className="w-5 h-5 mr-2" /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {/* Privacy Selector for Extra Challenge */}
                <Select value={privacy} onValueChange={setPrivacy} disabled={isSubmittingExtra}>
                  <SelectTrigger className="w-full border-charcoal-gray/30 text-charcoal-gray font-bold py-6 text-base rounded-xl">
                    <SelectValue placeholder="Select privacy..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public"><div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Public (share to community)</div></SelectItem>
                    <SelectItem value="friends"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> Friends Only</div></SelectItem>
                    <SelectItem value="private"><div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Private</div></SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmitExtraReflection} disabled={isSubmittingExtra} className="w-full bg-gradient-to-r from-warm-orange to-orange-400 text-white font-bold py-6 text-base rounded-xl">
                  Submit Reflection
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : currentChallenge ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="p-6">
                <CardTitle className="font-poppins text-2xl font-bold text-forest-green">Today's Challenge</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <p className="text-lg text-charcoal-gray leading-relaxed">
                  {currentChallenge.title}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {progress?.current_challenge_id === currentChallenge.id ? (
                      <Button
                        onClick={() => { 
                          navigate('/challenge-details', { state: { challenge: currentChallenge } }); 
                        }}
                        className="bg-gradient-to-r from-warm-orange to-orange-400 text-white font-bold py-4 px-4 text-base rounded-xl h-auto min-h-[60px] flex flex-col touch-manipulation"
                      >
                        <span>Complete</span>
                        <span>Challenge</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => { handleAccept(); }}
                        className="bg-gradient-to-r from-warm-orange to-orange-400 text-white font-bold py-4 px-4 text-base rounded-xl h-auto min-h-[60px] flex flex-col touch-manipulation"
                      >
                        <span>Accept</span>
                        <span>Challenge</span>
                      </Button>
                    )}
                    <Button onClick={handleSkip} variant="outline" className="border-charcoal-gray/30 text-charcoal-gray font-bold py-4 px-4 text-base rounded-xl h-auto min-h-[60px] flex flex-col touch-manipulation">
                      <SkipForward className="w-5 h-5 mb-1" />
                      <span>New Challenge</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
           <div className="min-h-[200px] flex items-center justify-center bg-sun-beige"><div className="text-charcoal-gray">Assigning your next challenge...</div></div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white/50 border-black/10 shadow-md rounded-2xl p-4 h-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warm-orange/20 rounded-full"><Zap className="w-6 h-6 text-warm-orange" /></div>
                <div>
                  <p className="font-bold text-2xl text-forest-green">{progress?.streak || 0} days</p>
                  <p className="text-sm text-charcoal-gray/70">in a row</p>
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white/50 border-black/10 shadow-md rounded-2xl p-4 h-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-forest-green/20 rounded-full"><BarChart className="w-6 h-6 text-forest-green" /></div>
                <div>
                  <p className="font-bold text-lg text-forest-green">Level {progress?.level || 1}</p>
                  <Progress value={progressPercentage} className="h-2 mt-1 bg-forest-green/20 [&>div]:bg-forest-green" />
                </div>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-white/50 border-black/10 shadow-md rounded-2xl p-4 h-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-leaf-green/20 rounded-full"><Users className="w-6 h-6 text-leaf-green" /></div>
                <div>
                  <p className="font-bold text-lg text-forest-green">Community</p>
                  <p className="text-sm text-charcoal-gray/70 hover:underline cursor-pointer" onClick={() => navigate('/community')}>See how others grew</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
            <Card className="bg-white/50 border-black/10 shadow-md rounded-2xl">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h3 className="font-poppins font-bold text-forest-green">Need a new direction?</h3>
                        <p className="text-charcoal-gray/70 text-sm">Your current focus is <strong>{profile.assessment_results?.userSelection || 'not set'}</strong>. Retake the assessment for a new focus.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="border-forest-green text-forest-green hover:bg-forest-green/10 hover:text-forest-green flex-shrink-0">
                                <Settings className="w-4 h-4 mr-2" /> Change Focus
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-sun-beige border-forest-green/20">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-warm-orange"/>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will reset your focus area and assign you a new set of challenges. Your level, XP, and badges will be saved, but your current challenge progress will be lost. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={retakeAssessment} className="bg-warm-orange hover:bg-warm-orange/90">Yes, change my focus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </motion.div>
      </div>

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