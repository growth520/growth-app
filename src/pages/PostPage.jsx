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

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    supabase
      .from('posts')
      .select('*, profiles:user_id ( id, full_name, avatar_url ), likes ( user_id ), comments ( id, user_id, parent_comment_id, content, profiles:user_id(full_name, avatar_url) )')
      .eq('id', postId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
        setLoading(false);
      });
  }, [postId]);

  const handleLike = async (postId) => {
    if (!post) return;
    const isLiked = post.likes.some(l => l.user_id === currentUser.id);
    if (isLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUser.id });
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
    }
    // Optimistic update
    setPost(p => ({
      ...p,
      likes: isLiked
        ? p.likes.filter(l => l.user_id !== currentUser.id)
        : [...p.likes, { user_id: currentUser.id }],
    }));
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
        <PostCard post={post} currentUser={currentUser} onLike={handleLike} onShare={handleShare} onOpenComments={handleOpenComments} />
        <CommentsModal
          isOpen={showComments}
          setIsOpen={setShowComments}
          post={post}
          currentUser={currentUser}
          onCommentPosted={() => {
            // Refetch post to update comments
            supabase
              .from('posts')
              .select('*, profiles:user_id ( id, full_name, avatar_url ), likes ( user_id ), comments ( id, user_id, parent_comment_id, content, profiles:user_id(full_name, avatar_url) )')
              .eq('id', postId)
              .single()
              .then(({ data }) => setPost(data));
          }}
        />
      </div>
    </div>
  );
};

export default PostPage;