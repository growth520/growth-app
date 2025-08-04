import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import PostCard from '@/components/community/PostCard';
import CommentsModal from '@/components/community/CommentsModal';

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('growthUser') || '{}');
};

const PostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const currentUser = getCurrentUser();

  const fetchPost = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, likes ( user_id ), comments ( id, user_id, parent_comment_id, content )')
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Fetch profile data separately
      if (data && data.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', data.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          data.profiles = profileData;
        }
      }

      // Fetch comment profiles separately
      if (data && data.comments && data.comments.length > 0) {
        const commentUserIds = [...new Set(data.comments.map(comment => comment.user_id).filter(Boolean))];
        const { data: commentProfiles, error: commentProfilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', commentUserIds);

        if (commentProfilesError) {
          console.error('Error fetching comment profiles:', commentProfilesError);
        } else {
          const profilesMap = commentProfiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
          
          data.comments = data.comments.map(comment => ({
            ...comment,
            profiles: profilesMap[comment.user_id] || null
          }));
        }
      }

      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      setNotFound(true); // Changed from setError to setNotFound
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const handleLike = async (postId) => {
    if (!post || !currentUser?.id) return;
    
    const isLiked = post.likes.some(l => l.user_id === currentUser.id);
    
    try {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
        if (error) throw error;
      }
      
      // Optimistic update only after successful database operation
      setPost(p => ({
        ...p,
        likes: isLiked
          ? p.likes.filter(l => l.user_id !== currentUser.id)
          : [...p.likes, { user_id: currentUser.id }],
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      // You might want to show a toast notification here if you have access to it
    }
  };

  const handleShare = (post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const handleOpenComments = () => {
    setShowComments(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-sun-beige">Loading post...</div>;
  }
  if (notFound || !post) {
    return <div className="min-h-screen flex items-center justify-center bg-sun-beige text-center">
      <div>
        <div className="text-2xl font-bold mb-2">Post Not Found</div>
        <div className="text-charcoal-gray/70">This post may have been moved or deleted.</div>
      </div>
    </div>;
  }
  return (
    <div className="min-h-screen bg-sun-beige flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto">
        <PostCard 
          post={post} 
          isLiked={post.likes?.some(l => l.user_id === currentUser?.id) || false}
          onLike={handleLike} 
          onComment={handleOpenComments}
          onShare={handleShare} 
          onViewComments={handleOpenComments}
        />
        <CommentsModal
          isOpen={showComments}
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => {
            // Refetch post to update comments
            fetchPost(); // Call fetchPost to refetch and update post
          }}
        />
      </div>
    </div>
  );
};

export default PostPage;