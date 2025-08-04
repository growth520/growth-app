import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Lock, ArrowLeft, Filter } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import BadgeModal from '@/components/gamification/BadgeModal';

const BadgesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'earned', 'locked'

  // Fetch badges data
  useEffect(() => {
    const fetchBadges = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch all badge definitions
        const { data: badgesData, error: badgesError } = await supabase
          .from('badges')
          .select('*')
          .order('created_at', { ascending: true });

        if (badgesError) {
          console.error('Error fetching badges:', badgesError);
          return;
        }

        // Fetch user's earned badges
        const { data: earnedData, error: earnedError } = await supabase
          .from('user_badges')
          .select('badge_id, earned_at')
          .eq('user_id', user.id);

        if (earnedError) {
          console.error('Error fetching earned badges:', earnedError);
          return;
        }

        setAllBadges(badgesData || []);
        setEarnedBadges(earnedData || []);
      } catch (error) {
        console.error('Error fetching badge data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user?.id]);

  // Create a map of earned badges for quick lookup
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));
  const earnedBadgeMap = new Map(earnedBadges.map(b => [b.badge_id, b.earned_at]));

  // Calculate progress for each badge
  const getBadgeProgress = (badge) => {
    if (!badge.criteria_json) return null;

    // This is a simplified progress calculation
    // In a real implementation, you'd calculate based on user's actual progress
    const progress = {
      challenges_completed: 0,
      streak_days: 0,
      level: 1
    };

    return progress;
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedBadge(null);
  };

  const isUnlocked = (badgeId) => earnedBadgeIds.has(badgeId);

  // Filter badges based on current filter
  const filteredBadges = allBadges.filter(badge => {
    const unlocked = isUnlocked(badge.id);
    switch (filter) {
      case 'earned':
        return unlocked;
      case 'locked':
        return !unlocked;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Badge Collection</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Badge Collection</h1>
          <p className="text-gray-600">
            {earnedBadges.length} of {allBadges.length} badges earned
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({allBadges.length})
        </Button>
        <Button
          variant={filter === 'earned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('earned')}
        >
          <Trophy className="w-4 h-4 mr-1" />
          Earned ({earnedBadges.length})
        </Button>
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('locked')}
        >
          <Lock className="w-4 h-4 mr-1" />
          Locked ({allBadges.length - earnedBadges.length})
        </Button>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'earned' ? 'No badges earned yet' : 'No badges found'}
            </h3>
            <p className="text-gray-600">
              {filter === 'earned' 
                ? 'Complete challenges to earn your first badge!'
                : 'Try a different filter or check back later for new badges.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBadges.map((badge, index) => {
            const unlocked = isUnlocked(badge.id);
            const earnedAt = earnedBadgeMap.get(badge.id);
            const progress = getBadgeProgress(badge);

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative cursor-pointer group ${
                  unlocked 
                    ? 'hover:scale-105 transition-transform' 
                    : 'opacity-50 grayscale'
                }`}
                onClick={() => handleBadgeClick(badge)}
                title={
                  unlocked 
                    ? `🏆 Earned: ${badge.name} — ${badge.description}`
                    : `🔒 Locked — ${badge.description}`
                }
              >
                {/* Badge Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center border-4 border-yellow-200 mx-auto mb-3">
                  {badge.icon_url ? (
                    <img 
                      src={badge.icon_url} 
                      alt={badge.name}
                      className="w-10 h-10"
                    />
                  ) : (
                    <Trophy className="w-10 h-10 text-yellow-600" />
                  )}
                </div>

                {/* Lock Icon for locked badges */}
                {!unlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}

                {/* Badge Name */}
                <h3 className="text-sm font-medium text-center leading-tight mb-1">
                  {badge.name}
                </h3>

                {/* Badge Description */}
                <p className="text-xs text-gray-600 text-center line-clamp-2 mb-2">
                  {badge.description}
                </p>

                {/* Earned Date */}
                {unlocked && earnedAt && (
                  <p className="text-xs text-gray-500 text-center">
                    {new Date(earnedAt).toLocaleDateString()}
                  </p>
                )}

                {/* Progress Indicator */}
                {!unlocked && progress && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ 
                          width: `${Math.min((progress.challenges_completed / 5) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Badge Modal */}
      <BadgeModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        badge={selectedBadge}
        isUnlocked={selectedBadge ? isUnlocked(selectedBadge.id) : false}
        earnedAt={selectedBadge ? earnedBadgeMap.get(selectedBadge.id) : null}
        progress={selectedBadge ? getBadgeProgress(selectedBadge) : null}
      />
    </div>
  );
};

export default BadgesPage; 