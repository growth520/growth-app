import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  X, 
  Send, 
  Heart, 
  MessageSquare,
  User,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CommentsModal = ({ isOpen, postId, onClose, onCommentAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for post:', postId);
      
      // Fetch main comments (not replies)
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      console.log('Comments query result:', { data, error });

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Found comments:', data.length);
        
        // Fetch profiles for all comments
        const userIds = [...new Set(data.map(comment => comment.user_id).filter(Boolean))];
        console.log('User IDs for profiles:', userIds);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', userIds);

        console.log('Profiles query result:', { profiles, profilesError });

        if (profilesError) {
          console.error('Error fetching comment profiles:', profilesError);
        } else {
          const profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});

          // Fetch replies for each comment
          const commentsWithReplies = await Promise.all(
            data.map(async (comment) => {
              // Fetch replies for this comment
              const { data: replies, error: repliesError } = await supabase
                .from('comments')
                .select('*')
                .eq('parent_comment_id', comment.id)
                .order('created_at', { ascending: true });

              if (repliesError) {
                console.error('Error fetching replies:', repliesError);
                return { ...comment, profiles: profilesMap[comment.user_id] || null, replies: [] };
              }

              // Add profile data to replies
              const repliesWithProfiles = replies.map(reply => ({
                ...reply,
                profiles: profilesMap[reply.user_id] || null
              }));

              return {
                ...comment,
                profiles: profilesMap[comment.user_id] || null,
                replies: repliesWithProfiles || []
              };
            })
          );

          console.log('Comments with profiles and replies:', commentsWithReplies);

          // Fetch comment likes for current user
          if (user) {
            const { data: userLikes, error: likesError } = await supabase
              .from('comment_likes')
              .select('comment_id')
              .eq('user_id', user.id);

            if (!likesError && userLikes) {
              const likedCommentIds = new Set(userLikes.map(like => like.comment_id));
              commentsWithReplies.forEach(comment => {
                comment.isLiked = likedCommentIds.has(comment.id);
              });
            }
          }

          setComments(commentsWithReplies);
        }
      } else {
        console.log('No comments found for post:', postId);
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to comment.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch profile data for the new comment
      if (data && data.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .eq('id', data.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile for new comment:', profileError);
        } else {
          data.profiles = profileData;
        }
      }

      setNewComment('');
      
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully.",
      });

      // Refresh comments to show the new comment
      fetchComments();
      
      // Update the post's comment count in the parent component
      if (onCommentAdded) {
        onCommentAdded(postId);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like comments.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if user already liked this comment
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      if (existingLike) {
        // User already liked, so unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
        
        toast({
          title: "Unliked!",
          description: "Comment unliked successfully.",
        });
      } else {
        // User hasn't liked, so like
        await supabase
          .from('comment_likes')
          .insert({ user_id: user.id, comment_id: commentId });
        
        toast({
          title: "Liked!",
          description: "Comment liked successfully.",
        });
      }
      
      // Refresh comments to update counts
      fetchComments();
      
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to reply.",
        variant: "destructive"
      });
      return;
    }

    if (!replyContent.trim() || !replyingTo) return;

    setSubmittingReply(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_comment_id: replyingTo
        })
        .select('*')
        .single();

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      
      toast({
        title: "Reply posted!",
        description: "Your reply has been added successfully.",
      });

      // Refresh comments to show the new reply
      fetchComments();
      
      // Update the post's comment count in the parent component
      if (onCommentAdded) {
        onCommentAdded(postId);
      }
      
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const startReply = (commentId) => {
    setReplyingTo(commentId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-16"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-2xl w-full max-w-md mx-auto max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Comments ({comments.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No comments yet</p>
                  <p className="text-sm text-gray-400">Be the first to share your thoughts!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex space-x-3"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {comment.profiles?.full_name || comment.profiles?.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center space-x-1 text-xs transition-colors ${
                              comment.isLiked 
                                ? 'text-red-500' 
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes_count || 0}</span>
                          </button>
                          <button 
                            onClick={() => startReply(comment.id)}
                            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Reply</span>
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <form onSubmit={handleReply} className="flex space-x-2">
                              <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 text-sm"
                                disabled={submittingReply}
                              />
                              <Button
                                type="submit"
                                size="sm"
                                disabled={!replyContent.trim() || submittingReply}
                                className="px-3"
                              >
                                {submittingReply ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelReply}
                                className="px-3"
                              >
                                Cancel
                              </Button>
                            </form>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="ml-6 flex space-x-3">
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  <AvatarImage src={reply.profiles?.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {reply.profiles?.full_name?.charAt(0) || reply.profiles?.username?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-100 rounded-lg p-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-xs text-gray-900">
                                        {reply.profiles?.full_name || reply.profiles?.username}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 pb-6 border-t border-gray-200">
              <form onSubmit={handleSubmitComment} className="flex space-x-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                  disabled={submitting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || submitting}
                  className="px-4"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommentsModal;