import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

const formatTimeAgo = (timestamp) => {
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

const Comment = ({ comment, onReply, currentUser }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);

  const fetchReplies = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_comment_id', comment.id)
      .order('created_at', { ascending: true });
    
    if (!error && data && data.length > 0) {
      // Fetch profiles separately for replies
      const userIds = [...new Set(data.map(reply => reply.user_id).filter(Boolean))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching reply profiles:', profilesError);
        setReplies(data);
      } else {
        const profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        // Combine replies with profile data
        const repliesWithProfiles = data.map(reply => ({
          ...reply,
          profiles: profilesMap[reply.user_id] || null
        }));

        setReplies(repliesWithProfiles);
      }
    } else if (!error) {
      setReplies(data || []);
    }
  }, [comment.id]);

  useEffect(() => {
    if (showReplies) {
      fetchReplies();
    }
  }, [showReplies, fetchReplies]);

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
      setShowReplies(true);
      setTimeout(fetchReplies, 500);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback>{comment.profiles.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="bg-gray-100 rounded-lg p-2 flex-1">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-sm text-forest-green">{comment.profiles.full_name}</span>
            <span className="text-xs text-charcoal-gray/50">{formatTimeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-charcoal-gray/90">{comment.content}</p>
        </div>
      </div>
      <div className="ml-11 mt-1 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-xs h-6 px-1" onClick={() => setShowReplyInput(!showReplyInput)}>Reply</Button>
        <Button variant="ghost" size="sm" className="text-xs h-6 px-1" onClick={() => setShowReplies(!showReplies)}>
          {showReplies ? 'Hide' : 'View'} replies
        </Button>
      </div>
      {showReplyInput && (
        <div className="ml-11 mt-2 flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
            <AvatarFallback>{currentUser?.user_metadata?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Replying to ${comment.profiles.full_name}...`} className="h-8 text-sm" />
                        <Button 
                size="sm" 
                className="h-8" 
                onClick={handleReplySubmit}
                aria-label="Send reply"
                title="Send reply"
              >
                <Send className="w-4 h-4" />
              </Button>
        </div>
      )}
      {showReplies && replies.length > 0 && (
        <div className="ml-8 mt-2 pl-4 border-l-2 border-gray-200 space-y-3">
          {replies.map(reply => <Comment key={reply.id} comment={reply} onReply={onReply} currentUser={currentUser} />)}
        </div>
      )}
    </div>
  );
};

export default Comment;