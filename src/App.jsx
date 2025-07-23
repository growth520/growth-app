
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import LoginPage from '@/pages/LoginPage';
import ChallengePage from '@/pages/ChallengePage';
import ChallengeDetailsPage from '@/pages/ChallengeDetailsPage';
import AssessmentPage from '@/pages/AssessmentPage';
import CommunityPage from '@/pages/CommunityPage';
import ProfilePage from '@/pages/ProfilePage';
import ProgressPage from '@/pages/ProgressPage';
import NotificationsPage from '@/pages/NotificationsPage';
import PostPage from '@/pages/PostPage';
import AdminPage from '@/pages/AdminPage';
import SettingsPage from '@/pages/SettingsPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // Don't show navigation on login page or when not authenticated
  const shouldShowNavigation = user && location.pathname !== '/login' && location.pathname !== '/';
  
  // Show appropriate padding based on whether navigation is shown
  const paddingClass = shouldShowNavigation ? "pt-16 md:pt-20 pb-24" : "";

  // Performance optimization - cleanup on location change to prevent memory leaks
  useEffect(() => {
    // Clear any existing timers or intervals on route change
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Force garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && window.gc) {
      window.gc();
    }
  }, [location.pathname]);

  // Prevent memory leaks from long-running sessions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce activity
        document.querySelectorAll('video, audio').forEach(media => {
          if (!media.paused) media.pause();
        });
      }
    };

    const handleBeforeUnload = () => {
      // Cleanup before page unload
      window.dispatchEvent(new Event('app-cleanup'));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-sun-beige flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-sun-beige">
      <div className={`w-full max-w-full ${paddingClass}`}> 
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/challenge-details" element={<ChallengeDetailsPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      {shouldShowNavigation && <Navigation />}
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
