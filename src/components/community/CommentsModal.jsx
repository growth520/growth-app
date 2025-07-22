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

const CommentsModal = ({ isOpen, setIsOpen, post, onCommentPosted }) => {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const { toast } = useToast();
  const { user, session } = useAuth();

  useEffect(() => {
    console.log('[DEBUG] useAuth user:', user);
    console.log('[DEBUG] useAuth session:', session);
  }, [user, session]);

  const fetchComments = useCallback(async () => {
    if (!post) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:user_id(*)')
      .eq('post_id', post.id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: "Error fetching comments", variant: "destructive" });
    } else {
      setComments(data);
    }
  }, [post, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;
    console.log("[DEBUG] Posting comment with user_id:", user?.id, "user:", user);
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: Number(post.id), // Ensure post_id is a number
        user_id: user?.id,  // UUID string
        content: commentInput
      });
    
    if (error) {
      toast({ title: "Error posting comment", variant: "destructive" });
    } else {
      setCommentInput('');
      fetchComments();
      onCommentPosted();
    }
  };

  const handleReply = async (parentId, content) => {
    console.log("[DEBUG] Posting reply with user_id:", user?.id, "user:", user);
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: Number(post.id), // Ensure post_id is a number
        user_id: user?.id,  // UUID string
        parent_comment_id: Number(parentId), // Ensure parent_comment_id is a number
        content
      });
    
    if (error) {
      toast({ title: "Error posting reply", variant: "destructive" });
    } else {
      fetchComments();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <Input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Write a comment..." className="flex-1"/>
            <Button size="icon" onClick={handlePostComment} disabled={!commentInput}><Send className="w-4 h-4"/></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;