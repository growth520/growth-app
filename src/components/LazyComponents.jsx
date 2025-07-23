// Lazy-loaded components for better code splitting and performance

import { createLazyComponent } from '@/lib/performance';

// Lazy load all page components
export const LazyChallengePage = createLazyComponent(
  () => import('@/pages/ChallengePage'),
  'ChallengePage'
);

export const LazyChallengeDetailsPage = createLazyComponent(
  () => import('@/pages/ChallengeDetailsPage'),
  'ChallengeDetailsPage'
);

export const LazyAssessmentPage = createLazyComponent(
  () => import('@/pages/AssessmentPage'),
  'AssessmentPage'
);

export const LazyCommunityPage = createLazyComponent(
  () => import('@/pages/CommunityPage'),
  'CommunityPage'
);

export const LazyProfilePage = createLazyComponent(
  () => import('@/pages/ProfilePage'),
  'ProfilePage'
);

export const LazyProgressPage = createLazyComponent(
  () => import('@/pages/ProgressPage'),
  'ProgressPage'
);

export const LazyNotificationsPage = createLazyComponent(
  () => import('@/pages/NotificationsPage'),
  'NotificationsPage'
);

export const LazyPostPage = createLazyComponent(
  () => import('@/pages/PostPage'),
  'PostPage'
);

export const LazyAdminPage = createLazyComponent(
  () => import('@/pages/AdminPage'),
  'AdminPage'
);

export const LazySettingsPage = createLazyComponent(
  () => import('@/pages/SettingsPage'),
  'SettingsPage'
);

export const LazyLeaderboardPage = createLazyComponent(
  () => import('@/pages/LeaderboardPage'),
  'LeaderboardPage'
);

// Lazy load heavy gamification components
export const LazyChallengePacksGrid = createLazyComponent(
  () => import('@/components/gamification/ChallengePacksGrid'),
  'ChallengePacksGrid'
);

export const LazyLeaderboard = createLazyComponent(
  () => import('@/components/gamification/Leaderboard'),
  'Leaderboard'
);

export const LazyPersonalizedSuggestion = createLazyComponent(
  () => import('@/components/gamification/PersonalizedSuggestion'),
  'PersonalizedSuggestion'
);

// Lazy load community components (often heavy with images)
export const LazyCommentsModal = createLazyComponent(
  () => import('@/components/community/CommentsModal'),
  'CommentsModal'
);

export const LazyPostCard = createLazyComponent(
  () => import('@/components/community/PostCard'),
  'PostCard'
);

// Loading fallback component
export const ComponentLoader = ({ name = 'component' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-forest-green border-t-transparent rounded-full animate-spin"></div>
      <div className="text-sm text-gray-600">Loading {name}...</div>
    </div>
  </div>
);

// Page loading fallback with skeleton
export const PageLoader = ({ title = 'page' }) => (
  <div className="min-h-screen p-4 bg-sun-beige">
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      
      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-forest-green border-t-transparent rounded-full animate-spin"></div>
          <div className="text-forest-green font-medium">Loading {title}...</div>
        </div>
      </div>
    </div>
  </div>
);

export default {
  LazyChallengePage,
  LazyChallengeDetailsPage,
  LazyAssessmentPage,
  LazyCommunityPage,
  LazyProfilePage,
  LazyProgressPage,
  LazyNotificationsPage,
  LazyPostPage,
  LazyAdminPage,
  LazySettingsPage,
  LazyLeaderboardPage,
  LazyChallengePacksGrid,
  LazyLeaderboard,
  LazyPersonalizedSuggestion,
  LazyCommentsModal,
  LazyPostCard,
  ComponentLoader,
  PageLoader
}; 