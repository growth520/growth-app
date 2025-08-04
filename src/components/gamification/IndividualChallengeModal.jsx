import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Target, 
  Calendar, 
  CheckCircle, 
  Camera, 
  Upload, 
  X,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

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

const IndividualChallengeModal = ({ 
  isOpen, 
  onClose, 
  pack, 
  challenge,
  challengeIndex,
  onComplete,
  isCompleting = false 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [reflection, setReflection] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReflection('');
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  if (!pack || !challenge) return null;

  const gradient = getPackGradient(pack.title);
  const isReflectionValid = reflection.trim().length >= 10;

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
      const fileName = `challenge-${user.id}-${Date.now()}.${fileExt}`;
      
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

  const handleComplete = async () => {
    if (!isReflectionValid) {
      toast({
        title: "Reflection Too Short",
        description: "Please write at least 10 characters about your experience.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete the challenge.",
        variant: "destructive"
      });
      return;
    }

    if (!pack?.id) {
      toast({
        title: "Pack Not Found",
        description: "Challenge pack information is missing. Please try refreshing the page.",
        variant: "destructive"
      });
      return;
    }

    if (typeof challengeIndex !== 'number' || challengeIndex < 0) {
      toast({
        title: "Invalid Challenge",
        description: "Challenge information is invalid. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload image if selected
      const imageUrl = selectedImage ? await uploadImage(selectedImage) : null;

      // Call the completion handler with validated data
      await onComplete({
        challengeIndex: parseInt(challengeIndex), // Ensure it's an integer
        reflection: reflection.trim(),
        imageUrl,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error Completing Challenge",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Individual Challenge</DialogTitle>
          <DialogDescription>
            Complete this individual challenge and share your reflection on your growth journey.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${gradient} text-white p-6 rounded-lg -mx-6 -mt-6`}>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Target className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    Challenge {challengeIndex + 1}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    {pack.title}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold mb-2">Complete This Challenge</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  {challenge.text || challenge}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 rounded-full p-1 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">How to Complete</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    Write your reflection to complete this challenge. Share your experience, 
                    what you learned, or how it made you feel. This is for your personal growth record.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reflection Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Your Reflection <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                How did this challenge go? What did you learn or experience? (Minimum 10 characters)
              </p>
              <Textarea
                placeholder="Share your thoughts about completing this challenge..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className={`min-h-[120px] resize-none ${
                  reflection.length > 0 && !isReflectionValid 
                    ? 'border-red-300 focus:border-red-500' 
                    : isReflectionValid 
                    ? 'border-green-300 focus:border-green-500' 
                    : ''
                }`}
                maxLength={500}
              />
              <div className="flex justify-between text-xs mt-1">
                <span className={`${
                  reflection.length > 0 && !isReflectionValid 
                    ? 'text-red-500' 
                    : isReflectionValid 
                    ? 'text-green-600' 
                    : 'text-gray-500'
                }`}>
                  {reflection.length < 10 
                    ? `${10 - reflection.length} more characters needed`
                    : `✓ Reflection complete`
                  }
                </span>
                <span className="text-gray-500">{reflection.length}/500</span>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Add a Photo (Optional)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Capture a moment from your challenge experience for your personal record.
              </p>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Challenge reflection"
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              className={`flex-1 bg-gradient-to-r ${gradient} hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isCompleting || !isReflectionValid}
            >
              {isCompleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Completing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {!isReflectionValid ? "Write reflection to complete" : "Mark as Complete"}
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default IndividualChallengeModal; 