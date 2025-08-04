import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  Trophy, 
  Star, 
  Lock, 
  CheckCircle,
  Users,
  Target,
  Zap,
  Gift
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

// Pack icon mapping
const getPackIcon = (title) => {
  const iconMap = {
    'Confidence Sprint': Trophy,
    'Mindful Morning': Star,
    'Self-Control Boost': Target,
    'Resilience Builder': Zap,
    'Gratitude Growth': Gift,
    'Purpose Path': Star,
    'Communication Upgrade': Users,
    'Humility & Perspective': Users,
    'Energy & Movement': Zap,
    'Digital Detox': Lock
  };
  
  return iconMap[title] || Package;
};

const ChallengePackDetailsModal = ({ 
  isOpen, 
  onClose, 
  pack, 
  onAcceptPack,
  isAccepting = false,
  existingProgress = null 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  if (!pack) return null;

  const Icon = getPackIcon(pack.title);
  const gradient = getPackGradient(pack.title);
  const totalChallenges = Array.isArray(pack.challenges) ? pack.challenges.length : 0;
  const completedCount = existingProgress ? existingProgress.completed : 0;
  const progressPercentage = totalChallenges > 0 ? Math.round((completedCount / totalChallenges) * 100) : 0;
  
  // Get growth area from pack title (simple mapping)
  const getGrowthArea = (title) => {
    if (title.includes('Confidence')) return 'Confidence';
    if (title.includes('Mindful')) return 'Mindfulness';
    if (title.includes('Control')) return 'Self-Control';
    if (title.includes('Resilience')) return 'Resilience';
    if (title.includes('Gratitude')) return 'Gratitude';
    if (title.includes('Purpose')) return 'Purpose';
    if (title.includes('Communication')) return 'Communication';
    if (title.includes('Humility')) return 'Humility';
    if (title.includes('Energy')) return 'Fitness';
    if (title.includes('Digital')) return 'Digital Wellness';
    return 'Personal Growth';
  };

  const handleAcceptPack = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a challenge pack.",
        variant: "destructive"
      });
      return;
    }

    try {
      await onAcceptPack(pack);
    } catch (error) {
      console.error('Error accepting pack:', error);
      toast({
        title: "Error Starting Pack",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Challenge Pack Details</DialogTitle>
          <DialogDescription>
            View details about this challenge pack including challenges, requirements, and your progress.
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
                    {getGrowthArea(pack.title)}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                    Level {pack.level_required}+
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold mb-2">{pack.title}</h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  {pack.description}
                </p>
              </div>
            </div>
          </div>

          {/* Pack Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {totalChallenges}
                </div>
                <div className="text-sm text-gray-600">
                  Challenges in pack
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {existingProgress ? `${completedCount}/${totalChallenges}` : '0/0'}
                </div>
                <div className="text-sm text-gray-600">
                  {existingProgress ? 'Completed' : 'Not started'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section (if started) */}
          {existingProgress && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Your Progress</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Progress: {completedCount} of {totalChallenges} completed</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* First Challenge Preview */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              {existingProgress ? 'Next Challenge Preview' : 'First Challenge Preview'}
            </h3>
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-gray-200 rounded-full p-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-600">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed">
                      {totalChallenges > 0 ? pack.challenges[0] : 'No challenges available'}
                    </p>
                    {totalChallenges > 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 italic">
                          + {totalChallenges - 1} more challenge{totalChallenges > 2 ? 's' : ''} to unlock...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptPack}
              className={`flex-1 bg-gradient-to-r ${gradient} hover:opacity-90 text-white`}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Starting...
                </div>
              ) : existingProgress ? (
                'Continue Pack'
              ) : (
                'Accept Pack'
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePackDetailsModal; 