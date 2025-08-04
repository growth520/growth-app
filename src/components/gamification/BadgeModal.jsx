import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Trophy, Star } from 'lucide-react';

const BadgeModal = ({ isOpen, onClose, badge, isUnlocked, earnedAt, progress }) => {
  if (!badge) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isUnlocked ? (
                  <>
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Badge Earned
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 text-gray-500" />
                    Badge Details
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Badge Display */}
              <div className="flex justify-center">
                <div className={`relative ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center border-4 border-yellow-200">
                    {badge.icon_url ? (
                      <img 
                        src={badge.icon_url} 
                        alt={badge.name}
                        className="w-12 h-12"
                      />
                    ) : (
                      <Trophy className="w-12 h-12 text-yellow-600" />
                    )}
                  </div>
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">🔒</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge Info */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{badge.name}</h3>
                <p className="text-gray-600">{badge.description}</p>
                
                {isUnlocked && earnedAt && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Earned {new Date(earnedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Progress or Requirements */}
              {!isUnlocked && badge.criteria_json && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Requirements to Unlock:</h4>
                  <div className="space-y-2">
                    {badge.criteria_json.requirements?.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span>{req.description}</span>
                        {progress && req.progress !== undefined && (
                          <Badge variant="outline" className="ml-auto">
                            {req.progress}/{req.target}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges that earned it (if unlocked) */}
              {isUnlocked && badge.criteria_json?.challenges && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Challenges Completed:</h4>
                  <div className="space-y-1">
                    {badge.criteria_json.challenges.map((challenge, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {challenge.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default BadgeModal; 