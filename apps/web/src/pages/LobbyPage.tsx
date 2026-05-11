import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import Scoreboard from '../components/Scoreboard';

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { players, isHost, myPlayerId, status, addPlayer, removePlayer, setGameState } =
    useGameStore();

  useEffect(() => {
    const socket = getSocket();

    const onPlayerJoined = (p: { playerId: string; nickname: string; score: number }) => {
      addPlayer({ id: p.playerId, nickname: p.nickname, score: p.score ?? 0 });
    };
    const onPlayerLeft = (p: { playerId: string }) => {
      removePlayer(p.playerId);
    };
    const onQuestion = () => {
      navigate(`/play/${code}`);
    };
    const onError = (err: { message: string }) => {
      setGameState({ error: err.message });
    };

    socket.on('game:player-joined', onPlayerJoined);
    socket.on('game:player-left', onPlayerLeft);
    socket.on('game:question', onQuestion);
    socket.on('game:error', onError);

    return () => {
      socket.off('game:player-joined', onPlayerJoined);
      socket.off('game:player-left', onPlayerLeft);
      socket.off('game:question', onQuestion);
      socket.off('game:error', onError);
    };
  }, [code, navigate, addPlayer, removePlayer, setGameState]);

  useEffect(() => {
    if (status === 'IN_PROGRESS') navigate(`/play/${code}`);
    if (status === 'FINISHED') navigate(`/results/${code}`);
  }, [status, code, navigate]);

  const handleStart = () => {
    const socket = getSocket();
    socket.emit('game:start');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-1">
            Code de la partie
          </p>
          <h1 className="text-5xl font-extrabold tracking-widest text-navy-800 font-mono">
            {code}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Partagez ce code avec vos amis pour qu'ils rejoignent
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-700">
              Joueurs ({players.length}/12)
            </h2>
            <span className="text-xs text-slate-400 animate-pulse font-medium">
              En attente...
            </span>
          </div>
          <Scoreboard players={players} myPlayerId={myPlayerId} compact />
        </div>

        {isHost ? (
          <div className="space-y-3">
            <button
              onClick={handleStart}
              disabled={players.length < 1}
              className="btn-primary w-full text-lg py-4"
            >
              Lancer la partie
            </button>
            <p className="text-center text-xs text-slate-400">
              Vous pouvez jouer seul pour tester
            </p>
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-slate-500">
              En attente que l'hôte lance la partie…
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
