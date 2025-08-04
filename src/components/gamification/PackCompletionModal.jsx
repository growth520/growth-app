import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trophy, 
  Star, 
  Camera, 
  Globe, 
  Users, 
  Lock, 
  X,
  Upload,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

// Confetti animation component
const ConfettiPiece = ({ delay = 0 }) => (
  <motion.div
    className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
    initial={{ 
      y: -20, 
      x: Math.random() * 400 - 200,
      opacity: 1,
      scale: Math.random() * 0.5 + 0.5
    }}
    animate={{ 
      y: window.innerHeight + 100,
      x: Math.random() * 100 - 50,
      rotate: 360,
      opacity: 0
    }}
    transition={{ 
      duration: 3 + Math.random() * 2,
      delay: delay,
      ease: "easeOut"
    }}
  />
);

const Confetti = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <ConfettiPiece key={i} delay={i * 0.1} />
      ))}
    </div>
  );
};

// Pack gradient mapping
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

const PackCompletionModal = ({ 
  isOpen, 
  onClose, 
  pack, 
  onComplete,
  isCompleting = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReflection('');
      setVisibility('public');
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  if (!pack) return null;

  const gradient = getPackGradient(pack.title);
  const totalChallenges = Array.isArray(pack.challenges) ? pack.challenges.length : 0;

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pack-completion-${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Continuing without image.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleFinish = async () => {
    if (!reflection.trim()) {
      toast({
        title: "Reflection Required",
        description: "Please share your thoughts about completing this pack!",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete the pack.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload image if selected
      const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;

      // Call the completion handler with the data
      await onComplete({
        reflection: reflection.trim(),
        imageUrl,
        visibility
      });

    } catch (error) {
      console.error('Error completing pack:', error);
      toast({
        title: "Error Completing Pack",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'friends': return <Users className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getVisibilityDescription = () => {
    switch (visibility) {
      case 'public': return 'Everyone can see your achievement';
      case 'friends': return 'Only your friends can see this';
      case 'private': return 'Keep this achievement private';
      default: return 'Everyone can see your achievement';
    }
  };

  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Pack Completed!</DialogTitle>
            <DialogDescription>
              Congratulations! You have successfully completed the challenge pack. Share your reflection and celebrate your achievement.
            </DialogDescription>
          </DialogHeader>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Celebration Header */}
            <div className={`bg-gradient-to-r ${gradient} text-white p-6 rounded-lg -mx-6 -mt-6 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
                >
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-2"
                >
                  Pack Completed! 🎉
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg mb-2"
                >
                  {pack.title}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {totalChallenges} Challenges Completed
                  </Badge>
                  {/* Achievement Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {totalChallenges * 20} XP
                        </div>
                        <div className="text-sm text-green-700">Experience Earned</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          2 Tokens
                        </div>
                        <div className="text-sm text-blue-700">Streak Freeze Tokens</div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Reflection Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Share Your Growth Journey
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Reflect on what you learned and how this pack helped you grow.
                </p>
                <Textarea
                  placeholder="What did you learn from this challenge pack? How did it help you grow? Share your insights..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {reflection.length}/500 characters
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Add a Photo (Optional)
                </h4>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Upload preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      onClick={handleRemoveImage}
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <p className="text-xs text-gray-400">Max 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Visibility Settings */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Who can see this?</h4>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', icon: Globe, desc: 'Everyone can see your achievement' },
                    { value: 'friends', label: 'Friends', icon: Users, desc: 'Only your friends can see this' },
                    { value: 'private', label: 'Private', icon: Lock, desc: 'Keep this achievement private' }
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        visibility === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={value}
                        checked={visibility === value}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="sr-only"
                      />
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        visibility === value ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`font-medium ${
                          visibility === value ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          {label}
                        </div>
                        <div className={`text-sm ${
                          visibility === value ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isCompleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinish}
                className={`flex-1 bg-gradient-to-r ${gradient} hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isCompleting || !reflection.trim() || reflection.trim().length < 10}
              >
                {isCompleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {!reflection.trim() || reflection.trim().length < 10 
                      ? "Write reflection to finish" 
                      : "Finish & Share"}
                  </div>
                )}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PackCompletionModal; 