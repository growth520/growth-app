
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
import LeaderboardPage from '@/pages/LeaderboardPage';

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

  const shouldShowNavigation = location.pathname !== '/login' && location.pathname !== '/assessment';
  const paddingClass = shouldShowNavigation ? 'pb-20' : '';

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
          <Route path="/leaderboard" element={<LeaderboardPage />} />
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
