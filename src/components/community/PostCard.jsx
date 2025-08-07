import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  User,
  Target,
  Clock,
  Eye,
  Trophy,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onProfileClick,
  onViewComments,
  isLiked = false,
  isCommented = false,
  showInteractions = true
}) => {
  const { toast } = useToast();
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [recentComments, setRecentComments] = useState([]);
  const [currentCommentIndex, setCurrentCommentIndex] = useState(0);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [isLoading, setIsLoading] = useState(false);

  // Update like state when isLiked prop changes
  useEffect(() => {
    setIsLikedState(isLiked);
  }, [isLiked, post.id]);

  // Initialize counts from post data and update when post changes
  useEffect(() => {
    setLikesCount(post.likes_count || 0);
    setCommentsCount(post.comments_count || 0);
    setSharesCount(post.shares_count || 0);
    setViewsCount(post.views_count || 0);
  }, [post.id, post.likes_count, post.comments_count, post.shares_count, post.views_count]);

  // Fetch recent comments
  useEffect(() => {
    fetchRecentComments();
  }, [post.id]);

  // Rotate comments every 5 seconds
  useEffect(() => {
    if (recentComments.length > 1) {
      const interval = setInterval(() => {
        setCurrentCommentIndex((prev) => 
          prev === recentComments.length - 1 ? 0 : prev + 1
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [recentComments.length]);

  const fetchRecentComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.warn('Comments fetch failed, continuing without comments:', error);
        setRecentComments([]);
        setCommentsCount(0);
        return;
      }

      // Fetch profiles separately for comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(comment => comment.user_id).filter(Boolean))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching comment profiles:', profilesError);
          setRecentComments(data);
          setCommentsCount(data.length);
        } else {
          const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});

          // Combine comments with profile data
          const commentsWithProfiles = data.map(comment => ({
            ...comment,
            profiles: profilesMap[comment.user_id] || null
          }));

          setRecentComments(commentsWithProfiles);
          setCommentsCount(commentsWithProfiles.length);
        }
      } else {
        setRecentComments([]);
        setCommentsCount(0);
      }
    } catch (error) {
      console.error('Error fetching recent comments:', error);
      setRecentComments([]);
      setCommentsCount(0);
    }
  };

  const handleLike = async () => {
    if (!onLike) return;
    
    setIsLoading(true);
    try {
      await onLike();
      // The parent component should handle the state updates
      // We just need to update our local state to reflect the change
      setIsLikedState(!isLikedState);
      setLikesCount(prev => isLikedState ? Math.max(0, prev - 1) : prev + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment();
    }
  };

  const handleShare = async () => {
    if (!onShare) return;
    
    try {
      await onShare();
      setSharesCount(prev => prev + 1);
      toast({
        title: "Shared!",
        description: "Post shared successfully",
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive"
      });
    }
  };

  const getGrowthAreaEmoji = (growthArea) => {
    const emojiMap = {
      'Confidence': '💪',
      'Communication': '💬',
      'Self-Control': '🧘',
      'Self-Worth': '💎',
      'Mindfulness': '🧠',
      'Relationships': '❤️',
      'Leadership': '👑',
      'Resilience': '🛡️',
      'Gratitude': '🙏',
      'Creativity': '🎨',
      'Empathy': '🤝',
      'Optimism': '☀️'
    };
    return emojiMap[growthArea] || '🎯';
  };

  const calculatePostScore = () => {
    return (likesCount * 2) + (commentsCount * 3) + (sharesCount * 1);
  };

  const getTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  const getDisplayName = () => {
    if (post.profiles?.full_name) {
      return post.profiles.full_name;
    }
    if (post.profiles?.username) {
      return post.profiles.username;
    }
    return 'Anonymous User';
  };

  const getAvatarUrl = () => {
    return post.profiles?.avatar_url || null;
  };

  const getAvatarFallback = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onProfileClick && onProfileClick(post.user_id)}
          >
            <AvatarImage src={getAvatarUrl()} alt={getDisplayName()} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
              {getAvatarFallback()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onProfileClick && onProfileClick(post.user_id)}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left truncate"
              >
                {getDisplayName()}
              </button>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</span>
            </div>
            
            {/* Growth Area Badge */}
            {post.category && (
              <div className="flex items-center space-x-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getGrowthAreaEmoji(post.category)} {post.category}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        {/* Challenge Title */}
        {post.challenge_title && (
          <div className="mb-3">
            <Badge variant="secondary" className="text-xs mb-2">
              Challenge: {post.challenge_title}
            </Badge>
          </div>
        )}
        
        {/* Reflection Text */}
        <div className="text-gray-800 leading-relaxed mb-4">
          {post.reflection}
        </div>
        
        {/* Photo */}
        {post.photo_url && (
          <div className="mb-4">
            <img
              src={post.photo_url}
              alt="Post attachment"
              className="w-full h-auto rounded-lg object-cover max-h-96"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      {showInteractions && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={isLoading}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  isLikedState 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart 
                  className={`h-5 w-5 ${isLikedState ? 'fill-current' : ''}`} 
                />
                <span>{likesCount}</span>
              </button>
              
              {/* Comment Button */}
              <button
                onClick={handleComment}
                className={`flex items-center space-x-2 text-sm transition-colors ${
                  isCommented 
                    ? 'text-blue-500 hover:text-blue-600' 
                    : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <MessageSquare className={`h-5 w-5 ${isCommented ? 'fill-current' : ''}`} />
                <span>{commentsCount}</span>
              </button>
              
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>{sharesCount}</span>
              </button>
            </div>
            
            {/* Views Count */}
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Eye className="h-4 w-4" />
              <span>{viewsCount}</span>
            </div>
          </div>
        </div>
      )}
        
      {/* Comments Preview */}
      {showInteractions && recentComments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-start space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={recentComments[currentCommentIndex]?.profiles?.avatar_url} 
                alt={recentComments[currentCommentIndex]?.profiles?.username} 
              />
              <AvatarFallback className="text-xs">
                {recentComments[currentCommentIndex]?.profiles?.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {recentComments[currentCommentIndex]?.profiles?.username || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(recentComments[currentCommentIndex]?.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                {recentComments[currentCommentIndex]?.content}
              </p>
            </div>
          </div>
          
          {recentComments.length > 1 && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex space-x-1">
                {recentComments.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${
                      index === currentCommentIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onViewComments}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View all {commentsCount} comments
              </button>
            </div>
          )}
        </div>
      )}
        
      {/* View Comments Link */}
      {showInteractions && commentsCount > 0 && recentComments.length === 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onViewComments}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all {commentsCount} comments
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard;