import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Camera, Lock, Globe, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


const compressImage = (file, quality = 0.6, maxWidth = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type, quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const ChallengeDetailsPage = () => {
  const { user } = useAuth();
  const { progress, loading, refreshAllData, triggerLevelUp } = useData();
  const [challenge, setChallenge] = useState(null);
  const [reflection, setReflection] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('details');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [showTooSoonDialog, setShowTooSoonDialog] = useState(false);
  const [showExtraChallenge, setShowExtraChallenge] = useState(false);
  const [extraChallenge, setExtraChallenge] = useState(null);
  const [extraReflection, setExtraReflection] = useState('');
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);
  const navigateTimeoutRef = useRef(null);

  const fetchChallengeDetails = useCallback(async () => {
    // First, try to use the challenge passed via navigation state
    if (location.state?.challenge) {
      setChallenge(location.state.challenge);
      return;
    }
    
    // Fallback: try to fetch from challenges table by numeric id
    if (progress?.current_challenge_id) {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', progress.current_challenge_id)
        .single();
      if (error) {
        console.error('Error fetching challenge:', error);
        toast({ title: 'Error', description: 'Could not fetch challenge details.', variant: 'destructive' });
        navigate('/challenge');
      } else {
        setChallenge(data);
      }
    } else if (!loading) {
      navigate('/challenge');
    }
  }, [progress, loading, navigate, toast, location.state]);

  useEffect(() => {
    fetchChallengeDetails();
  }, [fetchChallengeDetails]);

  const handleComplete = () => {
    // Check if challenge was assigned less than 3 minutes ago
    if (progress?.challenge_assigned_at) {
      const assignedAt = new Date(progress.challenge_assigned_at);
      const now = new Date();
      const diffMs = now - assignedAt;
      if (diffMs < 3 * 60 * 1000) {
        setShowTooSoonDialog(true);
        return;
      }
    }
    setView('reflection');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file);
        setPhotoPreview(compressedDataUrl);
        setPhotoFile(file);
      } catch (error) {
        toast({
          title: "Error Uploading Photo",
          description: "There was an issue processing your photo. Please try another one.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // XP and Level logic
  const getProgress = () => {
    const xp = parseInt(localStorage.getItem('xp') || '0', 10);
    const level = parseInt(localStorage.getItem('level') || '1', 10);
    const badges = JSON.parse(localStorage.getItem('badges') || '[]');
    return { xp, level, badges };
  };

  const setProgress = ({ xp, level, badges }) => {
    localStorage.setItem('xp', xp);
    localStorage.setItem('level', level);
    localStorage.setItem('badges', JSON.stringify(badges));
  };

  const XP_PER_CHALLENGE = 10;
  const XP_TO_LEVEL = (level) => 50 + (level - 1) * 25;

  const handleSubmitReflection = async () => {
    if (!reflection.trim()) {
      toast({
        title: "Reflection Required",
        description: "Please share your thoughts to complete the challenge!",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Send to webhook and wait for response
      let aiResponse;
      try {
        const webhookResponse = await fetch("https://hook.eu2.make.com/ajcskoiwdq5de96vc2z6fi5jxti1wsva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            growth_area: challenge.category,
            user_reflection: reflection
          })
        });

        if (webhookResponse.ok) {
          aiResponse = await webhookResponse.json().catch(() => null);
          
          if (aiResponse?.newChallenge) {
            // Store the AI-generated challenge for later
            const { data: insertData, error: insertError } = await supabase
              .from('ai_challenges')
              .insert({
                user_id: user.id,
                growth_area: challenge.category,
                challenge_text: aiResponse.newChallenge,
                reflection_id: null, // Will be updated after reflection is saved
                status: 'pending'
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error saving AI challenge:', insertError);
            } else {
              toast({
                title: "🤖 New Challenge Generated!",
                description: "AI has created a personalized challenge based on your reflection.",
              });
            }
          }
        } else {
          console.error('Webhook error:', webhookResponse.statusText);
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Continue with the rest of the submission even if webhook fails
      }

      // 2. Mark challenge as completed
      let insertData;
      let insertError;
      
      // First, try to ensure the challenge exists in the challenges table
      try {
        await supabase.from('challenges').insert({
          id: challenge.id,
          category: challenge.category,
          title: challenge.title,
          description: challenge.description || challenge.title,
          challenge_id_text: challenge.id.toString()
        });
      } catch (challengeInsertError) {
        // Continue anyway - the challenge might already exist
      }
      
      // Now try to insert the completed challenge
      const insertResult = await supabase.from('completed_challenges').insert({
        user_id: user.id,
        challenge_id: challenge.id,
        completed_at: new Date().toISOString(),
        reflection,
        photo_url: null,
        category: challenge.category
      }).select().single();
      
      insertData = insertResult.data;
      insertError = insertResult.error;
      
      // If foreign key constraint fails, try without challenge_id
      if (insertError && insertError.code === '23503') {
        console.error('Foreign key constraint failed. The challenge needs to exist in the challenges table first.');
        throw new Error('Challenge not found in database. Please contact admin to upload challenges via the Admin interface, or visit /admin to upload the CSV file.');
      }

      if (insertError) {
        throw insertError;
      }

      // 3. If we have both the AI challenge and the completed challenge, link them
      if (aiResponse?.newChallenge) {
        await supabase
          .from('ai_challenges')
          .update({ reflection_id: insertData.id })
          .eq('user_id', user.id)
          .is('reflection_id', null)
          .order('created_at', { ascending: false })
          .limit(1);
      }

      // 4. Update XP, level, streak in user_progress
      let newXp = (progress?.xp || 0) + 10;
      let newLevel = progress?.level || 1;
      let leveledUp = false;
      const xpToLevel = 50 + (newLevel - 1) * 25;
      if (newXp >= xpToLevel) {
        newXp -= xpToLevel;
        newLevel += 1;
        leveledUp = true;
      }
      await supabase.from('user_progress').update({
        xp: newXp,
        level: newLevel,
        current_challenge_id: null, // Clear current challenge after completion
      }).eq('user_id', user.id);

      // Clear the cached challenge since it's now completed
      localStorage.removeItem('currentChallenge');

      // 5. Award badges if needed
      const { data: completed } = await supabase.from('completed_challenges').select('id').eq('user_id', user.id);
      const completedCount = completed ? completed.length : 0;
      const badgeInserts = [];
      if (completedCount === 1) badgeInserts.push({ user_id: user.id, badge_type: 'FIRST_CHALLENGE' });
      if (completedCount >= 5) badgeInserts.push({ user_id: user.id, badge_type: 'CHALLENGES_5' });
      if (completedCount >= 10) badgeInserts.push({ user_id: user.id, badge_type: 'CHALLENGES_10' });
      if (completedCount >= 25) badgeInserts.push({ user_id: user.id, badge_type: 'CHALLENGES_25' });
      if (completedCount >= 50) badgeInserts.push({ user_id: user.id, badge_type: 'CHALLENGES_50' });
      if (leveledUp) badgeInserts.push({ user_id: user.id, badge_type: `LEVEL_${newLevel}` });
      
      for (const badge of badgeInserts) {
        await supabase.from('user_badges').upsert(badge, { onConflict: ['user_id', 'badge_type'] });
      }

      await refreshAllData();
      
      // 6. Show success messages
      toast({
        title: "🌟 Challenge Completed!",
        description: `You earned 10 XP! Keep up the great work.`,
      });

      if (leveledUp) {
        setTimeout(() => toast({ 
          title: "🎉 Level Up!", 
          description: `You reached level ${newLevel}!` 
        }), 500);
      }

      if (badgeInserts.length > 0) {
        toast({ 
          title: "🏅 Badge Unlocked!", 
          description: `You've earned new badges! Check them out on your Progress page.` 
        });
      }

      // Show extra challenge option
      setShowExtraChallenge(true);
      // Set a timeout to navigate back to /challenge after 1.5s
      navigateTimeoutRef.current = setTimeout(() => navigate('/challenge'), 1500);

    } catch (error) {
      console.error('Error in handleSubmitReflection:', error);
      toast({ 
        title: "Error Saving Progress", 
        description: error.message || "Something went wrong. Please try again.", 
        variant: "destructive" 
      });
      setIsSubmitting(false);
    }
  };

  // Handle extra challenge reflection submission
  const handleSubmitExtraReflection = async () => {
    if (!extraReflection.trim()) {
      toast({ title: "Reflection Required", description: "Please share your thoughts to complete the extra challenge!", variant: "destructive" });
      return;
    }
    setIsSubmittingExtra(true);
    try {
      await supabase.from('completed_challenges').insert({
        user_id: user.id,
        challenge_id: extraChallenge.id,
        completed_at: new Date().toISOString(),
        reflection: extraReflection,
        photo_url: null,
        category: extraChallenge.category
      });
      // Add 5 XP only
      let newXp = (progress?.xp || 0) + 5;
      await supabase.from('user_progress').update({ xp: newXp }).eq('user_id', user.id);
      await refreshAllData();
      toast({ title: "🎁 Extra Challenge Completed!", description: `You earned 5 XP!` });
      setShowExtraChallenge(false);
      setExtraChallenge(null);
      setExtraReflection('');
      setTimeout(() => navigate('/challenge'), 1500);
    } catch (error) {
      toast({ title: "Error Saving Progress", description: error.message || "Something went wrong. Please try again.", variant: "destructive" });
      setIsSubmittingExtra(false);
    }
  };

  // Helper to get a random extra challenge from the same area, not already completed
  const getRandomExtraChallenge = async () => {
    // Fetch all completed challenge IDs
    const { data: completed } = await supabase
      .from('completed_challenges')
      .select('challenge_id')
      .eq('user_id', user.id);
    const completedIds = completed ? completed.map(row => Number(row.challenge_id)) : [];
    // Fetch all challenges from Supabase
    const { data: all } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', challenge.category);
    const available = all.filter(c => !completedIds.includes(Number(c.id)) && c.id !== challenge.id);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  if (loading || !challenge) {
    return <div className="min-h-screen flex items-center justify-center bg-sun-beige"><div className="text-charcoal-gray">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato">
      <div className="container mx-auto px-4 pt-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={() => navigate('/challenge')} variant="ghost" className="mb-6 text-charcoal-gray">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
        </motion.div>

        {/* Growth takes a moment dialog */}
        <Dialog open={showTooSoonDialog} onOpenChange={setShowTooSoonDialog}>
          <DialogContent className="bg-sun-beige border-forest-green/20 font-lato">
            <DialogHeader>
              <DialogTitle className="font-poppins text-2xl text-forest-green text-center">Growth takes a moment.</DialogTitle>
              <DialogDescription className="text-center text-charcoal-gray/80 pt-4">
                <p className="text-lg">It looks like you’re finishing this challenge quickly. Have you had a chance to really try it out?</p>
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button onClick={() => { setShowTooSoonDialog(false); setView('details'); }} variant="outline" className="border-forest-green text-forest-green hover:bg-forest-green/10 hover:text-forest-green">
                I’ll come back
              </Button>
              <Button onClick={() => { setShowTooSoonDialog(false); setView('reflection'); }} className="bg-forest-green text-white">
                I’ve done it
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {view === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="font-poppins text-3xl font-bold text-forest-green">Challenge Details</CardTitle>
                <CardDescription className="text-charcoal-gray/80 text-base pt-1">{challenge.title}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <p className="text-lg text-charcoal-gray leading-relaxed">{challenge.description}</p>
                <Button onClick={handleComplete} className="w-full bg-gradient-to-r from-warm-orange to-orange-400 text-white font-bold py-6 text-base rounded-xl min-h-[60px] touch-manipulation">
                  <CheckCircle className="w-5 h-5 mr-2" /> Complete Challenge
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {view === 'reflection' && !showExtraChallenge && (
          <motion.div key="reflection" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="font-poppins text-3xl font-bold text-forest-green">Reflect on Your Experience</CardTitle>
                <CardDescription className="text-charcoal-gray/80 text-base pt-1">
                  Completing the challenge is just the beginning. Reflection is where growth happens.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="How did this challenge make you feel? What did you learn about yourself?"
                  className="min-h-[150px] text-base rounded-xl bg-white/80 border-charcoal-gray/20"
                  disabled={isSubmitting}
                />
                {photoPreview && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                    <img src={photoPreview} alt="Reflection preview" className="w-full h-full object-cover" />
                     {!isSubmitting && (
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
                  disabled={isSubmitting}
                />
                <Button 
                  variant="outline" 
                  className="w-full border-charcoal-gray/30 text-charcoal-gray font-bold py-6 text-base rounded-xl" 
                  onClick={() => fileInputRef.current.click()}
                  disabled={isSubmitting}
                >
                  <Camera className="w-5 h-5 mr-2" /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <Select value={privacy} onValueChange={setPrivacy} disabled={isSubmitting}>
                  <SelectTrigger className="w-full border-charcoal-gray/30 text-charcoal-gray font-bold py-6 text-base rounded-xl">
                    <SelectValue placeholder="Select privacy..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public"><div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Public (share to community)</div></SelectItem>
                    <SelectItem value="private"><div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Private</div></SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmitReflection} disabled={isSubmitting} className="w-full bg-gradient-to-r from-forest-green to-leaf-green text-white font-bold py-6 text-base rounded-xl min-h-[60px] touch-manipulation">
                  <Upload className="w-5 h-5 mr-2" /> {isSubmitting ? 'Submitting...' : 'Submit Reflection'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {/* Extra Challenge Flow */}
        {showExtraChallenge && extraChallenge && (
          <motion.div key="extra" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="font-poppins text-3xl font-bold text-forest-green">Extra Challenge</CardTitle>
                <CardDescription className="text-charcoal-gray/80 text-base pt-1">{extraChallenge.title}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <p className="text-lg text-charcoal-gray leading-relaxed">{extraChallenge.title}</p>
                <Textarea
                  value={extraReflection}
                  onChange={(e) => setExtraReflection(e.target.value)}
                  placeholder="How did this extra challenge make you feel? What did you learn?"
                  className="min-h-[150px] text-base rounded-xl bg-white/80 border-charcoal-gray/20"
                  disabled={isSubmittingExtra}
                />
                <Button onClick={handleSubmitExtraReflection} disabled={isSubmittingExtra} className="w-full bg-gradient-to-r from-warm-orange to-orange-400 text-white font-bold py-6 text-base rounded-xl">
                  <Upload className="w-5 h-5 mr-2" /> {isSubmittingExtra ? 'Submitting...' : 'Submit Reflection'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetailsPage;