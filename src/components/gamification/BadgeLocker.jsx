import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Lock, Eye } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import BadgeModal from './BadgeModal';

const BadgeLocker = ({ userId, onViewAll }) => {
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch badges data
  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return;

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
          .eq('user_id', userId);

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
  }, [userId]);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show max 6 badges in preview (2 rows of 3)
  const displayBadges = allBadges.slice(0, 6);
  const hasMoreBadges = allBadges.length > 6;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Badges
            <Badge variant="secondary" className="bg-white/20 text-white">
              {earnedBadges.length}/{allBadges.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allBadges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No badges available</p>
              <p className="text-xs mt-1">Badges will be added soon!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {displayBadges.map((badge, index) => {
                  const unlocked = isUnlocked(badge.id);
                  const earnedAt = earnedBadgeMap.get(badge.id);
                  const progress = getBadgeProgress(badge);

                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
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
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center border-2 border-yellow-200 mx-auto mb-2">
                        {badge.icon_url ? (
                          // Check if icon_url is an emoji (simple check for common emoji characters)
                          /[✅✋🔟2️⃣5️⃣5️⃣0️⃣7️⃣5️⃣💯🔥🚀🏅🥈🥉4️⃣🏅6️⃣7️⃣8️⃣9️⃣🔟🔰🌐💫🎯🏆🌟🌞🔥💭🤝🫂❤️💖💗💞💝📣🌍💬🗣️🗨️📝🏷️📦📚🎒🏰🏛️🏯🤖🧩⚡🔮🧠✨🌅🌙📆🗓️🦋]/.test(badge.icon_url) ? (
                            <span className="text-2xl">{badge.icon_url}</span>
                          ) : (
                            <img 
                              src={badge.icon_url} 
                              alt={badge.name}
                              className="w-8 h-8"
                            />
                          )
                        ) : (
                          <Trophy className="w-8 h-8 text-yellow-600" />
                        )}
                      </div>

                      {/* Lock Icon for locked badges */}
                      {!unlocked && (
                        <div className="absolute top-0 right-0">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                      )}

                      {/* Badge Name */}
                      <h3 className="text-xs font-medium text-center leading-tight">
                        {badge.name}
                      </h3>

                      {/* Earned Date */}
                      {unlocked && earnedAt && (
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {new Date(earnedAt).toLocaleDateString()}
                        </p>
                      )}

                      {/* Progress Indicator */}
                      {!unlocked && progress && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-8 h-2 bg-gray-200 rounded-full overflow-hidden">
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

              {/* View All Button */}
              {(hasMoreBadges || earnedBadges.length >= 5) && (
                <div className="flex justify-center">
                  <Button 
                    onClick={onViewAll}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View All Badges
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Badge Modal */}
      <BadgeModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        badge={selectedBadge}
        isUnlocked={selectedBadge ? isUnlocked(selectedBadge.id) : false}
        earnedAt={selectedBadge ? earnedBadgeMap.get(selectedBadge.id) : null}
        progress={selectedBadge ? getBadgeProgress(selectedBadge) : null}
      />
    </>
  );
};

export default BadgeLocker; 