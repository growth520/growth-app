
import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage.jsx'));
const ChallengePage = lazy(() => import('@/pages/ChallengePage.jsx'));
const ChallengeDetailsPage = lazy(() => import('@/pages/ChallengeDetailsPage.jsx'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage.jsx'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage.jsx'));
const ProgressPage = lazy(() => import('@/pages/ProgressPage.jsx'));
const PostPage = lazy(() => import('@/pages/PostPage.jsx'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage.jsx'));
const AdminPage = lazy(() => import('@/pages/AdminPage.jsx'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage.jsx'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-sun-beige">
    <div className="animate-pulse text-forest-green">Loading...</div>
  </div>
);

const ProtectedRoute = () => {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: dataLoading } = useData();

  if (authLoading || dataLoading) {
    return <PageLoader />;
  }
  
  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!profile?.has_completed_assessment) {
    return <Navigate to="/assessment" replace />;
  }

  return <Outlet />;
};

const AssessmentRoute = () => {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: dataLoading } = useData();

  if (authLoading || dataLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }
  
  if (profile?.has_completed_assessment) {
    return <Navigate to="/challenge" replace />;
  }

  return <AssessmentPage />;
};

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 }
};

const AppContent = () => {
  const { session } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const showNavigation = session && !['/', '/assessment', '/admin'].includes(currentPath) && !currentPath.startsWith('/post/');
  
  return (
    <div className="min-h-screen bg-sun-beige">
      <main className={`${showNavigation ? 'pb-24 pt-16 md:pt-0' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={session ? <Navigate to="/challenge" replace /> : <LoginPage />} />
              <Route path="/assessment" element={<AssessmentRoute />} />
              
              <Route element={<ProtectedRoute />}>
                <Route 
                  path="/challenge" 
                  element={
                    <motion.div {...pageTransition}>
                      <ChallengePage key={Date.now()} />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/challenge-details" 
                  element={
                    <motion.div {...pageTransition}>
                      <ChallengeDetailsPage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/community" 
                  element={
                    <motion.div {...pageTransition}>
                      <CommunityPage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <motion.div {...pageTransition}>
                      <ProfilePage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/profile/:userId" 
                  element={
                    <motion.div {...pageTransition}>
                      <ProfilePage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/progress" 
                  element={
                    <motion.div {...pageTransition}>
                      <ProgressPage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/post/:postId" 
                  element={
                    <motion.div {...pageTransition}>
                      <PostPage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <motion.div {...pageTransition}>
                      <NotificationsPage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <motion.div {...pageTransition}>
                      <AdminPage />
                    </motion.div>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <motion.div {...pageTransition}>
                      <SettingsPage />
                    </motion.div>
                  } 
                />
              </Route>
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      {showNavigation && <Navigation />}
    </div>
  );
};

function App() {
  return (
    <>
      <Helmet>
        <title>Growth - Personal Development Journey</title>
        <meta name="description" content="Transform your life with personalized daily challenges, track your progress, and connect with a supportive community on your personal growth journey." />
      </Helmet>
      <AppContent />
    </>
  );
}

export default App;
