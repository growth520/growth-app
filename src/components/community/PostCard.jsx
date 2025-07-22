import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Maximize2, MoreVertical, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

const growthAreaEmojis = {
  Confidence: '💪',
  'Self-Worth': '💎',
  Mindfulness: '🧘',
  Communication: '🗣️',
  Resilience: '⚡',
  'Self-Control': '🎯',
  Discipline: '📚',
  Fitness: '🏋️',
  Purpose: '🌟',
  Humility: '🙏',
  Gratitude: '🙏',
};

const getCategoryIcon = (category) => growthAreaEmojis[category] || '🌟';

const getCategoryColor = (category) =>
  ({
    Confidence: 'bg-red-500/10 text-red-500',
    'Self-Worth': 'bg-purple-500/10 text-purple-500',
    Mindfulness: 'bg-indigo-500/10 text-indigo-500',
    Communication: 'bg-leaf-green/10 text-leaf-green',
    Resilience: 'bg-warm-orange/10 text-warm-orange',
    'Self-Control': 'bg-blue-500/10 text-blue-500',
    Discipline: 'bg-yellow-500/10 text-yellow-500',
    Fitness: 'bg-pink-500/10 text-pink-500',
    Purpose: 'bg-green-500/10 text-green-500',
    Humility: 'bg-gray-500/10 text-gray-500',
    Gratitude: 'bg-orange-500/10 text-orange-500',
  }[category] || 'bg-gray-500/10 text-gray-400');

const RepliesModal = ({ open, onClose, replies }) => (
  open ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-md mx-auto p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="font-bold text-lg mb-2">All Replies</div>
        {replies.length === 0 ? (
          <div className="text-charcoal-gray/60 italic">No replies yet — be the first to encourage 💬</div>
        ) : (
          replies.map(reply => (
            <div key={reply.id} className="mb-3 flex items-center gap-2">
              <span className="font-semibold">{reply.profiles?.full_name || 'User'}</span>
              <span className="text-charcoal-gray/50">{reply.content}</span>
            </div>
          ))
        )}
        <Button variant="outline" className="mt-2 w-full" onClick={onClose}>Close</Button>
      </div>
    </div>
  ) : null
);

const PostCard = ({ post, currentUser, onLike, onShare, onOpenComments, showDelete, onDelete }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [currentReplyIdx, setCurrentReplyIdx] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isLikedByCurrentUser = post.likes.some(like => like.user_id === currentUser?.id);
  const replies = post.comments.filter(c => c.parent_comment_id);
  const hasReplies = replies.length > 0;
  const navigate = useNavigate();

  // Rotate replies every 5 seconds
  useEffect(() => {
    if (!hasReplies) return;
    const interval = setInterval(() => {
      setCurrentReplyIdx(idx => (idx + 1) % replies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [replies.length, hasReplies]);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  return (
    <div className="w-full px-0 md:px-0 py-6 border-b border-black/10 bg-transparent">
      {/* Challenge Title */}
      <div className="font-bold text-lg text-forest-green mb-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span role="img" aria-label="challenge">🎯</span>
          Challenge: {post.challenge_title}
        </div>
        {showDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-charcoal-gray/50 hover:text-red-500 hover:bg-red-500/10 -mr-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Info */}
      <div className="flex items-center gap-2 text-xs text-charcoal-gray/60 px-4 mb-2">
        <Avatar className="w-6 h-6 cursor-pointer" onClick={() => navigate(`/profile/${post.profiles.id}`)}>
          <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.full_name} />
          <AvatarFallback className="bg-gradient-to-r from-forest-green to-leaf-green text-white">
            {post.profiles.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="cursor-pointer font-semibold" onClick={() => navigate(`/profile/${post.profiles.id}`)}>{post.profiles.full_name}</span>
        <span>•</span>
        <span>{formatTimeAgo(post.created_at)}</span>
        <span>•</span>
        <Badge className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getCategoryColor(post.category)}`}>
          <span>{getCategoryIcon(post.category)}</span> {post.category.replace('-', ' ')}
        </Badge>
      </div>
      {/* Image (if any) */}
      {post.photo_url && (
        <div className="relative w-full flex justify-center mb-3">
          <img
            src={post.photo_url}
            alt="reflection"
            className={`rounded-lg object-cover w-full max-h-[250px] transition-all duration-300 cursor-pointer ${showFullImage ? 'max-h-[90vh] z-50 fixed top-0 left-0 right-0 mx-auto bg-black/90' : ''}`}
            style={{ maxWidth: showFullImage ? '100vw' : '100%', height: 'auto' }}
            onClick={() => setShowFullImage(!showFullImage)}
          />
          {!showFullImage && (
            <button
              className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1 shadow"
              onClick={() => setShowFullImage(true)}
              aria-label="Expand image"
            >
              <Maximize2 className="w-5 h-5 text-charcoal-gray" />
            </button>
          )}
          {showFullImage && (
            <button
              className="fixed top-4 right-4 z-50 bg-white/90 rounded-full p-2 shadow-lg"
              onClick={() => setShowFullImage(false)}
              aria-label="Close image"
            >
              ✕
            </button>
          )}
        </div>
      )}
      {/* Reflection Section */}
      <div className="px-4 pt-2 pb-2">
        <div className="font-semibold text-charcoal-gray/80 mb-1">Reflection:</div>
        <div className="text-base text-charcoal-gray/90 min-h-[32px]">
          {post.reflection && post.reflection.trim() ? (
            <span>{post.reflection}</span>
          ) : (
            <span className="italic text-charcoal-gray/50">No reflection added — just showing up 💪</span>
          )}
        </div>
      </div>
      {/* Reactions Row */}
      <div className="flex items-center gap-8 px-4 pt-2 pb-1 text-charcoal-gray/70 border-t border-black/10 mt-2">
        <Button onClick={() => onLike(post.id)} variant="ghost" size="sm" className={`flex items-center gap-1 text-base px-2 py-1 hover:text-red-500 hover:bg-red-500/10 ${isLikedByCurrentUser ? 'text-red-500' : ''}`} aria-label="Like">
          <Heart className={`w-5 h-5 ${isLikedByCurrentUser ? 'fill-current' : ''}`} />
          <span className="ml-1">Like</span>
          <span className="ml-1">{post.likes.length}</span>
        </Button>
        <Button onClick={() => onOpenComments(post)} variant="ghost" size="sm" className="flex items-center gap-1 text-base px-2 py-1 hover:text-blue-500 hover:bg-blue-500/10" aria-label="Comments">
          <MessageCircle className="w-5 h-5" />
          <span className="ml-1">Comment</span>
          <span className="ml-1">{post.comments.length}</span>
        </Button>
        <Button onClick={() => onShare(post)} variant="ghost" size="sm" className="flex items-center gap-1 text-base px-2 py-1 hover:text-leaf-green hover:bg-leaf-green/10" aria-label="Share">
          <Share2 className="w-5 h-5" />
          <span className="ml-1">Share</span>
        </Button>
      </div>
      {/* Replies Section */}
      <div className="px-4 pt-2 pb-1">
        {hasReplies ? (
          <div
            className="rounded-lg bg-forest-green/5 px-3 py-2 mb-1 transition-opacity duration-500 animate-fade-in cursor-pointer flex items-center gap-2"
            onClick={() => setShowRepliesModal(true)}
            tabIndex={0}
            role="button"
            aria-label="View all replies"
          >
            <span className="font-semibold">
              {(() => {
                const name = replies[currentReplyIdx]?.profiles?.full_name || 'User';
                return name.length > 12 ? name.slice(0, 12) + '…' : name;
              })()}
            </span>
            <span className="ml-2 text-charcoal-gray/80 truncate">{replies[currentReplyIdx]?.content}</span>
          </div>
        ) : (
          <div className="italic text-charcoal-gray/50">No replies yet — be the first to encourage 💬</div>
        )}
        <RepliesModal open={showRepliesModal} onClose={() => setShowRepliesModal(false)} replies={replies} />
      </div>
    </div>
  );
};

export default PostCard;

// Add fade-in animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fade-in 0.5s; }
`;
document.head.appendChild(style);