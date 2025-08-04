import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X, 
  Trophy, 
  CheckCircle, 
  Share2, 
  Eye,
  EyeOff,
  Image as ImageIcon,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const CompletedPackDetailsModal = ({ 
  isOpen, 
  onClose, 
  packId,
  onShareSuccess 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [packDetails, setPackDetails] = useState(null);
  const [showImage, setShowImage] = useState(true);

  // Fetch pack completion details
  useEffect(() => {
    if (isOpen && packId && user) {
      fetchPackDetails();
    }
  }, [isOpen, packId, user]);

  const fetchPackDetails = async () => {
    setLoading(true);
    try {
             const { data, error } = await supabase.rpc('get_pack_completion_details', {
         p_user_id: user.id,
         p_pack_id: packId
       });

      if (error) {
        console.error('Error fetching pack details:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load pack completion details",
          variant: "destructive"
        });
        return;
      }

      // Validate the data structure
      if (!data) {
        toast({
          title: "Error",
          description: "No pack completion data found",
          variant: "destructive"
        });
        return;
      }

             console.log('Pack completion details:', data); // Debug log
       console.log('Data structure check:', {
         pack_name: data.pack_name,
         pack_description: data.pack_description,
         badge: data.badge,
         reflection: data.reflection,
         completed_at: data.completed_at,
         challenges: data.challenges,
         completed_challenges_count: data.completed_challenges_count,
         total_challenges: data.total_challenges
       });
       setPackDetails(data);
    } catch (error) {
      console.error('Error fetching pack details:', error);
      toast({
        title: "Error",
        description: "Failed to load pack completion details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!packDetails) return;

    setSharing(true);
    try {
             const { data, error } = await supabase.rpc('share_pack_completion', {
         p_user_id: user.id,
         p_pack_id: packId,
         p_visibility: 'public'
       });

      if (error) {
        console.error('Error sharing pack completion:', error);
        toast({
          title: "Error",
          description: "Failed to share pack completion",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "🎉 Shared Successfully!",
        description: "Your pack completion has been shared to the community",
      });

      // Update the pack details to reflect the new visibility
      setPackDetails(prev => ({
        ...prev,
        visibility: 'public'
      }));

      // Call the callback if provided
      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (error) {
      console.error('Error sharing pack completion:', error);
      toast({
        title: "Error",
        description: "Failed to share pack completion",
        variant: "destructive"
      });
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={onClose}>
                 <DialogContent 
           className="max-w-2xl max-h-[90vh] overflow-y-auto"
         >
                     <DialogHeader>
             <DialogTitle className="flex items-center gap-3">
               <Trophy className="w-6 h-6 text-yellow-500" />
               <span>Pack Completion Details</span>
             </DialogTitle>
           </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
            </div>
                     ) : packDetails ? (
                           <div className="space-y-6">
                               {/* Pack Header */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{packDetails.badge?.emoji || '🏆'}</div>
                  <h2 className="text-2xl font-bold text-forest-green mb-1">
                    {packDetails.pack_name || 'Challenge Pack'}
                  </h2>
                  <p className="text-gray-600 mb-3">{packDetails.pack_description || 'A completed challenge pack'}</p>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {packDetails.badge?.title || 'Pack Completed'}
                  </Badge>
                </div>

                             {/* Completion Info */}
               <Card>
                 <CardContent className="p-4">
                   <h3 className="font-semibold text-forest-green mb-3 flex items-center gap-2">
                     <Trophy className="w-4 h-4" />
                     Completion Details
                   </h3>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Completed on {packDetails.completed_at ? formatDate(packDetails.completed_at) : 'Unknown date'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{packDetails.completed_challenges_count || 0}/{packDetails.total_challenges || 0} challenges completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Trophy className="w-4 h-4" />
                        <span>Level {packDetails.level_required || 1}+ required</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Share2 className="w-4 h-4" />
                        <span>Visibility: {packDetails.visibility || 'private'}</span>
                      </div>
                    </div>
                 </CardContent>
               </Card>

                             {/* Reflection */}
               {packDetails.reflection && (
                 <Card>
                   <CardContent className="p-4">
                     <h3 className="font-semibold text-forest-green mb-3 flex items-center gap-2">
                       <Trophy className="w-4 h-4" />
                       Your Reflection
                     </h3>
                     <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-l-4 border-yellow-400">
                       <p className="text-gray-700 italic leading-relaxed">
                         "{packDetails.reflection}"
                       </p>
                     </div>
                   </CardContent>
                 </Card>
               )}

                             {/* Image */}
               {packDetails.image_url && (
                 <Card>
                   <CardContent className="p-4">
                     <div className="flex items-center justify-between mb-3">
                       <h3 className="font-semibold text-forest-green flex items-center gap-2">
                         <ImageIcon className="w-4 h-4" />
                         Completion Photo
                       </h3>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setShowImage(!showImage)}
                         className="h-8 px-2"
                         aria-label={showImage ? "Hide image" : "Show image"}
                       >
                         {showImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </Button>
                     </div>
                     {showImage && (
                       <div className="relative">
                         <img
                           src={packDetails.image_url}
                           alt={`Completion photo for ${packDetails.pack_name} challenge pack`}
                           className="w-full h-48 object-cover rounded-lg shadow-md"
                           loading="lazy"
                         />
                       </div>
                     )}
                   </CardContent>
                 </Card>
               )}

                             {/* All Challenges in Pack */}
               <Card>
                 <CardContent className="p-4">
                   <h3 className="font-semibold text-forest-green mb-3">
                     All Challenges in Pack
                   </h3>
                                       <div className="space-y-3 max-h-64 overflow-y-auto">
                      {packDetails.challenges && Array.isArray(packDetails.challenges) && packDetails.challenges.length > 0 ? (
                        packDetails.challenges.map((challenge, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-gray-800">{challenge?.challenge_text || `Challenge ${index + 1}`}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Completed on {challenge?.completed_at ? formatDate(challenge.completed_at) : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p>No challenges found for this pack</p>
                        </div>
                      )}
                    </div>
                 </CardContent>
               </Card>

                             {/* Action Buttons */}
               <div className="flex gap-3 pt-4">
                 <Button
                   variant="outline"
                   onClick={onClose}
                   className="flex-1"
                   aria-label="Close pack completion details"
                 >
                   Close
                 </Button>
                 {packDetails.visibility === 'private' && (
                   <Button
                     onClick={handleShare}
                     disabled={sharing}
                     className="flex-1 bg-forest-green hover:bg-forest-green/90"
                     aria-label="Share pack completion to community"
                   >
                     {sharing ? (
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                     ) : (
                       <Share2 className="w-4 h-4 mr-2" />
                     )}
                     Share to Community
                   </Button>
                 )}
                 {packDetails.visibility === 'public' && (
                   <Badge variant="secondary" className="flex-1 justify-center bg-green-100 text-green-800">
                     <Share2 className="w-4 h-4 mr-2" />
                     Already Shared
                   </Badge>
                 )}
               </div>
            </div>
                     ) : (
             <div className="text-center py-8 text-gray-500">
               <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
               <p>Pack completion details not found</p>
               <p className="text-sm mt-2">The pack may not be completed or the data is unavailable.</p>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
};

export default CompletedPackDetailsModal; 