import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppBackground from './components/AppBackground';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import PlayPage from './pages/PlayPage';
import ResultsPage from './pages/ResultsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

export default function App() {
  const location = useLocation();
  const init = useAuthStore((s) => s.init);

  // Restore session from localStorage on first load
  useEffect(() => {
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AppBackground />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/lobby/:code" element={<LobbyPage />} />
          <Route path="/play/:code" element={<PlayPage />} />
          <Route path="/results/:code" element={<ResultsPage />} />

          {/* Leaderboard */}
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
