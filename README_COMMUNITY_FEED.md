# Community Feed Implementation

## Overview

The Community Feed is a comprehensive social media-style feed for the Growth app that displays posts with advanced filtering, ranking, and interaction capabilities. It implements a sophisticated ranking algorithm to surface the most engaging and relevant content while preventing spam.

## Features

### 🎯 **Core Features**
- **Ranked Feed**: Posts are ranked using a sophisticated algorithm
- **Multiple Filters**: Trending, New, Growth Like Me, Most Uplifting
- **Tab Navigation**: All Posts, My Posts, Liked, Commented, Friends
- **Search**: Full-text search across post content and challenge titles
- **Growth Area Filtering**: Filter by specific growth areas
- **Infinite Scroll**: Load more posts as you scroll
- **Real-time Interactions**: Like, comment, and share functionality

### 🏆 **Ranking Algorithm**

The feed uses a comprehensive scoring formula to rank posts:

```
score = (likes_count * 2) + (comments_count * 3) + (shares_count * 4) + (views_count * 0.5)
       + (100 / (1 + hours_since_post))
       - (50 * (user_post_rank - 1))
```

**Components:**
- **Engagement Score**: Likes (2x), Comments (3x), Shares (4x), Views (0.5x)
- **Recency Bonus**: 100 points divided by (1 + hours since post)
- **Spam Prevention**: 50-point penalty for each additional post from the same user

### 🔍 **Filtering Options**

#### **Sort Filters:**
- **Trending**: Ranked by engagement score + recency - spam penalty
- **New**: Sorted by creation date (newest first)
- **Growth Like Me**: Posts matching user's growth area
- **Most Uplifting**: Sorted by total engagement (likes + comments)

#### **Tab Filters:**
- **All Posts**: All community posts
- **My Posts**: Posts created by the current user
- **Liked**: Posts the user has liked
- **Commented**: Posts the user has commented on
- **Friends**: Posts from followed users

#### **Additional Filters:**
- **Growth Area**: Filter by specific growth categories
- **Search**: Full-text search in post content and challenge titles

## Technical Implementation

### 🗄️ **Database Schema**

#### **Posts Table:**
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  reflection TEXT NOT NULL,
  photo_url TEXT,
  category TEXT,
  challenge_title TEXT,
  post_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);
```

#### **Related Tables:**
- `likes`: User-post like relationships
- `comments`: Post comments
- `follows`: User following relationships
- `profiles`: User profile information

### ⚡ **Performance Optimizations**

#### **RPC Function:**
The feed uses a custom Supabase RPC function `get_ranked_feed()` for optimal performance:

```sql
CREATE OR REPLACE FUNCTION get_ranked_feed(
  p_user_id uuid DEFAULT NULL,
  p_filter text DEFAULT 'trending',
  p_tab text DEFAULT 'all',
  p_growth_area text DEFAULT 'all',
  p_search_query text DEFAULT '',
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
```

#### **Database Indexes:**
```sql
-- Performance indexes
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX idx_posts_comments_count ON posts(comments_count DESC);
CREATE INDEX idx_posts_shares_count ON posts(shares_count DESC);
CREATE INDEX idx_posts_views_count ON posts(views_count DESC);

-- Composite indexes for common queries
CREATE INDEX idx_posts_category_created_at ON posts(category, created_at DESC);
CREATE INDEX idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_engagement ON posts(likes_count DESC, comments_count DESC, created_at DESC);
```

### 🎨 **UI Components**

#### **CommunityPage.jsx**
- Main feed component with state management
- Filter and tab navigation
- Infinite scroll implementation
- Search functionality

#### **PostCard.jsx**
- Individual post display component
- Like, comment, share interactions
- User profile links
- Comments preview with rotation

#### **CommentsModal.jsx**
- Full comments view
- Add new comments
- Real-time updates

## Usage

### 🚀 **Getting Started**

1. **Apply Database Migration:**
   ```bash
   # Run the migration to create the RPC function and indexes
   supabase db push
   ```

2. **Import Components:**
   ```jsx
   import CommunityPage from '@/pages/CommunityPage';
   import PostCard from '@/components/community/PostCard';
   import CommentsModal from '@/components/community/CommentsModal';
   ```

3. **Add to Routes:**
   ```jsx
   <Route path="/community" element={<CommunityPage />} />
   ```

### 📱 **User Experience**

#### **Feed Navigation:**
- **Tabs**: Click tabs to filter posts (All, My Posts, Liked, etc.)
- **Filters**: Use filter buttons to change sorting (Trending, New, etc.)
- **Search**: Click search icon to expand search input
- **Growth Areas**: Use dropdown to filter by growth category

#### **Post Interactions:**
- **Like**: Click heart icon to like/unlike posts
- **Comment**: Click comment icon to view/add comments
- **Share**: Click share icon to share post
- **Profile**: Click username/avatar to view user profile

#### **Infinite Scroll:**
- Scroll to bottom to automatically load more posts
- "Load More" button appears when more posts are available

### 🔧 **Configuration**

#### **Growth Areas:**
Update the `growthAreas` array in `CommunityPage.jsx`:

```jsx
const growthAreas = [
  { value: 'all', label: 'All Growth Areas' },
  { value: 'spiritual', label: 'Spiritual Growth' },
  { value: 'emotional', label: 'Emotional Intelligence' },
  // Add more areas as needed
];
```

#### **Post Limits:**
Adjust pagination limits in the `fetchPosts` function:

```jsx
const limit = 10; // Posts per page
```

#### **Ranking Weights:**
Modify the ranking algorithm in the RPC function:

```sql
-- Adjust these multipliers in get_ranked_feed function
(likes_count * 2) + (comments_count * 3) + (shares_count * 4) + (views_count * 0.5)
```

## Performance Considerations

### 🚀 **Optimizations Implemented**

1. **RPC Function**: Single database call for complex queries
2. **Database Indexes**: Optimized for common query patterns
3. **Pagination**: Load posts in chunks to prevent memory issues
4. **Caching**: User interactions cached to reduce database calls
5. **Lazy Loading**: Images loaded on demand
6. **Optimistic Updates**: UI updates immediately, syncs with backend

### 📊 **Monitoring**

#### **Key Metrics:**
- Query execution time
- Posts loaded per second
- User engagement rates
- Filter usage patterns

#### **Debug Logging:**
```jsx
// Enable debug logging
console.log('Fetching posts with filters:', { selectedTab, selectedFilter, selectedGrowthArea, searchQuery });
console.log('Fetched posts:', data?.length || 0, 'for tab:', selectedTab);
```

## Troubleshooting

### 🔧 **Common Issues**

#### **Posts Not Loading:**
1. Check database connection
2. Verify RPC function exists
3. Check user authentication
4. Review console errors

#### **Filters Not Working:**
1. Verify filter parameters
2. Check user interactions data
3. Review RPC function logic

#### **Performance Issues:**
1. Check database indexes
2. Monitor query execution time
3. Reduce post limit if needed
4. Enable query caching

### 🐛 **Debug Mode**

Enable debug logging by adding to `CommunityPage.jsx`:

```jsx
// Add debug logging
useEffect(() => {
  console.log('Current state:', { posts, selectedTab, selectedFilter, loading });
}, [posts, selectedTab, selectedFilter, loading]);
```

## Future Enhancements

### 🚀 **Planned Features**

1. **Real-time Updates**: WebSocket integration for live feed updates
2. **Advanced Analytics**: Post performance metrics
3. **Content Moderation**: Automated spam detection
4. **Personalization**: ML-based content recommendations
5. **Media Support**: Video and audio posts
6. **Notifications**: Real-time interaction notifications

### 🔮 **Technical Improvements**

1. **Query Optimization**: Further database performance tuning
2. **Caching Layer**: Redis integration for faster responses
3. **CDN Integration**: Image optimization and delivery
4. **Mobile Optimization**: Progressive Web App features

## Contributing

### 📝 **Development Guidelines**

1. **Code Style**: Follow existing patterns and conventions
2. **Testing**: Add tests for new features
3. **Documentation**: Update docs for API changes
4. **Performance**: Monitor impact on feed performance

### 🧪 **Testing**

```bash
# Run tests
npm test

# Test specific components
npm test CommunityPage
npm test PostCard
```

## License

This implementation is part of the Growth app and follows the project's licensing terms. 