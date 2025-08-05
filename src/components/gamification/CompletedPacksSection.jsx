import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Trophy, 
  Calendar, 
  Star,
  CheckCircle,
  Eye,
  ChevronRight,
  Package,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

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

// Pack icon mapping
const getPackIcon = (title) => {
  const iconMap = {
    'Confidence Sprint': Trophy,
    'Mindful Morning': Star,
    'Self-Control Boost': Trophy,
    'Resilience Builder': Star,
    'Gratitude Growth': Trophy,
    'Purpose Path': Star,
    'Communication Upgrade': Trophy,
    'Humility & Perspective': Star,
    'Energy & Movement': Trophy,
    'Digital Detox': Trophy
  };
  
  return iconMap[title] || Package;
};

const CompletedPackCard = ({ pack, onClick }) => {
  const Icon = getPackIcon(pack.pack_title);
  const gradient = getPackGradient(pack.pack_title);
  const totalChallenges = pack.metadata?.total_challenges || 0;
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={() => onClick(pack)}
    >
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className={`bg-gradient-to-r ${gradient} text-white p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <CardTitle className="text-sm font-bold">
                {pack.pack_title}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>{totalChallenges} challenges completed</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Completed {new Date(pack.completed_at).toLocaleDateString()}</span>
            </div>
            
            {pack.reflection && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {pack.reflection}
              </p>
            )}
            
            {pack.image_url && (
              <div className="relative h-20 rounded-lg overflow-hidden">
                <img
                  src={pack.image_url}
                  alt="Pack completion"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Eye className="w-3 h-3" />
                <span className="capitalize">{pack.visibility}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CompletedPackModal = ({ isOpen, onClose, pack }) => {
  if (!pack) return null;

  const Icon = getPackIcon(pack.pack_title);
  const gradient = getPackGradient(pack.pack_title);
  const totalChallenges = pack.metadata?.total_challenges || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Completed Pack Details</DialogTitle>
          <DialogDescription>
            View details about your completed challenge pack including your reflection and achievements.
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
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    Pack Completed
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs capitalize">
                    {pack.visibility}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2">{pack.pack_title}</h2>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{totalChallenges} challenges completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Completed {new Date(pack.completed_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reflection */}
          {pack.reflection && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                My Growth Reflection
              </h3>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {pack.reflection}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Image */}
          {pack.image_url && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Photo</h3>
              <div className="rounded-lg overflow-hidden">
                <img
                  src={pack.image_url}
                  alt="Pack completion photo"
                  className="w-full max-h-96 object-cover"
                />
              </div>
            </div>
          )}

          {/* Achievement Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  50 XP
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
      </DialogContent>
    </Dialog>
  );
};

const CompletedPacksSection = ({ userId, isOwnProfile = false }) => {
  const { user } = useAuth();
  const [completedPacks, setCompletedPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchCompletedPacks = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Step 1: Fetch user pack progress without joins
        const { data: packProgressData, error } = await supabase
          .from('user_pack_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false });

        if (error) throw error;

        // Step 2: If we have pack progress data, fetch the corresponding challenge packs separately
        if (packProgressData && packProgressData.length > 0) {
          const packIds = packProgressData.map(p => p.pack_id).filter(Boolean);
          
          if (packIds.length > 0) {
            // Fetch challenge packs using the pack_ids (convert to BIGINT)
            const { data: challengePacksData, error: challengePacksError } = await supabase
              .from('challenge_packs')
              .select('id, title, description, challenges')
              .in('id', packIds.map(id => parseInt(id)));

            if (challengePacksError) {
              console.error('Error fetching challenge packs:', challengePacksError);
              // Continue with just pack progress data
              const transformedPacks = packProgressData.map(pack => ({
                ...pack,
                pack_title: 'Unknown Pack',
                metadata: { total_challenges: 0 }
              }));
              setCompletedPacks(transformedPacks);
              return;
            } else {
              // Step 3: Fetch reflection data from posts table for completed packs
              const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('reflection, challenge_id, created_at')
                .eq('user_id', userId)
                .eq('post_type', 'challenge_completion')
                .not('reflection', 'is', null);

              if (postsError) {
                console.error('Error fetching posts for reflection:', postsError);
              }

              // Step 4: Combine the data in JavaScript
              const transformedPacks = packProgressData.map(pack => {
                const challengePack = challengePacksData?.find(p => p.id === parseInt(pack.pack_id));
                
                // Find reflection from posts (this is a simplified approach)
                const packReflection = postsData?.find(post => 
                  post.challenge_id && 
                  challengePack?.challenges?.some(challenge => challenge.id === post.challenge_id)
                )?.reflection;

                return {
                  ...pack,
                  pack_title: challengePack?.title || 'Unknown Pack',
                  challenge_packs: challengePack,
                  reflection: packReflection, // Add reflection from posts
                  metadata: {
                    total_challenges: Array.isArray(challengePack?.challenges) 
                      ? challengePack.challenges.length 
                      : 0
                  }
                };
              });
              setCompletedPacks(transformedPacks);
              return;
            }
          }
        }

        // If no pack progress data, set empty array
        setCompletedPacks([]);
      } catch (error) {
        console.error('Error fetching completed packs:', error);
        setCompletedPacks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedPacks();
  }, [userId]);

  const handlePackClick = (pack) => {
    setSelectedPack(pack);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPack(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Completed Packs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-40 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completedPacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Completed Packs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {isOwnProfile 
                ? "No completed challenge packs yet" 
                : "This user hasn't completed any challenge packs yet"
              }
            </p>
            {isOwnProfile && (
              <p className="text-xs mt-1">Complete your first pack to see it here!</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Completed Packs
            <Badge variant="secondary" className="ml-2">
              {completedPacks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {completedPacks.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CompletedPackCard 
                    pack={pack} 
                    onClick={handlePackClick}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <CompletedPackModal
        isOpen={modalOpen}
        onClose={closeModal}
        pack={selectedPack}
      />
    </>
  );
};

export default CompletedPacksSection; 