import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppBackground from './components/AppBackground';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import PlayPage from './pages/PlayPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  const location = useLocation();

  return (
    <>
      <AppBackground />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/lobby/:code" element={<LobbyPage />} />
          <Route path="/play/:code" element={<PlayPage />} />
          <Route path="/results/:code" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
