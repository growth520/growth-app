
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <div className="min-h-screen overflow-x-hidden touch-pan-y">
            <div className="pt-16 md:pt-20 pb-24 px-4 md:px-0"> {/* Add horizontal padding on mobile */}
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
            <Navigation />
            <Toaster />
          </div>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
