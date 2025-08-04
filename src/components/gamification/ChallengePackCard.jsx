import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Play, CheckCircle, Clock, Trophy } from 'lucide-react';

const ChallengePackCard = ({ 
  pack, 
  onStart, 
  onContinue, 
  onView,
  className = "",
  size = "default" // "default", "compact", "featured"
}) => {
  const navigate = useNavigate();
  
  const {
    id,
    title,
    description,
    icon,
    duration_days,
    level_required,
    category,
    isUnlocked,
    isStarted,
    progress,
    statusText
  } = pack;

  const isCompleted = progress?.is_completed;
  const completionPercentage = progress?.completion_percentage || 0;
  
  const getStatusColor = () => {
    if (!isUnlocked) return 'bg-gray-400';
    if (isCompleted) return 'bg-green-500';
    if (isStarted) return 'bg-blue-500';
    return 'bg-forest-green';
  };

  const getStatusIcon = () => {
    if (!isUnlocked) return <Lock className="w-4 h-4" />;
    if (isCompleted) return <CheckCircle className="w-4 h-4" />;
    if (isStarted) return <Clock className="w-4 h-4" />;
    return <Play className="w-4 h-4" />;
  };

  const handleAction = () => {
    if (!isUnlocked) return;
    
    // Navigate to pack details page instead of handling actions here
    navigate(`/challenge-pack/${id}`);
  };

  const getActionText = () => {
    if (isCompleted) return 'View Details';
    if (isStarted) return 'Continue';
    return 'View Pack';
  };

  const cardVariants = {
    hover: { 
      scale: 1.02, 
      y: -4,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={isUnlocked ? "hover" : undefined}
      whileTap={isUnlocked ? "tap" : undefined}
      className={className}
    >
      <Card className={`relative overflow-hidden transition-all duration-200 ${
        isUnlocked 
          ? 'hover:shadow-lg cursor-pointer border-black/10' 
          : 'opacity-60 cursor-not-allowed border-gray-300'
      } ${isCompleted ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-white' : ''}`}>
        
        {/* Pack Category Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor()} text-white border-none`}
            style={{ backgroundColor: getStatusColor().replace('bg-', '') }}
          >
            {category}
          </Badge>
        </div>

        {/* Completion Trophy for finished packs */}
        {isCompleted && (
          <div className="absolute top-4 left-4 z-10">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{icon}</div>
            <div className="flex-1">
              <CardTitle className={`text-lg font-bold ${size === 'compact' ? 'text-base' : ''}`}>
                {title}
              </CardTitle>
              <p className={`text-sm text-gray-600 mt-1 line-clamp-2 ${
                size === 'compact' ? 'text-xs' : ''
              }`}>
                {description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Pack Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration_days} days</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>Level {level_required}+</span>
            </div>
          </div>

          {/* Progress Bar for Started Packs */}
          {isStarted && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">
                  {Math.round(completionPercentage)}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {progress && (
                <p className="text-xs text-gray-500 mt-1">
                  Day {progress.current_day} of {duration_days}
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button 
            onClick={handleAction}
            disabled={!isUnlocked}
            className={`w-full ${
              isCompleted 
                ? 'bg-green-600 hover:bg-green-700' 
                : isStarted 
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-forest-green hover:bg-forest-green/90'
            }`}
            size={size === 'compact' ? 'sm' : 'default'}
          >
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>{isUnlocked ? getActionText() : statusText}</span>
            </div>
          </Button>

          {/* Level Requirement for Locked Packs */}
          {!isUnlocked && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Reach Level {level_required} to unlock
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChallengePackCard; 