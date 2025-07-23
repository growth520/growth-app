import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Users, Sparkles, Filter, ThumbsUp, MessageSquare, Globe, User, Heart } from 'lucide-react';
import PostCard from '@/components/community/PostCard';
import CommentsModal from '@/components/community/CommentsModal';
import CommunityFilters from '@/components/community/CommunityFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

function UserSearchAndFollow({ query }) {
  const { user } = useAuth();
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [following, setFollowing] = React.useState([]);

  // Fetch who the user is following
  React.useEffect(() => {
    if (!user) return;
    supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', user.id)
      .then(({ data }) => {
        setFollowing(data ? data.map(f => f.followed_id) : []);
      });
  }, [user]);

  // Search users when query changes
  React.useEffect(() => {
    if (!query || !query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, full_name, email, username, avatar_url')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10)
      .then(({ data, error }) => {
        if (!error) setResults(data);
        setLoading(false);
      });
  }, [query, user]);

  // Follow/unfollow logic
  const handleFollow = async (targetId, isFollowing) => {
    if (isFollowing) {
      // Unfollow
      await supabase.from('follows').delete().match({ follower_id: user.id, followed_id: targetId });
      setFollowing(following.filter(id => id !== targetId));
    } else {
      // Follow
      await supabase.from('follows').insert({ follower_id: user.id, followed_id: targetId });
      setFollowing([...following, targetId]);
    }
  };

  // Only render if there are results
  if (!results.length) return null;

  return (
    <div className="mb-8 p-4 bg-white/60 rounded-xl shadow flex flex-col gap-2">
      {results.length > 0 && (
        <div className="mt-2 divide-y">
          {results.map(profile => {
            const isFollowing = following.includes(profile.id);
            return (
              <div key={profile.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-leaf-green text-white flex items-center justify-center font-bold">
                      {profile.full_name ? profile.full_name[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-charcoal-gray">{profile.full_name}</div>
                    <div className="text-xs text-charcoal-gray/60">{profile.username || profile.email}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isFollowing ? 'outline' : 'default'}
                  className={isFollowing ? 'border-leaf-green text-leaf-green' : 'bg-leaf-green text-white'}
                  onClick={() => handleFollow(profile.id, isFollowing)}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserAndPostSearch({ query, currentUserId, following, onUserClick, onPostClick }) {
  const [userResults, setUserResults] = React.useState([]);
  const [postResults, setPostResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('users'); // 'users' or 'posts'

  React.useEffect(() => {
    if (!query || !query.trim()) {
      setUserResults([]);
      setPostResults([]);
      return;
    }
    setLoading(true);
    // Fuzzy search users
    const userPromise = supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, assessment_results')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20);
    // Fuzzy search posts
    const postPromise = supabase
      .from('posts')
      .select('id, reflection, challenge_title, created_at, category, profiles:user_id(full_name, avatar_url, username)')
      .ilike('reflection', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    Promise.all([userPromise, postPromise]).then(([userRes, postRes]) => {
      setUserResults(userRes.data || []);
      setPostResults(postRes.data || []);
      setLoading(false);
    });
  }, [query, currentUserId]);

  if (!query || !query.trim()) return null;

  return (
    <div className="mb-8 p-4 bg-white/60 rounded-xl shadow flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        <button
          className={`flex-1 py-2 rounded-t-lg font-semibold ${activeTab === 'users' ? 'bg-forest-green text-white' : 'bg-gray-100 text-charcoal-gray'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`flex-1 py-2 rounded-t-lg font-semibold ${activeTab === 'posts' ? 'bg-forest-green text-white' : 'bg-gray-100 text-charcoal-gray'}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
      </div>
      {loading && <div className="text-center text-charcoal-gray/60">Searching...</div>}
      {!loading && activeTab === 'users' && (
        <>
          {userResults.length === 0 ? (
            <div className="text-center text-charcoal-gray/60 italic">No users found.</div>
          ) : (
            <div className="divide-y">
              {userResults.map(profile => (
                <div key={profile.id} className="flex items-center gap-3 py-3 cursor-pointer hover:bg-leaf-green/10 rounded-lg px-2" onClick={() => onUserClick(profile)}>
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <div className="font-semibold text-charcoal-gray">{profile.full_name}</div>
                    {profile.username && <div className="text-xs text-charcoal-gray/60">@{profile.username}</div>}
                    <div className="flex gap-2 mt-1">
                      {profile.assessment_results?.userSelection && (
                        <span className="bg-leaf-green/10 text-leaf-green text-xs px-2 py-0.5 rounded-full">{profile.assessment_results.userSelection}</span>
                      )}
                      {profile.streak && (
                        <span className="bg-warm-orange/10 text-warm-orange text-xs px-2 py-0.5 rounded-full">🔥 {profile.streak}d</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {!loading && activeTab === 'posts' && (
        <>
          {postResults.length === 0 ? (
            <div className="text-center text-charcoal-gray/60 italic">No posts found.</div>
          ) : (
            <div className="divide-y">
              {postResults.map(post => (
                <div key={post.id} className="py-3 cursor-pointer hover:bg-leaf-green/10 rounded-lg px-2" onClick={() => onPostClick(post)}>
                  <div className="text-charcoal-gray/90 font-medium truncate">{post.reflection?.slice(0, 60) || 'No reflection'}</div>
                  <div className="text-xs text-charcoal-gray/60 mt-1 flex items-center gap-2">
                    <img src={post.profiles?.avatar_url} alt={post.profiles?.full_name} className="w-5 h-5 rounded-full" />
                    <span>{post.profiles?.full_name}</span>
                    {post.profiles?.username && <span className="ml-1 text-charcoal-gray/40">@{post.profiles.username}</span>}
                    <span className="ml-2 italic">{post.category}</span>
                    <span className="ml-2">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending' },
  { key: 'growth-like-me', label: 'Growth Like Me' },
  { key: 'new', label: 'New' },
  { key: 'uplifting', label: 'Most Uplifting' },
];
const LOCATION_OPTIONS = [
  { key: 'my-area', label: 'My Area', icon: <User className="w-4 h-4 mr-2" /> },
  { key: 'all', label: 'All', icon: <Globe className="w-4 h-4 mr-2" /> },
  { key: 'friends', label: 'Friends', icon: <Users className="w-4 h-4 mr-2" /> },
];
const VIEW_OPTIONS = [
  { key: 'all-posts', icon: <Users className="w-5 h-5" />, label: 'All Posts' },
  { key: 'liked-posts', icon: <Heart className="w-5 h-5" />, label: 'Liked' },
  { key: 'my-comments', icon: <MessageSquare className="w-5 h-5" />, label: 'My Comments' },
];

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = React.useState('my-area');
  const [feedMode, setFeedMode] = useState('trending');
  const [view, setView] = useState('all-posts');
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const { user } = useAuth();
  const { profile, progress } = useData();
  const { toast } = useToast();
  const [following, setFollowing] = React.useState([]);
  const [interactedUserIds, setInteractedUserIds] = useState([]);
  const [rankingCache, setRankingCache] = useState({}); // Store ranking_score for infinite scroll
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = React.useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(null); // 'location' | 'sort' | 'view' | null
  const navigate = useNavigate();

  // Helper to show popup for 2 seconds
  const triggerFilterPopup = (type, label) => {
    setShowFilterPopup(label);
    setTimeout(() => setShowFilterPopup(null), 2000);
  };

  // Fetch users the current user has interacted with (liked/commented)
  useEffect(() => {
    if (!user) return;
    const fetchInteractions = async () => {
      const liked = await supabase.from('likes').select('post_id, user_id').eq('user_id', user.id);
      const commented = await supabase.from('comments').select('post_id, user_id').eq('user_id', user.id);
      const postIds = [
        ...(liked.data ? liked.data.map(l => l.post_id) : []),
        ...(commented.data ? commented.data.map(c => c.post_id) : [])
      ];
      if (postIds.length === 0) {
        setInteractedUserIds([]);
        return;
      }
      // Get the user_ids of those posts
      const { data: postsData } = await supabase.from('posts').select('user_id').in('id', postIds);
      setInteractedUserIds(postsData ? [...new Set(postsData.map(p => p.user_id))] : []);
    };
    fetchInteractions();
  }, [user]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id ( id, full_name, avatar_url ),
        likes ( user_id ),
        comments ( id, user_id, parent_comment_id, content, profiles:user_id(full_name, avatar_url) )
      `)
      .order('created_at', { ascending: false });
    query = query.eq('visibility', 'public');
    query = query.is('flagged', false);

    // Content view toggle logic
    if (view === 'liked-posts') {
      const { data: likedPosts } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
      const likedIds = likedPosts ? likedPosts.map(l => l.post_id) : [];
      if (likedIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.in('id', likedIds);
    } else if (view === 'my-comments') {
      const { data: commentedPosts } = await supabase.from('comments').select('post_id').eq('user_id', user.id);
      const commentedIds = commentedPosts ? [...new Set(commentedPosts.map(c => c.post_id))] : [];
      if (commentedIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.in('id', commentedIds);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error fetching posts", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Limit to one post per poster per session
    const uniquePostsMap = {};
    data.forEach(post => {
      if (!uniquePostsMap[post.user_id]) {
        uniquePostsMap[post.user_id] = post;
      }
    });
    let uniquePosts = Object.values(uniquePostsMap);
    // Calculate ranking_score for each post
    const now = new Date();
    uniquePosts = uniquePosts.map(post => {
      const likes = post.likes ? post.likes.length : 0;
      const comments = post.comments ? post.comments.filter(c => !c.parent_comment_id).length : 0;
      const replies_from_current_user = post.comments ? post.comments.filter(c => c.parent_comment_id && c.user_id === user.id).length : 0;
      const hours_since_posted = (now - new Date(post.created_at)) / (1000 * 60 * 60);
      let ranking_score = (likes * 2) + (comments * 3) + (replies_from_current_user * 5) + (1 / (hours_since_posted + 2));
      if (interactedUserIds.includes(post.user_id)) ranking_score += 5;
      if (progress && post.profiles && post.profiles.level && Math.abs(post.profiles.level - progress.level) <= 1) ranking_score += 2;
      if (progress && post.profiles && post.profiles.streak && Math.abs(post.profiles.streak - progress.streak) <= 2) ranking_score += 1;
      // Store the score in memory for infinite scroll
      return { ...post, ranking_score };
    });
    // Store scores in cache for infinite scroll
    const cache = {};
    uniquePosts.forEach(post => { cache[post.id] = post.ranking_score; });
    setRankingCache(cache);
    // Feed mode logic
    let area = profile?.assessment_results?.userSelection;
    let filteredPosts = uniquePosts;
    if (feedMode === 'growth-like-me' && area) {
      filteredPosts = uniquePosts.filter(post => post.category === area && progress && post.profiles && post.profiles.level && Math.abs(post.profiles.level - progress.level) <= 1);
    } else if (feedMode === 'new') {
      filteredPosts = [...uniquePosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (feedMode === 'uplifting') {
      filteredPosts = [...uniquePosts].sort((a, b) => ((b.likes ? b.likes.length : 0) + (b.comments ? b.comments.length : 0)) - ((a.likes ? a.likes.length : 0) + (a.comments ? a.comments.length : 0)));
    } else {
      // Trending (default): sort by ranking_score
      filteredPosts = [...uniquePosts].sort((a, b) => b.ranking_score - a.ranking_score);
    }
    setPosts(filteredPosts);
    setLoading(false);
  }, [profile?.assessment_results?.userSelection, progress?.level, progress?.streak, user?.id, feedMode, view]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLikeToggle = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const isLiked = post.likes.some(l => l.user_id === user.id);

    try {
      if (isLiked) {
        const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
      
      // Optimistic update only after successful database operation
      setPosts(currentPosts => currentPosts.map(p => {
        if (p.id === postId) {
          const newLikes = isLiked 
            ? p.likes.filter(l => l.user_id !== user.id)
            : [...p.likes, { user_id: user.id }];
          return { ...p, likes: newLikes };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: `Growth Challenge by ${post.profiles.full_name}`,
      text: `${post.reflection}\n\nSee this post on Growth:`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "Share link copied to clipboard." });
      }
    } catch (error) {
      toast({ title: "Share Failed", variant: "destructive" });
    }
  };

  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setIsCommentsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray">
      {/* Filter popup */}
      {showFilterPopup && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/90 border border-black/10 rounded-xl px-6 py-3 shadow-lg text-center text-base font-medium animate-fade-in">
          <div>{showFilterPopup}</div>
        </div>
      )}
      <div className="container mx-auto px-4 pt-8 pb-8 md:pt-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-leaf-green" />
            <h1 className="text-4xl font-bold text-forest-green">Community Feed</h1>
          </div>
          <p className="text-charcoal-gray/80 text-lg">Share your journey and get inspired by others</p>
        </motion.div>
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          {/* Sort by dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-forest-green cursor-pointer" onClick={() => triggerFilterPopup('filter', 'Filter by')} />
            <Select value={feedMode} onValueChange={setFeedMode}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Location filter dropdown */}
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-forest-green cursor-pointer" onClick={() => triggerFilterPopup('filter', 'View posts of')} />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.key} value={opt.key}>{opt.icon}{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Content view toggle (icon buttons) */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant={view === 'all-posts' ? 'default' : 'outline'}
              size="icon"
              onClick={() => { setView('all-posts'); triggerFilterPopup('view', 'View: All Posts'); }}
              aria-label="All Posts"
            >
              {VIEW_OPTIONS[0].icon}
            </Button>
            <Button
              variant={view === 'liked-posts' ? 'default' : 'outline'}
              size="icon"
              onClick={() => { setView('liked-posts'); triggerFilterPopup('view', 'View: Liked'); }}
              aria-label="Liked"
            >
              {VIEW_OPTIONS[1].icon}
            </Button>
            <Button
              variant={view === 'my-comments' ? 'default' : 'outline'}
              size="icon"
              onClick={() => { setView('my-comments'); triggerFilterPopup('view', 'View: Commented'); }}
              aria-label="Commented"
            >
              {VIEW_OPTIONS[2].icon}
            </Button>
          </div>
          {/* Search icon and bar */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowSearch(v => !v)} aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </Button>
            {showSearch && (
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users by name or username..."
                className="w-64"
                autoFocus
              />
            )}
          </div>
        </div>
        {/* Add margin between sections */}
        <div className="mb-8" />
        {/* User Search and Follow UI (hidden unless searching) */}
        {showSearch && <UserAndPostSearch 
          query={query} 
          currentUserId={user?.id} 
          following={following} 
          onUserClick={profile => { navigate(`/profile/${profile.id}`); }}
          onPostClick={post => { navigate(`/post/${post.id}`); }}
        />}
        <div className="space-y-6">
          <AnimatePresence>
            {loading ? (
              <div className="text-center py-12">Loading posts...</div>
            ) : posts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Sparkles className="w-16 h-16 text-charcoal-gray/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-forest-green mb-2">No posts here yet!</h3>
                {view === 'liked-posts' ? (
                  <p className="text-charcoal-gray/70">You haven't liked any posts yet.</p>
                ) : view === 'my-comments' ? (
                  <p className="text-charcoal-gray/70">You haven't commented on any posts yet.</p>
                ) : (
                  <p className="text-charcoal-gray/70">Complete a challenge to share your first reflection!</p>
                )}
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} exit={{ opacity: 0, y: -20 }}>
                  <PostCard post={post} currentUser={user} onLike={handleLikeToggle} onShare={handleShare} onOpenComments={handleOpenComments} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedPost && (
        <CommentsModal
          isOpen={isCommentsModalOpen}
          setIsOpen={setIsCommentsModalOpen}
          post={selectedPost}
          currentUser={user}
          onCommentPosted={fetchPosts}
        />
      )}
    </div>
  );
};

export default CommunityPage;

// Add fade-in animation for popup
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fade-in 0.3s; }
`;
document.head.appendChild(style);