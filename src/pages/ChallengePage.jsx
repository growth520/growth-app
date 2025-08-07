import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Import only the icons we actually use to reduce bundle size
import { 
  Zap, 
  Users, 
  BarChart, 
  SkipForward, 
  RefreshCw, 
  Smile, 
  Award, 
  AlertTriangle, 
  Globe, 
  Lock, 
  Camera, 
  Trash2, 
  Target, 
  CheckCircle, 
  Star, 
  Sparkles, 
  Flame, 
  Trophy,
  Plus,
  Gift,
  Snowflake,
  ArrowRight,
  Package,
  Rocket,
  Loader2
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchChallengesFromCSV } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useChallengePacks } from '@/hooks/useChallengePacks';
import IndividualChallengeModal from '@/components/gamification/IndividualChallengeModal';
import PackCompletionModal from '@/components/gamification/PackCompletionModal';

import { useToast } from '@/components/ui/use-toast';
import PersonalizedSuggestion from '@/components/gamification/PersonalizedSuggestion';
import Leaderboard from '@/components/gamification/Leaderboard';
import { getChallengesForGrowthArea } from '@/lib/growthAreaMapping';

const motivationalQuotes = [
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain", year: "c. 1880" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", year: "c. 500 BC" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", year: "c. 1910" },
];

// Pack gradient mapping for Challenge Pack cards
const getPackGradient = (title) => {
  const gradientMap = {
    'Confidence Sprint': 'from-orange-400 to-yellow-400',
    'Mindful Morning': 'from-blue-400 via-cyan-400 to-teal-400',
    'Self-Control Boost': 'from-purple-400 via-pink-400 to-red-400',
    'Resilience Builder': 'from-green-400 via-emerald-400 to-teal-400',
    'Gratitude Growth': 'from-purple-400 via-violet-400 to-pink-400',
    'Purpose Path': 'from-indigo-400 via-purple-400 to-pink-400',
    'Communication Upgrade': 'from-blue-400 via-sky-400 to-cyan-400',
    'Humility & Perspective': 'from-slate-400 via-gray-400 to-zinc-400',
    'Energy & Movement': 'from-red-400 via-pink-400 to-rose-400',
    'Digital Detox': 'from-slate-400 via-gray-400 to-neutral-400'
  };
  
  return gradientMap[title] || 'from-forest-green to-leaf-green';
};

const ChallengePage = () => {
  const { user } = useAuth();
  const { profile, progress, loading, refreshProgress, refreshAllData, triggerLevelUp } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Challenge Pack integration
  const { 
    challengePacks, 
    getPacksWithStatus, 
    getCompletedChallenges,
    getUserPackProgress,
    loading: packsLoading 
  } = useChallengePacks();

  // Challenge Pack state
  const [challengePackState, setChallengePackState] = useState({
    activePack: null,
    nextChallenge: null,
    progress: null,
    hasActivePackData: false
  });

  // Individual Challenge Modal state
  const [challengeModalState, setChallengeModalState] = useState({
    isOpen: false,
    currentChallenge: null,
    challengeIndex: null,
    isCompleting: false
  });

  // Pack Completion Modal state
  const [completionModal, setCompletionModal] = useState({
    isOpen: false,
    isCompleting: false
  });

  // Combine related state variables for better performance
  const [challengeState, setChallengeState] = useState({
    current: null,
    isFirstTime: false,
    allChallenges: [],
    completedChallenges: [],
    noMoreChallenges: false,
    lastCompletedAt: null,
    isLoadingNewChallenge: false
  });

  const [modalState, setModalState] = useState({
    showSkip: false,
    showExtra: false
  });

  const [extraChallengeState, setExtraChallengeState] = useState({
    challenge: null,
    reflection: '',
    isSubmitting: false
  });

  const [mediaState, setMediaState] = useState({
    photoPreview: null,
    photoFile: null,
    privacy: 'public'
  });

  const [quote, setQuote] = useState(motivationalQuotes[0]);

  // Memoized calculations for better performance
  const hasCompletedToday = useMemo(() => {
    if (!challengeState.lastCompletedAt || !progress) return false;
    const today = new Date().toISOString().slice(0, 10);
    const isToday = challengeState.lastCompletedAt.slice(0, 10) === today && !progress.current_challenge_id;
    return isToday;
  }, [challengeState.lastCompletedAt, progress]);

  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(challengeState.allChallenges.map(c => c['category'])));
  }, [challengeState.allChallenges]);

  const fileInputRef = React.useRef(null);

  // Load challenges from CSV on mount - optimize with useCallback
  const loadChallenges = useCallback(async () => {
    // Check if we already have challenges loaded
    if (challengeState.allChallenges.length > 0) {
      console.log('Challenges already loaded, skipping reload');
      return;
    }
    
    // Try to load from cache first
    const cachedChallenges = localStorage.getItem('allChallenges');
    if (cachedChallenges) {
      try {
        const data = JSON.parse(cachedChallenges);
        console.log('Loading challenges from cache:', data.length);
        setChallengeState(prev => ({ ...prev, allChallenges: data }));
        return;
      } catch (error) {
        console.log('Invalid cache, loading fresh data');
        localStorage.removeItem('allChallenges');
      }
    }
    
    try {
      const data = await fetchChallengesFromCSV();
      
      if (!import.meta.env.PROD) {
        console.log('Loaded challenges:', data.length);
        console.log('Categories found:', Array.from(new Set(data.map(c => c.category))));
        console.log('Resilience challenges:', data.filter(c => c.category === 'Resilience').length);
      }
      
      setChallengeState(prev => ({ ...prev, allChallenges: data }));
      localStorage.setItem('allChallenges', JSON.stringify(data));
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Error loading challenges:', error);
      toast({
        title: "Error Loading Challenges",
        description: "Could not load challenges. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [toast, challengeState.allChallenges.length]);

  // Load challenges once on mount
  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Check for active Challenge Pack
  const checkActivePack = useCallback(async () => {
    if (!user || packsLoading) return;
    
    try {
      // Get user's pack progress to find active packs
      const { data: packProgress, error } = await supabase
        .from('user_pack_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (packProgress && packProgress.length > 0) {
        const activePackData = packProgress[0];
        
        // Fetch the challenge pack separately to avoid relationship issues
        const { data: packData, error: packError } = await supabase
          .from('challenge_packs')
          .select('id, title, description, challenges, level_required')
          .eq('id', parseInt(activePackData.pack_id))
          .single();

        if (packError) {
          console.error('Error fetching challenge pack:', packError);
          throw packError;
        }

        const pack = packData;
        
        // Get completed challenges from the challenge_reflections JSONB field
        const challengeReflections = activePackData.challenge_reflections || [];
        const totalChallenges = Array.isArray(pack.challenges) ? pack.challenges.length : 0;
        const completedCount = challengeReflections.length;
        const currentIndex = activePackData.current_challenge_index || 0;
        
        // Find next uncompleted challenge
        let nextChallenge = null;
        if (completedCount < totalChallenges && currentIndex < totalChallenges) {
          // Make sure we're not trying to access an index that doesn't exist
          const nextIndex = Math.min(currentIndex, totalChallenges - 1);
          nextChallenge = {
            index: nextIndex,
            text: pack.challenges[nextIndex] || 'Challenge not available',
            isLast: nextIndex === totalChallenges - 1
          };
        } else if (completedCount >= totalChallenges) {
          // Pack is completed
          console.log('Pack completed:', pack.title);
        }

        console.log('Challenge Pack State Update:', {
          packTitle: pack.title,
          completedCount,
          totalChallenges,
          currentIndex,
          nextChallenge: nextChallenge?.text ? nextChallenge.text.substring(0, 50) + '...' : 'No next challenge',
          challengeReflections: challengeReflections.length,
          packChallengesLength: Array.isArray(pack.challenges) ? pack.challenges.length : 'Not an array',
          isPackCompleted: completedCount >= totalChallenges
        });

        setChallengePackState({
          activePack: pack,
          nextChallenge,
          progress: {
            completed: completedCount,
            total: totalChallenges,
            percentage: totalChallenges > 0 ? Math.round((completedCount / totalChallenges) * 100) : 0
          },
          hasActivePackData: true
        });

        // Force component re-render by updating a timestamp
        // This ensures React detects the state change
        setChallengePackState(prev => ({ ...prev, lastUpdated: Date.now() }));
      } else {
        setChallengePackState({
          activePack: null,
          nextChallenge: null,
          progress: null,
          hasActivePackData: true
        });
      }
    } catch (error) {
      console.error('Error checking active pack:', error);
      setChallengePackState(prev => ({ ...prev, hasActivePackData: true }));
    }
  }, [user, packsLoading]);

  // Check for active pack on component mount and when dependencies change
  useEffect(() => {
    checkActivePack();
  }, [checkActivePack]);

  // Individual Challenge Modal Handlers
  const handleOpenChallengeModal = useCallback((pack, challenge, challengeIndex) => {
    setChallengeModalState({
      isOpen: true,
      currentChallenge: challenge,
      challengeIndex,
      isCompleting: false
    });
  }, []);

  const handleCloseChallengeModal = useCallback(() => {
    setChallengeModalState({
      isOpen: false,
      currentChallenge: null,
      challengeIndex: null,
      isCompleting: false
    });
  }, []);

  const handleCompleteChallengeInModal = useCallback(async (completionData) => {
    setChallengeModalState(prev => ({ ...prev, isCompleting: true }));

    try {
      // Validate required data
      if (!user?.id) {
        throw new Error("User authentication required");
      }
      
      if (!challengePackState.activePack?.id) {
        throw new Error("No active pack found");
      }
      
      if (!completionData.reflection || completionData.reflection.trim().length < 10) {
        throw new Error("Reflection must be at least 10 characters");
      }

      console.log('Completing individual challenge:', {
        user_id: user.id,
        pack_id: challengePackState.activePack.id,
        reflection: completionData.reflection.trim()
      });

      // Call the database function with parameters in the correct order
      const { data, error } = await supabase.rpc('complete_individual_challenge', {
        p_pack_id: parseInt(challengePackState.activePack.id), // Convert to BIGINT for challenge_packs.id
        p_reflection: completionData.reflection.trim(),
        p_user_id: user.id
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        // Handle specific Supabase errors
        if (error.code === 'PGRST116') {
          throw new Error("Pack or progress not found. Please try refreshing the page.");
        } else if (error.message?.includes('already completed')) {
          throw new Error("This challenge has already been completed.");
        } else if (error.message?.includes('not found')) {
          throw new Error("Challenge pack not found. Please try refreshing the page.");
        } else {
          throw new Error(error.message || "Failed to complete challenge");
        }
      }

      if (!data) {
        throw new Error("No response from server. Please try again.");
      }

      console.log('Challenge completion result:', data);

      // Close modal first
      setChallengeModalState({
        isOpen: false,
        currentChallenge: null,
        challengeIndex: null,
        isCompleting: false
      });

      // Show success toast
      toast({
        title: "✅ Challenge Complete!",
        description: data.is_pack_complete 
          ? `Amazing! You've completed the entire pack!`
          : `Great progress! ${data.completed_count}/${data.total_challenges} challenges done.`,
        duration: 3000,
      });

      console.log('Challenge completed, refreshing pack state...', {
        completedCount: data.completed_count,
        totalChallenges: data.total_challenges,
        isPackComplete: data.is_pack_complete
      });

      // Add a small delay to ensure database is updated, then refresh
      await new Promise(resolve => {
        setTimeout(async () => {
          await checkActivePack();
          console.log('Pack state refreshed after delay');
          resolve();
        }, 500);
      });

      // If all challenges are completed but pack isn't fully completed yet, show message
      if (data.is_pack_complete && !challengePackState.activePack?.is_completed) {
        console.log('All challenges completed, pack needs final reflection...');
        // Don't auto-show completion modal - let user navigate to pack details to complete
        toast({
          title: "🎉 All Challenges Complete!",
          description: "Great job! Visit the pack details to complete your final reflection.",
          duration: 4000,
        });
      }

    } catch (error) {
      console.error('Error completing challenge:', error);
      
      // Show specific error message
      toast({
        title: "Error Completing Challenge",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setChallengeModalState(prev => ({ ...prev, isCompleting: false }));
    }
  }, [user, challengePackState.activePack, toast, checkActivePack]);

  // Fetch completed challenge IDs from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchCompleted = async () => {
      const { data, error } = await supabase
        .from('public.completed_challenges')
        .select('challenge_id')
        .eq('user_id', user.id);
      if (!error && data) {
        const completedIds = data.map(row => Number(row.challenge_id));
        setChallengeState(prev => ({ ...prev, completedChallenges: completedIds }));
      } else {
        setChallengeState(prev => ({ ...prev, completedChallenges: [] }));
      }
    };
    fetchCompleted();
  }, [user]);

  // Fetch the most recent completed challenge date for the user
  useEffect(() => {
    if (!user) return;
    const fetchLastCompleted = async () => {
      const { data, error } = await supabase
        .from('public.completed_challenges')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        setChallengeState(prev => ({ ...prev, lastCompletedAt: data[0].completed_at }));
      } else {
        setChallengeState(prev => ({ ...prev, lastCompletedAt: null }));
      }
    };
    fetchLastCompleted();
  }, [user, progress]);

  // Helper to get a random challenge from the CSV, filtered by area and not completed
  const getRandomChallenge = useCallback((area) => {
    // Debug logging
    console.log('getRandomChallenge called with area:', area);
    console.log('Total challenges available:', challengeState.allChallenges.length);
    console.log('Completed challenges:', challengeState.completedChallenges.length);
    console.log('Completed challenge IDs:', challengeState.completedChallenges);
    
    // Log all available categories
    const categories = [...new Set(challengeState.allChallenges.map(c => c['category']))];
    console.log('Available categories:', categories);
    
    // Log challenges for the requested area specifically
    const areaChallenges = challengeState.allChallenges.filter(c => c['category'] === area);
    console.log(`${area} challenges available:`, areaChallenges.length);
    if (areaChallenges.length > 0) {
      console.log(`Sample ${area} challenge:`, areaChallenges[0]);
    } else {
      console.log(`❌ NO CHALLENGES FOUND FOR ${area}!`);
    }
    
    // Look for challenges matching the exact category
    const filtered = challengeState.allChallenges.filter(c => {
      const matchesCategory = c['category'] === area;
      const notCompleted = !challengeState.completedChallenges.includes(Number(c['id']));
      
      if (!import.meta.env.PROD && matchesCategory && !notCompleted) {
        console.log('Challenge filtered out - completed:', c);
      }
      
      return matchesCategory && notCompleted;
    });
    
    if (!import.meta.env.PROD) {
      console.log(`Challenges found for ${area}:`, filtered.length);
      if (filtered.length > 0) {
        console.log('Sample available challenge:', filtered[0]);
      }
    }
    
    if (filtered.length === 0) {
      // If no challenges found for the selected area, try fallback areas
      // But prioritize areas that are more similar to the user's growth area
      const fallbackAreas = ['Confidence', 'Self-Worth', 'Mindfulness', 'Communication', 'Discipline', 'Resilience'];
      
      // Remove the primary area from fallback list
      const availableFallbacks = fallbackAreas.filter(fallbackArea => fallbackArea !== area);
      
      if (!import.meta.env.PROD) {
        console.log(`No challenges found for ${area}, trying fallbacks:`, availableFallbacks);
      }
      
      for (const fallbackArea of availableFallbacks) {
        const fallbackFiltered = challengeState.allChallenges.filter(c => 
          c['category'] === fallbackArea && !challengeState.completedChallenges.includes(Number(c['id']))
        );
        
        if (!import.meta.env.PROD) {
          console.log(`Fallback challenges found for ${fallbackArea}:`, fallbackFiltered.length);
          if (fallbackFiltered.length > 0) {
            console.log('Sample fallback challenge:', fallbackFiltered[0]);
          }
        }
        
        if (fallbackFiltered.length > 0) {
          const chosen = fallbackFiltered[Math.floor(Math.random() * fallbackFiltered.length)];
          
          // Cache the new challenge with a note that it's a fallback
          if (chosen) {
            localStorage.setItem('currentChallenge', JSON.stringify(chosen));
            localStorage.setItem('challengeFallback', 'true');
          }
          
          if (!import.meta.env.PROD) {
            console.log(`Using fallback challenge from ${fallbackArea} because no ${area} challenges available`);
          }
          
          return chosen;
        }
      }
      
      if (!import.meta.env.PROD) {
        console.log('No challenges found in any area');
      }
      return null; // Only return null if all areas are exhausted
    }

    // Check if we have a cached challenge
    const cachedChallenge = localStorage.getItem('currentChallenge');
    if (cachedChallenge) {
      try {
        const parsed = JSON.parse(cachedChallenge);
        // Only use the cached challenge if it's from the same area and not completed
        if (parsed.category === area && !challengeState.completedChallenges.includes(Number(parsed.id))) {
          return parsed;
        }
      } catch (error) {
        // Clear invalid cache
        localStorage.removeItem('currentChallenge');
        localStorage.removeItem('challengeFallback');
      }
    }

    const chosen = filtered[Math.floor(Math.random() * filtered.length)];
    
    if (!import.meta.env.PROD) {
      console.log('Selected challenge:', chosen);
    }
    
    // Cache the new challenge
    if (chosen) {
      localStorage.setItem('currentChallenge', JSON.stringify(chosen));
      localStorage.removeItem('challengeFallback'); // Clear fallback flag
    }
    
    return chosen;
  }, [challengeState.allChallenges, challengeState.completedChallenges]);

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
    const growthArea = profile.assessment_results?.userSelection || profile.growth_area || 'Confidence';
    const all = await getChallengesForGrowthArea(supabase, growthArea);
    
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
      
      // Always clear cache if user has assessment results to ensure fresh challenges
      if (profile.assessment_results?.userSelection || profile.growth_area) {
        localStorage.removeItem('extraChallenge');
        localStorage.removeItem('extraChallengeDate');
        console.log('Cleared cache - user has assessment results, forcing fresh challenge');
        return; // Don't load cached challenge, let it generate fresh
      }
      
      // Only use cache if user doesn't have assessment results
      if (cachedExtra && cachedDate === today) {
        try {
          const parsed = JSON.parse(cachedExtra);
          setExtraChallengeState(prev => ({ ...prev, challenge: parsed }));
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

  // Helper to clear challenge cache (for testing)
  const clearChallengeCache = () => {
    localStorage.removeItem('currentChallenge');
    localStorage.removeItem('challengeFallback');
    localStorage.removeItem('extraChallenge');
    localStorage.removeItem('extraChallengeDate');
    console.log('Challenge cache cleared');
    // Force a page reload to get fresh data
    window.location.reload();
  };

  // Temporary debug function to show current state
  const debugCurrentState = () => {
    console.log('=== DEBUG CURRENT STATE ===');
    console.log('User:', user);
    console.log('Profile:', profile);
    console.log('User Growth Area:', profile?.assessment_results?.userSelection || profile?.growth_area);
    console.log('Extra Challenge State:', extraChallengeState);
    console.log('Cached Challenge:', localStorage.getItem('extraChallenge'));
    console.log('Cached Date:', localStorage.getItem('extraChallengeDate'));
    console.log('==========================');
  };

  // Photo upload logic for extra challenge
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaState(prev => ({ ...prev, photoPreview: event.target.result }));
        setMediaState(prev => ({ ...prev, photoFile: file }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleRemovePhoto = () => {
    setMediaState(prev => ({ ...prev, photoPreview: null }));
    setMediaState(prev => ({ ...prev, photoFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitExtraReflection = async () => {
    if (!extraChallengeState.reflection.trim()) {
      toast({ title: "Reflection Required", description: "Please share your thoughts to complete the extra challenge!", variant: "destructive" });
      return;
    }
    setExtraChallengeState(prev => ({ ...prev, isSubmitting: true }));
    try {
      let postPhotoUrl = null;
      // If photo is uploaded, upload to Supabase Storage (optional, else keep as null)
      if (mediaState.photoPreview && mediaState.photoFile) {
        const fileExt = mediaState.photoFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('photos').upload(fileName, mediaState.photoFile, { upsert: true });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(fileName);
          postPhotoUrl = publicUrlData.publicUrl;
        } else {
          if (!import.meta.env.PROD) console.error('Photo upload error:', uploadError);
        }
      }
      // Insert into completed_challenges (always)
      await supabase.from('public.completed_challenges').insert({
        user_id: user.id,
        challenge_id: extraChallengeState.challenge.id,
        challenge_title: extraChallengeState.challenge.title,
        challenge_description: extraChallengeState.challenge.description,
        completed_at: new Date().toISOString(),
        reflection: extraChallengeState.reflection,
        photo_url: postPhotoUrl,
        category: extraChallengeState.challenge.category,
        xp_earned: 5,
        is_extra_challenge: true
      });
      // Insert into posts if public
      if (mediaState.privacy === 'public' || mediaState.privacy === 'friends') {
        const postData = {
          user_id: user.id,
          challenge_id: extraChallengeState.challenge.id,
          reflection: extraChallengeState.reflection,
          photo_url: postPhotoUrl,
          category: extraChallengeState.challenge.category,
          created_at: new Date().toISOString(),
          challenge_title: extraChallengeState.challenge.title,
          visibility: mediaState.privacy,
        };
        const { error: postError } = await supabase.from('posts').insert(postData);
        if (postError) {
          if (!import.meta.env.PROD) console.error('Error inserting extra challenge post:', postError);
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
      
      setModalState(prev => ({ ...prev, showExtra: false }));
      setExtraChallengeState(prev => ({ ...prev, challenge: null }));
      setExtraChallengeState(prev => ({ ...prev, reflection: '' }));
      setMediaState(prev => ({ ...prev, photoPreview: null }));
      setMediaState(prev => ({ ...prev, photoFile: null }));
      setTimeout(() => navigate('/challenge'), 1500);
    } catch (error) {
      toast({ title: "Error Saving Progress", description: error.message || "Something went wrong. Please try again.", variant: "destructive" });
      setExtraChallengeState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Helper to check if user has completed a challenge today
  const generateNewChallenge = useCallback(async (isRetake = false) => {
    if (!profile) return;
    const primaryArea = profile.assessment_results?.userSelection || profile.growth_area || 'Confidence';
    
    console.log('=== CHALLENGE GENERATION DEBUG ===');
    console.log('Profile assessment results:', profile.assessment_results);
    console.log('User selection:', profile.assessment_results?.userSelection);
    console.log('Primary area being used:', primaryArea);
    console.log('Profile data:', profile);
    
    const newChallengeData = getRandomChallenge(primaryArea);
    if (!newChallengeData) {
      setChallengeState(prev => ({ ...prev, noMoreChallenges: true }));
      setChallengeState(prev => ({ ...prev, current: null }));
      return;
    }
    setChallengeState(prev => ({ ...prev, noMoreChallenges: false }));
    
    const challengeObject = {
      title: newChallengeData['title'],
      description: newChallengeData['description'],
      category: newChallengeData['category'],
      id: Number(newChallengeData['id']),
    };
    
    setChallengeState(prev => ({ ...prev, current: challengeObject }));
    
    // Cache the current challenge so it persists across navigation
    localStorage.setItem('currentChallenge', JSON.stringify(challengeObject));
  }, [profile, challengeState.allChallenges, challengeState.completedChallenges, getRandomChallenge]);

  // Handle email confirmation and profile creation
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile) {
          // Create profile for confirmed user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || 'User',
              has_completed_assessment: false
            });
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
          } else {
            // Refresh data after creating profile
            await refreshAllData();
          }
        }
      }
    };

    handleEmailConfirmation();
  }, []);

  useEffect(() => {
    if (loading || challengeState.allChallenges.length === 0) return;
    
    // Only redirect to assessment if profile is loaded AND assessment is explicitly not completed
    // Don't redirect if profile is still loading (undefined) or if assessment is completed
    if (profile && profile.has_completed_assessment === false) {
      navigate('/assessment', { replace: true });
      return;
    }
    
    // Only proceed if we have profile data and assessment is completed
    if (!profile || profile.has_completed_assessment !== true) return;
    
    // Force clear cache and regenerate challenge if growth area has been updated
    const userSelectedArea = profile.assessment_results?.userSelection || profile.growth_area;
    const cachedChallenge = localStorage.getItem('currentChallenge');
    
    // Always clear cache and regenerate if we have a growth area but no cached challenge
    if (userSelectedArea && !cachedChallenge) {
      console.log('=== FORCE REGENERATION - NO CACHE ===');
      console.log('User selected area:', userSelectedArea);
      console.log('No cached challenge found - forcing regeneration');
      
      // Force immediate challenge regeneration
      const forceRegenerateChallenge = async () => {
        console.log('=== FORCE REGENERATING CHALLENGE ===');
        console.log('User selected area:', userSelectedArea);
        
        // Import the challenge generation logic directly
        const { fetchChallengesFromCSV } = await import('@/lib/utils');
        
        try {
          // Fetch all challenges from CSV
          const allChallenges = await fetchChallengesFromCSV();
          
          console.log('=== CHALLENGE DEBUG ===');
          console.log('Total challenges loaded:', allChallenges.length);
          console.log('Sample challenge:', allChallenges[0]);
          console.log('Available categories:', [...new Set(allChallenges.map(c => c.category))]);
          console.log('User selected area:', userSelectedArea);
          
          // Filter challenges for the user's selected growth area
          const filteredChallenges = allChallenges.filter(c => c.category === userSelectedArea);
          
          console.log(`Found ${filteredChallenges.length} challenges for ${userSelectedArea}`);
          
          if (filteredChallenges.length > 0) {
            // Select a random challenge from the user's selected growth area
            const randomChallenge = filteredChallenges[Math.floor(Math.random() * filteredChallenges.length)];
            
            console.log('Generated new challenge:', randomChallenge);
            
            // Update the challenge state directly
            setChallengeState(prev => ({ 
              ...prev, 
              current: {
                title: randomChallenge.title,
                description: randomChallenge.description,
                category: randomChallenge.category,
                id: Number(randomChallenge.id),
              }
            }));
            
            // Cache the new challenge
            localStorage.setItem('currentChallenge', JSON.stringify(randomChallenge));
            localStorage.removeItem('challengeFallback');
            
            console.log('✅ Challenge successfully regenerated for:', userSelectedArea);
          } else {
            console.log(`❌ No challenges found for ${userSelectedArea}`);
          }
        } catch (error) {
          console.error('Error regenerating challenge:', error);
        }
      };
      
      // Execute immediately
      forceRegenerateChallenge();
      return;
    }
    console.log('=== CACHE DEBUG ===');
    console.log('Cached challenge raw:', cachedChallenge);
    
    if (cachedChallenge) {
      try {
        const parsed = JSON.parse(cachedChallenge);
        const userSelectedArea = profile.assessment_results?.userSelection || profile.growth_area;
        
        console.log('=== GROWTH AREA CHANGE CHECK ===');
        console.log('Parsed cached challenge:', parsed);
        console.log('Cached challenge category:', parsed.category);
        console.log('User selected area:', userSelectedArea);
        console.log('Areas match:', parsed.category === userSelectedArea);
        console.log('Current challenge state:', challengeState.current);
        
        // If the cached challenge matches the user's selected growth area, restore it
        if (parsed.category === userSelectedArea) {
          console.log('✅ Restoring cached challenge for:', userSelectedArea);
          setChallengeState(prev => ({ 
            ...prev, 
            current: {
              title: parsed.title,
              description: parsed.description,
              category: parsed.category,
              id: Number(parsed.id),
            }
          }));
          return; // Exit early since we've restored the challenge
        }
        
        // If the cached challenge doesn't match the user's selected growth area, clear the cache
        if (parsed.category !== userSelectedArea) {
          console.log('Growth area mismatch detected - clearing challenge cache');
          localStorage.removeItem('currentChallenge');
          localStorage.removeItem('challengeFallback');
          setChallengeState(prev => ({ ...prev, current: null }));
          
          // Force immediate challenge regeneration
          console.log('Forcing immediate challenge regeneration for:', userSelectedArea);
          
          // Use a more direct approach to ensure challenge regeneration
          const forceRegenerateChallenge = async () => {
            console.log('=== FORCE REGENERATING CHALLENGE ===');
            console.log('User selected area:', userSelectedArea);
            
            // Import the challenge generation logic directly
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
                
                // Update the challenge state directly
                setChallengeState(prev => ({ 
                  ...prev, 
                  current: {
                    title: randomChallenge.title,
                    description: randomChallenge.description,
                    category: randomChallenge.category,
                    id: Number(randomChallenge.id),
                  }
                }));
                
                // Cache the new challenge
                localStorage.setItem('currentChallenge', JSON.stringify(randomChallenge));
                localStorage.removeItem('challengeFallback');
                
                console.log('✅ Challenge successfully regenerated for:', userSelectedArea);
              } else {
                console.log(`❌ No challenges found for ${userSelectedArea}`);
              }
            } catch (error) {
              console.error('Error regenerating challenge:', error);
            }
          };
          
          // Execute immediately
          forceRegenerateChallenge();
        }
      } catch (error) {
        console.error('Error parsing cached challenge:', error);
        localStorage.removeItem('currentChallenge');
        localStorage.removeItem('challengeFallback');
      }
    }
    
    setChallengeState(prev => ({ ...prev, isFirstTime: !progress?.current_challenge_id && progress?.xp === 0 }));
    
    // If there's an active challenge, load it from allChallenges
    if (progress?.current_challenge_id) {
      const found = challengeState.allChallenges.find(c => Number(c['id']) === progress.current_challenge_id);
      if (found) {
        setChallengeState(prev => ({ ...prev, current: {
          title: found['title'],
          description: found['description'],
          category: found['category'],
          id: Number(found['id']),
        } }));
      }
    }
    // Only generate a new challenge if:
    // 1. There's no active challenge AND
    // 2. User hasn't completed today's challenge AND
    // 3. There's no cached challenge from previous session
    else if (!hasCompletedToday) {
      
      // First, try to load from cache
      const cachedChallenge = localStorage.getItem('currentChallenge');
      if (cachedChallenge) {
        try {
          const parsed = JSON.parse(cachedChallenge);
          
          setChallengeState(prev => ({ ...prev, current: {
            title: parsed.title,
            description: parsed.description,
            category: parsed.category,
            id: Number(parsed.id),
          } }));
          return;
        } catch (error) {
          localStorage.removeItem('currentChallenge');
        }
      }
      
      // Generate new challenge if we have challenges loaded
      if (challengeState.allChallenges.length > 0) {
        generateNewChallenge();
      } else {
        // If challenges aren't loaded yet, wait for them and then generate
        console.log('Challenges not loaded yet, waiting...');
        const checkChallenges = setInterval(() => {
          if (challengeState.allChallenges.length > 0) {
            console.log('Challenges loaded, generating challenge');
            clearInterval(checkChallenges);
            generateNewChallenge();
          }
        }, 100);
        
        // Clear interval after 5 seconds to prevent infinite loop
        setTimeout(() => clearInterval(checkChallenges), 5000);
      }
    }
  }, [loading, profile, progress?.current_challenge_id, navigate, generateNewChallenge, challengeState.allChallenges, challengeState.lastCompletedAt, hasCompletedToday]);
  
  const retakeAssessment = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ has_completed_assessment: false }).eq('id', user.id);
    await refreshAllData();
    navigate('/assessment', { replace: true });
  }

  // When user accepts a challenge, mark it as completed
  const handleAccept = async () => {
    if (challengeState.current && user) {
      // Don't remove from cache yet - keep it until challenge is completed
      const { error, data } = await supabase.from('user_progress').update({
        current_challenge_id: challengeState.current.id,
        challenge_assigned_at: new Date().toISOString()
      }).eq('user_id', user.id);
      await refreshProgress();
      // Pass the full challenge object to the detail screen
      navigate('/challenge-details', { state: { challenge: challengeState.current } });
      return;
    }
    navigate('/challenge-details');
  };

  const handleSkip = () => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    setModalState(prev => ({ ...prev, showSkip: true }));
  };

  // Only generate a new challenge on skip confirmation
  const handleConfirmSkipAndGetNew = async () => {
    setModalState(prev => ({ ...prev, showSkip: false }));
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
      setModalState(prev => ({ ...prev, showExtra: false }));
      setExtraChallengeState(prev => ({ ...prev, challenge: null }));
      setExtraChallengeState(prev => ({ ...prev, reflection: '' }));
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

  // Challenge Pack Card Components
  const renderChallengePackCard = () => {
    if (!challengePackState.hasActivePackData) {
      return (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="animate-pulse flex items-center justify-center">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (challengePackState.activePack && challengePackState.nextChallenge) {
      // Active pack card
      const pack = challengePackState.activePack;
      const gradient = getPackGradient(pack.title);
      
      return (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="overflow-hidden shadow-lg border-0">
            <CardHeader className={`bg-gradient-to-r ${gradient} text-white relative`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5" />
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      Challenge Pack
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mb-1">
                    Continue Your Pack
                  </CardTitle>
                  <p className="text-white/90 text-sm font-medium">
                    {pack.title}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {challengePackState.progress.completed}/{challengePackState.progress.total}
                  </div>
                  <div className="text-xs text-white/80">
                    Completed
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Next Challenge:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {challengePackState.nextChallenge.text}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{challengePackState.progress.percentage}%</span>
                  </div>
                  <Progress 
                    value={challengePackState.progress.percentage} 
                    className="h-2"
                  />
                </div>
                
                <Button 
                  onClick={() => handleOpenChallengeModal(
                    pack, 
                    challengePackState.nextChallenge, 
                    challengePackState.nextChallenge.index
                  )}
                  className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white`}
                  size="lg"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue Pack
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    } else {
      // Promotional card for users without active packs
      return (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium">
                      Try Challenge Packs to grow faster!
                    </p>
                    <p className="text-sm text-gray-600">
                      Structured challenges for focused growth
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/progress')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4 mr-1" />
                  View Packs
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-sun-beige p-4 pb-24">
      {/* Temporary Debug Buttons - Remove after testing */}
      {import.meta.env.DEV && (
        <div className="fixed top-20 right-4 z-50 bg-red-500 text-white p-2 rounded shadow-lg">
          <button 
            onClick={debugCurrentState}
            className="block w-full mb-2 px-3 py-1 bg-blue-600 rounded text-sm"
          >
            Debug State
          </button>
          <button 
            onClick={clearChallengeCache}
            className="block w-full px-3 py-1 bg-green-600 rounded text-sm"
          >
            Clear Cache & Reload
          </button>
        </div>
      )}
      
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
            {(profile.assessment_results?.userSelection || profile.growth_area)
              ? `Focusing on ${profile.assessment_results?.userSelection || profile.growth_area} development • ${quote.quote}`
              : 'Welcome to your personalized growth experience'
            }
          </motion.p>
        </div>

        {/* Main Challenge Section - Daily AI Challenge (Top Priority) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {challengeState.noMoreChallenges ? (
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
          ) : hasCompletedToday ? (
            <Card className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-4">
                Daily Challenge Complete! 🎉
              </h2>
              <p className="text-green-600 mb-6">
                Great work! You've completed today's challenge. Want to keep growing?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={async () => {
                    setChallengeState(prev => ({ ...prev, isLoadingNewChallenge: true }));
                    
                    try {
                      // Clear any cached challenge first
                      localStorage.removeItem('currentChallenge');
                      setChallengeState(prev => ({ ...prev, current: null }));
                      
                      // Generate a new challenge using the same logic as generateNewChallenge
                      const primaryArea = profile.assessment_results?.userSelection || profile.growth_area || 'Confidence';
                      console.log('Getting new challenge for primary area:', primaryArea);
                      
                      const newChallengeData = getRandomChallenge(primaryArea);
                      console.log('Primary area challenge result:', newChallengeData);
                      
                      if (newChallengeData) {
                        const newChallenge = {
                          title: newChallengeData['title'],
                          description: newChallengeData['description'],
                          category: newChallengeData['category'],
                          id: Number(newChallengeData['id']),
                        };
                        
                        console.log('Created new challenge object:', newChallenge);
                        
                        // Cache the new challenge
                        localStorage.setItem('currentChallenge', JSON.stringify(newChallenge));
                        setChallengeState(prev => ({ ...prev, current: newChallenge }));
                        setChallengeState(prev => ({ ...prev, noMoreChallenges: false }));
                        
                        toast({
                          title: "New Challenge Ready! 🚀",
                          description: `Here's a ${newChallenge.category} challenge to continue your growth!`,
                        });
                        
                        console.log('Navigating to challenge details with:', newChallenge);
                        // Navigate to challenge details page immediately
                        try {
                          navigate('/challenge-details', { 
                            state: { challenge: newChallenge } 
                          });
                          console.log('Navigation call completed successfully');
                        } catch (navError) {
                          console.error('Navigation error:', navError);
                          // Fallback: try navigating without state
                          try {
                            navigate('/challenge-details');
                            console.log('Fallback navigation completed');
                          } catch (fallbackError) {
                            console.error('Fallback navigation also failed:', fallbackError);
                          }
                        }
                      } else {
                        console.log('No challenge found in primary area, trying fallbacks...');
                        // If no challenges available in primary area, try other areas
                        const fallbackAreas = ['Confidence', 'Self-Worth', 'Mindfulness', 'Communication', 'Discipline', 'Resilience'];
                        let foundChallenge = false;
                        
                        for (const area of fallbackAreas) {
                          if (area === primaryArea) {
                            console.log('Skipping primary area:', area);
                            continue; // Skip primary area since we already tried it
                          }
                          
                          console.log('Trying fallback area:', area);
                          const fallbackChallenge = getRandomChallenge(area);
                          console.log('Fallback challenge result:', fallbackChallenge);
                          
                          if (fallbackChallenge) {
                            const newChallenge = {
                              title: fallbackChallenge['title'], 
                              description: fallbackChallenge['description'],
                              category: fallbackChallenge['category'],
                              id: Number(fallbackChallenge['id']),
                            };
                            
                            console.log('Created fallback challenge object:', newChallenge);
                            
                            localStorage.setItem('currentChallenge', JSON.stringify(newChallenge));
                            setChallengeState(prev => ({ ...prev, current: newChallenge }));
                            setChallengeState(prev => ({ ...prev, noMoreChallenges: false }));
                            foundChallenge = true;
                            
                            toast({
                              title: "New Challenge Ready! 🚀",
                              description: `Here's a ${newChallenge.category} challenge (from a different area)!`,
                            });
                            
                            console.log('Navigating to challenge details with fallback:', newChallenge);
                            // Navigate to challenge details page immediately
                            try {
                              navigate('/challenge-details', { 
                                state: { challenge: newChallenge } 
                              });
                              console.log('Fallback navigation call completed successfully');
                            } catch (navError) {
                              console.error('Fallback navigation error:', navError);
                              // Fallback: try navigating without state
                              try {
                                navigate('/challenge-details');
                                console.log('Fallback navigation without state completed');
                              } catch (fallbackError) {
                                console.error('Fallback navigation without state also failed:', fallbackError);
                              }
                            }
                            break;
                          }
                        }
                        
                        if (!foundChallenge) {
                          console.log('No challenges found in any area');
                          // If still no challenges found, show a helpful message
                          toast({
                            title: "Amazing Progress! 🌟",
                            description: "You've completed many challenges! Try retaking the survey to explore new areas.",
                            variant: "default",
                          });
                          
                          // Optionally, navigate to assessment page
                          setTimeout(() => {
                            navigate('/assessment');
                          }, 2000);
                        }
                      }
                    } catch (error) {
                      console.error('Error in Get Another Challenge:', error);
                      if (!import.meta.env.PROD) console.error('Error generating new challenge:', error);
                      toast({
                        title: "Error",
                        description: "Failed to generate new challenge. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setChallengeState(prev => ({ ...prev, isLoadingNewChallenge: false }));
                      console.log('Loading state reset to false');
                      
                      // Also reset loading state after a timeout as a safety measure
                      setTimeout(() => {
                        setChallengeState(prev => ({ ...prev, isLoadingNewChallenge: false }));
                        console.log('Safety timeout: Loading state reset to false');
                      }, 5000);
                    }
                  }}
                  disabled={challengeState.isLoadingNewChallenge}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {challengeState.isLoadingNewChallenge ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading Challenge...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Get Another Challenge
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/progress')}
                  size="lg"
                >
                  <BarChart className="w-4 h-4 mr-2" />
                  View Progress
                </Button>
              </div>
            </Card>
          ) : (
            challengeState.current && (
              <Card className="overflow-hidden shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-forest-green to-leaf-green text-white relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <CardTitle className="text-2xl font-bold mb-2 text-center">
                      Today's AI Challenge
                    </CardTitle>
                    <CardDescription className="text-sun-beige/90 text-center text-lg">
                      {challengeState.current.category} • Personalized for your growth
                      {localStorage.getItem('challengeFallback') === 'true' && (
                        <span className="block text-sm text-sun-beige/70 mt-1">
                          (Alternative challenge - no {profile.assessment_results?.userSelection || profile.growth_area} challenges available)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8 bg-white">
                  <h3 className="text-xl font-semibold text-charcoal-gray mb-4 leading-relaxed">
                    {challengeState.current.title}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={() => {
                        if (progress?.current_challenge_id) {
                          // Already accepted, go to complete
                          navigate('/challenge-details', { state: { challenge: challengeState.current } });
                        } else {
                          // Not accepted yet, accept first
                          handleAccept();
                        }
                      }}
                      className="flex-1 bg-forest-green hover:bg-forest-green/90 text-white font-semibold py-3 text-lg"
                      size="lg"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      {progress?.current_challenge_id ? 'Complete Challenge' : 'Accept Challenge'}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="lg" className="border-forest-green text-forest-green hover:bg-forest-green/5">
                          <SkipForward className="w-4 h-4 mr-2" />
                          Skip
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Skip Today's Challenge?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to skip this challenge? You can always come back to it later, but consistent daily practice helps build lasting habits.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Challenge</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => setModalState(prev => ({ ...prev, showSkip: true }))}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            Skip Challenge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </motion.div>

        {/* Challenge Pack Section - Below Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-charcoal-gray flex items-center gap-2">
              <Package className="w-5 h-5 text-forest-green" />
              Your Challenge Pack
            </h2>
            <p className="text-sm text-charcoal-gray/70">
              Complete structured challenge series for focused growth
            </p>
          </div>
          
          {renderChallengePackCard()}
        </motion.div>

        {/* Retake Growth Survey */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Target className="w-5 h-5" />
                Retake Growth Area Survey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-blue-600 mb-2">
                    Currently focusing on: <strong>{profile?.assessment_results?.userSelection || profile?.growth_area || 'Not selected'}</strong>
                  </p>
                  <p className="text-xs text-blue-500">
                    Want to change your growth focus? Retake the assessment to discover new areas for development.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate('/assessment')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retake Survey
                  </Button>
                  {!import.meta.env.PROD && (
                    <Button 
                      onClick={() => {
                        localStorage.removeItem('allChallenges');
                        localStorage.removeItem('currentChallenge');
                        localStorage.removeItem('challengeFallback');
                        loadChallenges();
                        toast({
                          title: "Cache Cleared",
                          description: "Challenges reloaded. Check console for debug info.",
                        });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      🔄 Debug
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Personalized Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PersonalizedSuggestion 
            onSuggestionUsed={(suggestion) => {
              // Could navigate to a challenge or create a custom challenge
              // Suggestion successfully used
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
          transition={{ delay: 0.6 }}
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
            <div className="flex items-center justify-center mb-2">
              <Snowflake className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {progress?.tokens || 0}
            </div>
            <div className="text-sm text-gray-600">Freeze Tokens</div>
          </Card>
        </motion.div>



        {/* Extra Challenge Section */}
        {modalState.showExtra && extraChallengeState.challenge && (
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
                  {extraChallengeState.challenge.title}
                </h3>
                <p className="text-orange-700 mb-4">
                  {extraChallengeState.challenge.description}
                </p>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Share your experience with this bonus challenge..."
                    value={extraChallengeState.reflection}
                    onChange={(e) => setExtraChallengeState(prev => ({ ...prev, reflection: e.target.value }))}
                    className="bg-white"
                  />
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-orange-700">
                      <input
                        type="radio"
                        name="extraPrivacy"
                        value="public"
                        checked={mediaState.privacy === 'public'}
                        onChange={(e) => setMediaState(prev => ({ ...prev, privacy: e.target.value }))}
                      />
                      Share publicly
                    </label>
                    <label className="flex items-center gap-2 text-sm text-orange-700">
                      <input
                        type="radio"
                        name="extraPrivacy"
                        value="private"
                        checked={mediaState.privacy === 'private'}
                        onChange={(e) => setMediaState(prev => ({ ...prev, privacy: e.target.value }))}
                      />
                      Keep private
                    </label>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSubmitExtraReflection}
                      disabled={!extraChallengeState.reflection.trim() || extraChallengeState.isSubmitting}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {extraChallengeState.isSubmitting ? 'Submitting...' : 'Complete Bonus (+5 XP)'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setModalState(prev => ({ ...prev, showExtra: false }))}
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
          transition={{ delay: 0.7 }}
        >
          <Leaderboard 
            title="Top Performers This Week"
            maxUsers={10}
            showPagination={false}
            showUserRank={true}
            defaultRankBy="xp"
            useTopPerformersFunction={true}
          />
        </motion.div>

        {/* Quick Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
      <Dialog open={modalState.showSkip} onOpenChange={setModalState}>
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
            <Button onClick={() => setModalState(prev => ({ ...prev, showSkip: false }))} variant="outline" className="border-forest-green text-forest-green hover:bg-forest-green/10 hover:text-forest-green">
              <Smile className="w-4 h-4 mr-2" /> Okay, let’s grow
            </Button>
            <Button onClick={handleConfirmSkipAndGetNew} className="bg-forest-green text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Give me another
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Challenge Modal */}
      <IndividualChallengeModal
        isOpen={challengeModalState.isOpen}
        onClose={handleCloseChallengeModal}
        pack={challengePackState.activePack}
        challenge={challengeModalState.currentChallenge}
        challengeIndex={challengeModalState.challengeIndex}
        onComplete={handleCompleteChallengeInModal}
        isCompleting={challengeModalState.isCompleting}
      />

      {/* Pack Completion Modal */}
      <PackCompletionModal
        isOpen={completionModal.isOpen}
        onClose={() => setCompletionModal({ isOpen: false, isCompleting: false })}
        pack={challengePackState.activePack}
        onComplete={async (completionData) => {
          setCompletionModal(prev => ({ ...prev, isCompleting: true }));
          try {
            const { data, error } = await supabase.rpc('complete_pack_challenge', {
              p_user_id: user.id,
              p_pack_id: parseInt(challengePackState.activePack.id), // Convert to BIGINT for challenge_packs.id
              p_final_reflection: completionData.reflection.trim(),
              p_image_url: completionData.imageUrl || null,
              p_visibility: completionData.visibility || 'public'
            });

            if (error) throw error;

            setCompletionModal({ isOpen: false, isCompleting: false });
            
            // Show completion success with tokens
            const tokenMessage = data.tokens_awarded ? ` and ${data.tokens_awarded} Streak Freeze Token${data.tokens_awarded > 1 ? 's' : ''}` : '';
            toast({
              title: "🎉 Pack Completed!",
              description: `Congratulations! You earned ${data.xp_awarded} XP${tokenMessage}${data.community_post_created ? ' and shared with the community' : ''}.`,
              duration: 5000,
            });

            // Trigger data refresh to update XP, level, and tokens
            refreshAllData();

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
        }}
        isCompleting={completionModal.isCompleting}
      />
    </div>
  );
  };
  
export default ChallengePage;