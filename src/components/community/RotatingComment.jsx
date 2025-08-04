import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const RotatingComment = ({ comments, onViewAll }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (comments.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [comments.length]);

  if (comments.length === 0) return null;

  const currentComment = comments[currentIndex];

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Recent Comments
        </span>
        {comments.length > 1 && (
          <div className="flex space-x-1">
            {comments.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-start space-x-2"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentComment.profiles?.avatar_url} />
            <AvatarFallback className="text-xs">
              {currentComment.profiles?.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {currentComment.profiles?.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(currentComment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-700 truncate">
              {currentComment.content}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {comments.length > 1 && onViewAll && (
        <button
          onClick={onViewAll}
          className="text-sm text-primary hover:text-primary/80 font-medium mt-2"
        >
          View all {comments.length} comments
        </button>
      )}
    </div>
  );
};

export default RotatingComment;