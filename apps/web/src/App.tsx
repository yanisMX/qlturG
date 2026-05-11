import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import PlayPage from './pages/PlayPage';
import ResultsPage from './pages/ResultsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/lobby/:code" element={<LobbyPage />} />
      <Route path="/play/:code" element={<PlayPage />} />
      <Route path="/results/:code" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
