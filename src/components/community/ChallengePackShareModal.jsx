import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  Share2, 
  Camera, 
  Globe, 
  Users, 
  Lock, 
  X,
  Trophy,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const ChallengePackShareModal = ({ 
  isOpen, 
  onClose, 
  packTitle, 
  challengeText, 
  challengeIndex,
  packId 
}) => {
  const { user } = useAuth();
  const { profile } = useData();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [sharing, setSharing] = useState(false);
  const [reflection, setReflection] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleShare = async () => {
    if (!user) return;

    setSharing(true);

    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      // Create the post
      const postContent = `Completed "${challengeText}" from ${packTitle}${reflection ? `\n\n${reflection}` : ''}`;
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postContent,
          image_url: imageUrl,
          visibility: visibility,
          post_type: 'challenge_pack_completion',
          metadata: {
            pack_id: packId,
            pack_title: packTitle,
            challenge_index: challengeIndex,
            challenge_text: challengeText
          }
        })
        .select(`
          *,
          profiles (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: "🎉 Shared Successfully!",
        description: "Your challenge completion has been shared with the community!",
        duration: 4000,
      });

      // Close modal and reset state
      onClose();
      setReflection('');
      setSelectedImage(null);
      setImagePreview(null);
      setVisibility('public');

      // Trigger real-time update for community feed
      window.dispatchEvent(new CustomEvent('newCommunityPost', { detail: data }));

    } catch (error) {
      console.error('Error sharing challenge completion:', error);
      toast({
        title: "Sharing Failed",
        description: "Unable to share your completion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-forest-green" />
            Share Your Achievement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Achievement Preview */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-800">
                      {profile?.full_name || 'You'}
                    </p>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                      <Trophy className="w-3 h-3 mr-1" />
                      Challenge Pack
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Completed "<span className="font-medium">{challengeText}</span>" from{' '}
                    <span className="font-medium text-forest-green">{packTitle}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Reflection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your thoughts (optional)
            </label>
            <Textarea
              placeholder="How did this challenge help you grow? What did you learn?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {reflection.length}/500 characters
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a photo (optional)
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {selectedImage ? 'Change Photo' : 'Add Photo'}
              </Button>
              {selectedImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can see this?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'public', label: 'Public', icon: Globe },
                { value: 'friends', label: 'Friends', icon: Users },
                { value: 'private', label: 'Private', icon: Lock }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={visibility === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility(value)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={sharing}
            >
              Skip
            </Button>
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 bg-forest-green hover:bg-forest-green/90"
            >
              {sharing ? 'Sharing...' : 'Share Achievement'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePackShareModal; 