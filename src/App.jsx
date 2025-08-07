
import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import BackchatWidget from '@/components/BackchatWidget';
import LoginPage from '@/pages/LoginPage'; // Keep login page eager for initial load
import AuthCallbackPage from '@/pages/AuthCallbackPage'; // Keep auth callback eager for email confirmation
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { 
  LazyChallengePage,
  LazyChallengeDetailsPage,
  LazyChallengePackDetailsPage,
  LazyAssessmentPage,
  LazyCommunityPage,
  LazyProfilePage,
  LazyProgressPage,
  LazyNotificationsPage,
  LazyPostPage,
  LazyAdminPage,
  LazySettingsPage,
  LazyLeaderboardPage,
  LazyBadgesPage,
  PageLoader,
  LazyChallengeCompletionPage
} from '@/components/LazyComponents';
import TestEmailPage from '@/pages/TestEmailPage';

// Performance optimization - clear old timeouts
function clearExistingTimeouts() {
  // Clear any existing timeouts that might cause memory leaks
  let id = window.setTimeout(function() {}, 0);
  while (id--) {
    window.clearTimeout(id);
  }
}

function AppContent() {
  const location = useLocation();
  
  // Performance optimization
  useEffect(() => {
    clearExistingTimeouts();
    
    return () => {
      clearExistingTimeouts();
    };
  }, [location.pathname]);

  const shouldShowNavigation = location.pathname !== '/login' && 
                              location.pathname !== '/assessment' && 
                              location.pathname !== '/forgot-password' && 
                              location.pathname !== '/reset-password';
  const paddingClass = shouldShowNavigation ? 'pb-20 pt-16' : '';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-sun-beige">
      <div className={`w-full max-w-full ${paddingClass}`}> 
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/challenge" element={
            <Suspense fallback={<PageLoader title="Challenge" />}>
              <LazyChallengePage />
            </Suspense>
          } />
          <Route path="/challenge-details" element={
            <Suspense fallback={<PageLoader title="Challenge Details" />}>
              <LazyChallengeDetailsPage />
            </Suspense>
          } />
          <Route path="/challenge-completion/:challengeId" element={
            <Suspense fallback={<PageLoader title="Challenge Completion" />}>
              <LazyChallengeCompletionPage />
            </Suspense>
          } />
          <Route path="/challenge-completion/:challengeId/:packId" element={
            <Suspense fallback={<PageLoader title="Challenge Completion" />}>
              <LazyChallengeCompletionPage />
            </Suspense>
          } />
          <Route path="/challenge-pack/:packId" element={
            <Suspense fallback={<PageLoader title="Challenge Pack Details" />}>
              <LazyChallengePackDetailsPage />
            </Suspense>
          } />
          <Route path="/assessment" element={
            <Suspense fallback={<PageLoader title="Assessment" />}>
              <LazyAssessmentPage />
            </Suspense>
          } />
          <Route path="/community" element={
            <Suspense fallback={<PageLoader title="Community" />}>
              <LazyCommunityPage />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<PageLoader title="Profile" />}>
              <LazyProfilePage />
            </Suspense>
          } />
          <Route path="/profile/:userId" element={
            <Suspense fallback={<PageLoader title="Profile" />}>
              <LazyProfilePage />
            </Suspense>
          } />
          <Route path="/progress" element={
            <Suspense fallback={<PageLoader title="Progress" />}>
              <LazyProgressPage />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<PageLoader title="Notifications" />}>
              <LazyNotificationsPage />
            </Suspense>
          } />
          <Route path="/post/:id" element={
            <Suspense fallback={<PageLoader title="Post" />}>
              <LazyPostPage />
            </Suspense>
          } />
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader title="Admin" />}>
              <LazyAdminPage />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<PageLoader title="Settings" />}>
              <LazySettingsPage />
            </Suspense>
          } />
          <Route path="/leaderboard" element={
            <Suspense fallback={<PageLoader title="Leaderboard" />}>
              <LazyLeaderboardPage />
            </Suspense>
          } />
          <Route path="/badges" element={
            <Suspense fallback={<PageLoader title="Badges" />}>
              <LazyBadgesPage />
            </Suspense>
          } />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/test-email" element={<TestEmailPage />} />
        </Routes>
      </div>
      {shouldShowNavigation && <Navigation />}
      <BackchatWidget />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
