import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import Comment from './Comment';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CommentsModal = ({ isOpen, onClose, post }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    }
  }, [isOpen, post]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (full_name, avatar_url),
        replies:comments!parent_comment_id (
          *,
          profiles!comments_user_id_fkey (full_name, avatar_url)
        )
      `)
      .eq('post_id', post.id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment,
      parent_comment_id: null
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    } else {
      setNewComment('');
      fetchComments();
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim() || !user) return;

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: replyText,
      parent_comment_id: parentId
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to post reply', variant: 'destructive' });
    } else {
      setReplyText('');
      setReplyTo(null);
      fetchComments();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-sun-beige p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-forest-green">Comments on {post.profiles.full_name}'s post</DialogTitle>
          <DialogDescription>{post.challenge_title}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          {comments.length > 0 ? (
            comments.map(comment => <Comment key={comment.id} comment={comment} onReply={handleReply} currentUser={user} />)
          ) : (
            <p className="text-center text-charcoal-gray/70 py-8">No comments yet. Be the first!</p>
          )}
        </div>
        <div className="p-6 bg-white/50 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1"/>
            <Button size="icon" onClick={handleComment} disabled={!newComment}><Send className="w-4 h-4"/></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;