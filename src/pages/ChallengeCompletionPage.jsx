import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Flame, Trophy, Gift, Sparkles, Crown, Target, CheckCircle, Camera, X, Upload, Globe, Users, Lock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { getLevelInfo, calculateXPForNextLevel, calculateLevelFromXP } from '@/lib/levelSystem';
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

const ChallengeCompletionPage = () => {
  const { challengeId, packId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, progress, refreshAllData, triggerChallengeCompletionRefresh } = useData();
  const { toast } = useToast();
  const navigateTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // State management
  const [challenge, setChallenge] = useState(null);
  const [packProgress, setPackProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [extraReflection, setExtraReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);
  const [showExtraChallenge, setShowExtraChallenge] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [privacy, setPrivacy] = useState('public');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Gamification modal states
  const [levelUpModal, setLevelUpModal] = useState({ open: false, newLevel: 0 });
  const [streakModal, setStreakModal] = useState({ open: false, streakCount: 0 });
  const [bonusModal, setBonusModal] = useState({ open: false, bonusType: '', bonusAmount: 0 });
  const [packCompletionModal, setPackCompletionModal] = useState({ open: false, packData: null });

  // Fetch challenge details
  const fetchChallengeDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get challenge from location state or fetch from database
      let challengeData = location.state?.challenge;
      
      if (!challengeData && challengeId) {
        // Fetch challenge from database if not in state
        const { data: challengeResult } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', challengeId)
          .single();
        
        challengeData = challengeResult;
      }

      if (challengeData) {
        setChallenge(challengeData);
        
        // Check if this is part of a pack
        if (packId) {
          const { data: packProgressData } = await supabase
            .from('user_pack_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('pack_id', packId)
            .single();
          
          setPackProgress(packProgressData);
        }
      }
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle completion
  const handleComplete = () => {
    setChallengeCompleted(true);
    // Show completion modals and handle rewards
    handleRewards();
  };

  // Handle rewards and modals
  const handleRewards = async () => {
    if (!user || !progress) return;

    const currentXP = progress.xp;
    const currentLevel = progress.level;
    const xpToNextLevel = calculateXPForNextLevel(currentLevel);
    
    // Check for level up
    if (currentXP >= xpToNextLevel) {
      setLevelUpModal({ open: true, newLevel: currentLevel + 1 });
    }

    // Check for streak milestone
    if (progress.streak > 0 && progress.streak % 7 === 0) {
      setStreakModal({ open: true, streakCount: progress.streak });
    }

    // Check for pack completion
    if (packProgress && packProgress.completed_challenges >= packProgress.total_challenges) {
      setPackCompletionModal({ open: true, packData: packProgress });
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploadingPhoto(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setPhotoFile(file);
      
    } catch (error) {
      console.error('Error processing photo:', error);
      toast({
        title: "Error",
        description: "Failed to process photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle remove photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload photo to Supabase storage
  const uploadPhotoToStorage = async (file) => {
    if (!file || !user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `challenge-photos/${fileName}`;

      // Try to upload to storage
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        // If storage is not set up, we'll skip photo upload but continue with challenge completion
        toast({
          title: "Photo Upload Skipped",
          description: "Photo storage not configured. Challenge will be completed without photo.",
          variant: "default"
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      // Don't throw error, just return null to continue without photo
      toast({
        title: "Photo Upload Failed",
        description: "Could not upload photo. Challenge will be completed without photo.",
        variant: "default"
      });
      return null;
    }
  };

  // Get progress info
  const getProgress = () => {
    return progress || { xp: 0, level: 1, xp_to_next_level: 100 };
  };

  // Set progress info
  const setProgress = ({ xp, level, badges }) => {
    // Progress update logic here
    console.log('Progress update:', { xp, level, badges });
  };

  // XP calculation
  const XP_TO_LEVEL = (level) => {
    return calculateXPForNextLevel(level);
  };

  // Handle reflection submission
  const handleSubmitReflection = async () => {
    if (!reflection.trim() || !user || !challenge) return;

    try {
      setIsSubmitting(true);

      // Upload photo if selected
      let photoUrl = null;
      if (photoFile) {
        try {
          photoUrl = await uploadPhotoToStorage(photoFile);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: "Photo Upload Failed",
            description: "Failed to upload photo, but challenge will still be completed.",
            variant: "destructive"
          });
        }
      }

      // Insert completion record
      const { error: completionError } = await supabase
        .from('completed_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          reflection: reflection.trim(),
          photo_url: photoUrl,
          category: challenge.category,
          completed_at: new Date().toISOString()
        });

      if (completionError) throw completionError;

      // Save to posts table
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          reflection: reflection.trim(),
          photo_url: photoUrl,
          category: challenge.category,
          created_at: new Date().toISOString(),
          privacy: privacy,
          flagged: false,
          post_type: 'challenge_completion',
          metadata: JSON.stringify({
            challenge_id: challenge.id,
            completion_type: 'daily_challenge'
          }),
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          views_count: 0
        });

      if (postError) {
        console.error('Error saving to posts table:', postError);
        // Don't throw error here as challenge completion is more important
      }

      // Update user progress
      const currentProgress = getProgress();
      const xpGained = challenge.xp_reward || 10;
      const newXp = currentProgress.xp + xpGained;
      const newLevel = calculateLevelFromXP(newXp);
      const xpToNextLevel = calculateXPForNextLevel(currentProgress.level);

      // Get current challenge count and increment it
      const { data: challengeCountData, error: countError } = await supabase
        .from('completed_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error getting challenge count:', countError);
      }

      const newChallengeCount = (challengeCountData?.length || 0) + 1;

      // Check for level up
      if (newXp >= xpToNextLevel) {
        const { error: levelUpError } = await supabase
          .from('user_progress')
          .update({
            xp: newXp,
            level: newLevel,
            streak: currentProgress.streak + 1,
            current_challenge_id: null,
            total_challenges_completed: newChallengeCount
          })
          .eq('user_id', user.id);

        if (levelUpError) throw levelUpError;
      } else {
        const { error: progressError } = await supabase
          .from('user_progress')
          .update({
            xp: newXp,
            streak: currentProgress.streak + 1,
            current_challenge_id: null,
            total_challenges_completed: newChallengeCount
          })
          .eq('user_id', user.id);

        if (progressError) throw progressError;
      }

      // Update pack progress if applicable
      if (packId && packProgress) {
        const { error: packError } = await supabase
          .from('user_pack_progress')
          .update({
            completed_challenges: packProgress.completed_challenges + 1
          })
          .eq('user_id', user.id)
          .eq('pack_id', packId);

        if (packError) throw packError;
      }

      // Refresh data
      await refreshAllData();
      await triggerChallengeCompletionRefresh({
        xp_gained: xpGained,
        new_level: newLevel,
        new_streak: currentProgress.streak + 1,
        tokens_earned: 0,
        level_up: newXp >= xpToNextLevel,
        streak_increased: true
      });

      // Show success message
      toast({
        title: "Challenge Completed! 🎉",
        description: `You earned ${xpGained} XP and maintained your streak!`,
      });

      // Handle completion
      handleComplete();

    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle extra reflection submission
  const handleSubmitExtraReflection = async () => {
    if (!extraReflection.trim() || !user || !challenge) return;

    try {
      setIsSubmittingExtra(true);

      // Upload photo if selected (for extra challenge)
      let photoUrl = null;
      if (photoFile) {
        try {
          photoUrl = await uploadPhotoToStorage(photoFile);
        } catch (error) {
          console.error('Error uploading photo for extra challenge:', error);
          // Continue without photo
        }
      }

      // Insert extra completion record
      const { error } = await supabase
        .from('completed_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          reflection: extraReflection.trim(),
          photo_url: photoUrl,
          category: challenge.category,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Save extra challenge to posts table
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          reflection: extraReflection.trim(),
          photo_url: photoUrl,
          category: challenge.category,
          created_at: new Date().toISOString(),
          privacy: privacy,
          flagged: false,
          post_type: 'extra_challenge',
          metadata: JSON.stringify({
            challenge_id: challenge.id,
            completion_type: 'extra_challenge'
          }),
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          views_count: 0
        });

      if (postError) {
        console.error('Error saving extra challenge to posts table:', postError);
      }

      // Update user progress with bonus XP
      const currentProgress = getProgress();
      const bonusXp = 5; // Extra challenge bonus
      const newXp = currentProgress.xp + bonusXp;

      const { error: progressError } = await supabase
        .from('user_progress')
        .update({ xp: newXp })
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Refresh data
      await refreshAllData();

      // Show success message
      toast({
        title: "Bonus Challenge Completed! 🎁",
        description: `You earned ${bonusXp} bonus XP!`,
      });

      setShowExtraChallenge(false);
      setExtraReflection('');

    } catch (error) {
      console.error('Error completing extra challenge:', error);
      toast({
        title: "Error",
        description: "Failed to complete bonus challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingExtra(false);
    }
  };

  // Get random extra challenge
  const getRandomExtraChallenge = async () => {
    // Extra challenge logic here if needed
    console.log('Get random extra challenge');
  };

  // Handle modal closes
  const handleLevelUpClose = () => {
    setLevelUpModal({ open: false, newLevel: 0 });
    // Navigate back to challenge page after a delay
    navigateTimeoutRef.current = setTimeout(() => {
      navigate('/challenge');
    }, 2000);
  };

  const handleStreakClose = () => {
    setStreakModal({ open: false, streakCount: 0 });
  };

  const handleBonusClose = () => {
    setBonusModal({ open: false, bonusType: '', bonusAmount: 0 });
  };

  const handlePackCompletionClose = () => {
    setPackCompletionModal({ open: false, packData: null });
    // Navigate back to challenge page
    navigate('/challenge');
  };

  // Load challenge details on mount
  useEffect(() => {
    fetchChallengeDetails();
  }, [user, challengeId, packId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto mb-4"></div>
          <p className="text-charcoal-gray">Loading challenge completion...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center">
          <Target className="w-16 h-16 text-forest-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-charcoal-gray mb-4">Challenge Not Found</h2>
          <p className="text-charcoal-gray/80 mb-6">The challenge you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/challenge')} className="bg-forest-green hover:bg-forest-green/90">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const currentProgress = getProgress();

  return (
    <div className="min-h-screen bg-sun-beige">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/challenge')}
              className="text-charcoal-gray hover:text-forest-green"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Level {currentProgress.level}</p>
                <Progress 
                  value={(currentProgress.xp / currentProgress.xp_to_next_level) * 100} 
                  className="w-24 h-2"
                />
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-forest-green text-white text-sm">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Challenge Completion Card */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-forest-green/10 rounded-full">
                <CheckCircle className="w-6 h-6 text-forest-green" />
              </div>
              <div>
                <CardTitle className="text-xl text-forest-green">
                  Complete Your Challenge
                </CardTitle>
                <CardDescription>
                  Share your reflection to complete this challenge and earn rewards
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Challenge Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {challenge.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {challenge.description}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="bg-forest-green/10 text-forest-green">
                  {challenge.xp_reward || 10} XP
                </Badge>
                {challenge.category && (
                  <Badge variant="outline">
                    {challenge.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Reflection Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Share your reflection *
              </label>
              <Textarea
                placeholder="How did this challenge impact you? What did you learn?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isSubmitting || challengeCompleted}
              />
              <p className="text-xs text-gray-500">
                {reflection.length}/500 characters
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Add a photo (optional)
              </label>
              
              {!photoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-forest-green transition-colors">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isSubmitting || challengeCompleted}
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {isUploadingPhoto ? 'Processing...' : 'Click to upload a photo'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Max 5MB • JPG, PNG, GIF
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={isSubmitting || challengeCompleted}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Privacy Settings
              </label>
              <Select
                value={privacy}
                onValueChange={setPrivacy}
                disabled={isSubmitting || challengeCompleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Public - Everyone can see this</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Friends - Only friends can see this</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Private - Only you can see this</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                This controls who can see your challenge completion in the community.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitReflection}
              disabled={!reflection.trim() || isSubmitting || challengeCompleted}
              className={`w-full py-3 text-white ${
                challengeCompleted 
                  ? 'bg-green-600 hover:bg-green-600' 
                  : 'bg-forest-green hover:bg-forest-green/90'
              }`}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Completing...
                </>
              ) : challengeCompleted ? (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Challenge Completed!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Challenge
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Extra Challenge Section */}
        <AnimatePresence>
          {showExtraChallenge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              <Card className="bg-gradient-to-r from-warm-orange/10 to-leaf-green/10 border-warm-orange/20">
                <CardHeader>
                  <CardTitle className="text-warm-orange flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Bonus Challenge Available!
                  </CardTitle>
                  <CardDescription>
                    Want to earn extra XP? Take on today's bonus challenge!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-charcoal-gray">
                    Share one specific way you'll apply what you learned from today's challenge.
                  </p>
                  <Textarea
                    placeholder="I will apply this learning by..."
                    value={extraReflection}
                    onChange={(e) => setExtraReflection(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isSubmittingExtra}
                  />
                  <Button
                    onClick={handleSubmitExtraReflection}
                    disabled={!extraReflection.trim() || isSubmittingExtra}
                    className="w-full bg-warm-orange hover:bg-warm-orange/90 text-white"
                  >
                    {isSubmittingExtra ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Complete Bonus Challenge (+5 XP)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gamification Modals */}
      <AnimatePresence>
        {levelUpModal.open && (
          <LevelUpModal
            open={levelUpModal.open}
            onOpenChange={handleLevelUpClose}
            newLevel={levelUpModal.newLevel}
          />
        )}
        
        {streakModal.open && (
          <StreakModal
            open={streakModal.open}
            onOpenChange={handleStreakClose}
            streakCount={streakModal.streakCount}
          />
        )}
        
        {bonusModal.open && (
          <BonusModal
            open={bonusModal.open}
            onOpenChange={handleBonusClose}
            bonusType={bonusModal.bonusType}
            bonusAmount={bonusModal.bonusAmount}
          />
        )}
        
        {packCompletionModal.open && (
          <PackCompletionModal
            open={packCompletionModal.open}
            onOpenChange={handlePackCompletionClose}
            packData={packCompletionModal.packData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengeCompletionPage;