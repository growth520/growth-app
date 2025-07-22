import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const RotatingComment = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('content, profiles:user_id(full_name, avatar_url)')
        .eq('post_id', postId)
        .limit(5);
      if (!error) setComments(data);
    };
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (comments.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % comments.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [comments.length]);

  if (comments.length === 0) return null;

  const comment = comments[currentIndex];

  return (
    <div className="flex items-center gap-2 text-sm text-charcoal-gray/80">
      <Avatar className="w-6 h-6">
        <AvatarImage src={comment.profiles.avatar_url} />
        <AvatarFallback>{comment.profiles.full_name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <p>
        <span className="font-semibold text-forest-green">{comment.profiles.full_name}</span>: {comment.content.substring(0, 40)}{comment.content.length > 40 ? '...' : ''}
      </p>
    </div>
  );
};

export default RotatingComment;