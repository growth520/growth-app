import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, CornerUpRight, BellOff, Bell, Users, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user } = useAuth();
  const { updateLastViewedNotifications } = useData();

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_user_notifications', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    updateLastViewedNotifications();
  }, [fetchNotifications, updateLastViewedNotifications]);

  useEffect(() => {
    if (!user) return;

    const handleInserts = (payload) => {
        // Refetch notifications when new activity occurs
        fetchNotifications();
    };

    const likesChannel = supabase
      .channel('public:likes:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, handleInserts)
      .subscribe();

    const commentsChannel = supabase
      .channel('public:comments:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, handleInserts)
      .subscribe();

    const followsChannel = supabase
      .channel('public:follows:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows' }, handleInserts)
      .subscribe();

    const notificationsChannel = supabase
      .channel('public:notifications:realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleInserts)
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(followsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, fetchNotifications]);

  const renderNotificationContent = (notif) => {
    switch (notif.type) {
      case 'like':
        return (
          <>
            <span className="font-bold text-forest-green">{notif.actor_name}</span>
            <span> liked your post.</span>
          </>
        );
      case 'comment':
        return (
          <>
            <span className="font-bold text-forest-green">{notif.actor_name}</span>
            <span> commented on your post:</span>
          </>
        );
      case 'reply':
        return (
          <>
            <span className="font-bold text-forest-green">{notif.actor_name}</span>
            <span> replied to your comment:</span>
          </>
        );
      case 'follow':
        return (
          <>
            <span className="font-bold text-forest-green">{notif.actor_name}</span>
            <span> started following you.</span>
          </>
        );
      default:
        return null;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500/20" />;
      case 'reply':
        return <CornerUpRight className="w-4 h-4 text-leaf-green" />;
      case 'follow':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const handleViewPost = async (postId) => {
    if (!postId) return;
    
    setPostLoading(true);
    setShowPostModal(true);
    
    try {
      // First fetch the post data
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        setSelectedPost(null);
        return;
      }

      // Then fetch the user profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', postData.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Still show the post even if profile fetch fails
        setSelectedPost({
          ...postData,
          profiles: null
        });
      } else {
        setSelectedPost({
          ...postData,
          profiles: profileData
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setSelectedPost(null);
    } finally {
      setPostLoading(false);
    }
  };

  const closePostModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const handleViewComments = async (postId) => {
    if (!postId) return;
    
    setCommentsLoading(true);
    setShowCommentsModal(true);
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setComments([]);
  };

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray">
      <div className="container mx-auto px-4 pt-8 pb-24 md:pt-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-leaf-green" />
            <h1 className="text-4xl font-bold text-forest-green">Notifications</h1>
          </div>
          <p className="text-charcoal-gray/80 text-lg">Updates on your community interactions.</p>
        </motion.div>

        <div className="space-y-4">
          <AnimatePresence>
            {loading ? (
              <div className="text-center py-12">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Card className="inline-block p-8 bg-white/50">
                  <BellOff className="w-16 h-16 text-charcoal-gray/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-forest-green mb-2">All caught up!</h3>
                  <p className="text-charcoal-gray/70">You have no new notifications.</p>
                </Card>
              </motion.div>
            ) : (
              notifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-effect hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-white">
                          <AvatarImage src={notif.actor_avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-warm-orange to-red-400 text-white">
                            {notif.actor_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          {getIcon(notif.type)}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <p className="text-charcoal-gray/90">
                          {renderNotificationContent(notif)}
                        </p>
                        {notif.content && (
                          <p className="text-sm text-charcoal-gray/70 bg-black/5 p-2 rounded-md mt-1 italic">
                            "{notif.content}"
                          </p>
                        )}
                        <p className="text-xs text-charcoal-gray/50 mt-1">{formatTimeAgo(notif.notification_timestamp)}</p>
                      </div>
                      {notif.post_id ? (
                        <div 
                          onClick={() => handleViewPost(notif.post_id)}
                          className="cursor-pointer hover:scale-105 transition-transform"
                        >
                          {notif.post_photo ? (
                            <div className="relative">
                              <img 
                                src={notif.post_photo} 
                                alt="Post preview" 
                                className="w-16 h-16 object-cover rounded-md" 
                              />
                              <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-forest-green to-leaf-green rounded-md flex items-center justify-center text-center text-xs p-1 text-white font-medium hover:shadow-lg transition-shadow">
                              View Post &gt;
                            </div>
                          )}
                        </div>
                      ) : notif.type === 'follow' ? (
                        <div className="w-16 h-16 bg-purple-100 rounded-md flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-500" />
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-forest-green">Post Details</h3>
                <button
                  onClick={closePostModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-charcoal-gray" />
                </button>
              </div>

              {postLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green mx-auto"></div>
                  <p className="mt-2 text-charcoal-gray/70">Loading post...</p>
                </div>
              ) : selectedPost ? (
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedPost.profiles?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-forest-green to-leaf-green text-white">
                        {selectedPost.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-charcoal-gray">
                        {selectedPost.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-charcoal-gray/70">
                        {formatTimeAgo(selectedPost.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-forest-green">
                      {selectedPost.challenge_title || 'Challenge Completion'}
                    </h4>
                    
                    {selectedPost.reflection && (
                      <p className="text-charcoal-gray/90 leading-relaxed">
                        {selectedPost.reflection}
                      </p>
                    )}

                    {selectedPost.photo_url && (
                      <div className="rounded-lg overflow-hidden">
                        <img 
                          src={selectedPost.photo_url} 
                          alt="Post image" 
                          className="w-full h-auto max-h-96 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Post Stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <button 
                      className="flex items-center gap-1 text-charcoal-gray/70 hover:text-red-500 transition-colors"
                      onClick={() => {
                        // TODO: Implement like functionality
                        console.log('Like post:', selectedPost.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${selectedPost.likes_count > 0 ? 'text-red-500 fill-current' : ''}`} />
                      <span className="text-sm">{selectedPost.likes_count || 0}</span>
                    </button>
                    <button 
                      className="flex items-center gap-1 text-charcoal-gray/70 hover:text-blue-500 transition-colors"
                      onClick={() => handleViewComments(selectedPost.id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{selectedPost.comments_count || 0}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-charcoal-gray/70">Post not found or no longer available.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-forest-green">Comments</h3>
                <button
                  onClick={closeCommentsModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-charcoal-gray" />
                </button>
              </div>

              {commentsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green mx-auto"></div>
                  <p className="mt-2 text-charcoal-gray/70">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-charcoal-gray/70">No comments yet. Be the first to leave one!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-forest-green to-leaf-green text-white">
                            {comment.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-charcoal-gray">
                            {comment.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-charcoal-gray/70">
                            {formatTimeAgo(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-charcoal-gray/90">{comment.content}</p>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 mt-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-100 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={reply.profiles?.avatar_url} />
                                  <AvatarFallback className="bg-gradient-to-br from-forest-green to-leaf-green text-white">
                                    {reply.profiles?.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-charcoal-gray">
                                    {reply.profiles?.full_name || 'Unknown User'}
                                  </p>
                                  <p className="text-sm text-charcoal-gray/70">
                                    {formatTimeAgo(reply.created_at)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-charcoal-gray/90">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;