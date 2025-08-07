import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PostCard from '@/components/community/PostCard';
import CommentsModal from '@/components/community/CommentsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Share2, 
  Lock,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PostPage = () => {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [userInteractions, setUserInteractions] = useState({ likes: [], comments: [] });

  // Fetch post data with privacy check
  const fetchPost = async () => {
    if (!postId) {
      setNotFound(true);
      return;
    }
    
    setLoading(true);
    try {
      // First, try to fetch the post with basic info
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          challenge_id,
          challenge_title,
          reflection,
          photo_url,
          category,
          created_at,
          privacy,
          share_to_community,
          is_public,
          likes_count,
          comments_count,
          shares_count,
          views_count
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        setNotFound(true);
        return;
      }

      // Check if post is public (fallback to just privacy check if share_to_community doesn't exist)
      const isPublic = data.privacy === 'public' && (data.share_to_community !== false || data.share_to_community === undefined);
      
      if (!isPublic) {
        // Check if user is authenticated and is the owner
        if (!user || user.id !== data.user_id) {
          setIsPrivate(true);
          setNotFound(false);
          return;
        }
      }

      // Track view and share click if this is a public post accessed via shared link
      if (isPublic && !user) {
        // Only track view if user is not authenticated (external visitor)
        await trackPostView(postId);
        await trackShareClick(postId);
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('id', data.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        data.profiles = profileData;
      }

      // Fetch likes and comments if user is authenticated
      if (user) {
        const [likesResult, commentsResult] = await Promise.all([
          supabase
            .from('likes')
            .select('user_id')
            .eq('post_id', postId),
          supabase
            .from('comments')
            .select('id, user_id, content, created_at, parent_comment_id')
            .eq('post_id', postId)
            .is('parent_comment_id', null)
            .order('created_at', { ascending: false })
        ]);

        if (!likesResult.error) {
          data.likes = likesResult.data || [];
        }

        if (!commentsResult.error) {
          data.comments = commentsResult.data || [];
        }

        // Get user's interactions
        const [userLikesResult, userCommentsResult] = await Promise.all([
          supabase
            .from('likes')
            .select('user_id')
            .eq('post_id', postId)
            .eq('user_id', user.id),
          supabase
            .from('comments')
            .select('id, user_id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
        ]);

        if (!userLikesResult.error) {
          setUserInteractions(prev => ({
            ...prev,
            likes: userLikesResult.data || []
          }));
        }

        if (!userCommentsResult.error) {
          setUserInteractions(prev => ({
            ...prev,
            comments: userCommentsResult.data || []
          }));
        }
      }

      setPost(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      setNotFound(true);
      setLoading(false);
    }
  };

  // Track post view (only for external visitors)
  const trackPostView = async (postId) => {
    try {
      // Get visitor's IP or use a simple identifier
      const visitorId = user?.id || 'anonymous';
      
      // Check if this visitor has already viewed this post recently (within 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: existingView } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)
        .gte('viewed_at', yesterday.toISOString())
        .single();

      // Only increment view count if this is a new view
      if (!existingView) {
        // Insert view record
        await supabase
          .from('post_views')
          .insert({
            post_id: postId,
            visitor_id: visitorId,
            viewed_at: new Date().toISOString()
          });

        // Update post views count
        await supabase
          .from('posts')
          .update({ 
            views_count: supabase.sql`views_count + 1` 
          })
          .eq('id', postId);
      }
    } catch (error) {
      console.error('Error tracking post view:', error);
    }
  };

  // Track share click (when someone visits via shared link)
  const trackShareClick = async (postId) => {
    try {
      // Get visitor's IP or use a simple identifier
      const visitorId = user?.id || 'anonymous';
      
      // Check if this visitor has already clicked this shared link recently (within 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: existingClick } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', postId)
        .eq('visitor_id', visitorId)
        .gte('viewed_at', yesterday.toISOString())
        .single();

      // Only increment share count if this is a new click
      if (!existingClick) {
        // Update post shares count
        await supabase
          .from('posts')
          .update({ 
            shares_count: supabase.sql`shares_count + 1` 
          })
          .eq('id', postId);
      }
    } catch (error) {
      console.error('Error tracking share click:', error);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive"
      });
      return;
    }

    if (!post) return;
    
    const isLiked = userInteractions.likes.includes(post.id);
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: post.id, user_id: user.id });
        
        if (error) throw error;
        
        setUserInteractions(prev => ({
          ...prev,
          likes: prev.likes.filter(id => id !== post.id)
        }));
        
        setPost(prev => ({
          ...prev,
          likes_count: Math.max(0, (prev.likes_count || 0) - 1)
        }));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id });
        
        if (error) throw error;
        
        setUserInteractions(prev => ({
          ...prev,
          likes: [...prev.likes, post.id]
        }));
        
        setPost(prev => ({
          ...prev,
          likes_count: (prev.likes_count || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Post link copied to clipboard",
    });
  };

  const handleOpenComments = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view comments",
        variant: "destructive"
      });
      return;
    }
    setShowComments(true);
  };

  const handleSignIn = () => {
    navigate('/login', { state: { returnTo: `/post/${postId}` } });
  };

  const handleSignUp = () => {
    navigate('/login', { state: { returnTo: `/post/${postId}`, signUp: true } });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto mb-4"></div>
          <div className="text-charcoal-gray">Loading post...</div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-charcoal-gray mb-2">Post Not Found</h1>
          <p className="text-charcoal-gray/70 mb-6">
            This post may have been moved or deleted.
          </p>
          <Button onClick={() => navigate('/community')} className="bg-forest-green hover:bg-forest-green/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  // Private post state
  if (isPrivate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-charcoal-gray mb-2">This post is private</h1>
          <p className="text-charcoal-gray/70 mb-6">
            This post is private or has been removed.
          </p>
          <Button onClick={() => navigate('/community')} className="bg-forest-green hover:bg-forest-green/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  // Post not found or not public
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sun-beige">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-charcoal-gray mb-2">Post Not Found</h1>
          <p className="text-charcoal-gray/70 mb-6">
            This post is private or has been removed.
          </p>
          <Button onClick={() => navigate('/community')} className="bg-forest-green hover:bg-forest-green/90">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  // Generate SEO content
  const postTitle = post.challenge_title || 'Growth Journey';
  const postDescription = post.reflection?.substring(0, 160) || 'Check out this growth journey post';
  const postImage = post.photo_url || '/images/welcome-bg.jpg';
  const postUrl = `${window.location.origin}/post/${post.id}`;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{postTitle} - GrowthApp</title>
        <meta name="description" content={postDescription} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={postTitle} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:image" content={postImage} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="GrowthApp" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postTitle} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:image" content={postImage} />
        
        {/* Additional Meta Tags */}
        <meta name="author" content={post.profiles?.full_name || 'GrowthApp User'} />
        <meta property="article:published_time" content={post.created_at} />
        <meta property="article:author" content={post.profiles?.full_name || 'GrowthApp User'} />
      </Helmet>

      <div className="min-h-screen bg-sun-beige">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/community')}
                className="text-charcoal-gray hover:text-forest-green"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Community
              </Button>
              
              {!user && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleSignIn}
                    className="text-charcoal-gray border-charcoal-gray hover:bg-charcoal-gray hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleSignUp}
                    className="bg-forest-green hover:bg-forest-green/90"
                  >
                    Join Growth
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Sign up banner for unauthenticated users */}
          {!user && (
            <div className="bg-gradient-to-r from-forest-green to-emerald-600 text-white rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold text-lg">💡 Join Growth to track your own journey</h3>
                    <p className="text-white/90 text-sm">Connect with others and share your growth journey</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleSignIn}
                    className="border-white text-white hover:bg-white hover:text-forest-green"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={handleSignUp}
                    className="bg-white text-forest-green hover:bg-white/90"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Post Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <PostCard 
              post={post} 
              isLiked={userInteractions.likes.includes(post.id)}
              onLike={handleLike} 
              onComment={handleOpenComments}
              onShare={handleShare} 
              onViewComments={handleOpenComments}
              showInteractions={!!user}
            />
          </div>

          {/* Interaction buttons for unauthenticated users */}
          {!user && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <p className="text-charcoal-gray/70 mb-4">
                  Sign in to like, comment, and interact with this post
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleSignIn}
                    className="border-charcoal-gray text-charcoal-gray hover:bg-charcoal-gray hover:text-white"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Sign in to Like
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignIn}
                    className="border-charcoal-gray text-charcoal-gray hover:bg-charcoal-gray hover:text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Sign in to Comment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="border-charcoal-gray text-charcoal-gray hover:bg-charcoal-gray hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comments Modal */}
          {user && (
            <CommentsModal
              isOpen={showComments}
              postId={post.id}
              onClose={() => setShowComments(false)}
              onCommentAdded={() => {
                fetchPost(); // Refetch post to update comments
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PostPage;