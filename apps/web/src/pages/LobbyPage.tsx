import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import Scoreboard from '../components/Scoreboard';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { players, isHost, myPlayerId, status, addPlayer, removePlayer, setGameState } =
    useGameStore();

  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const inviteLink = `${window.location.origin}/join?code=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      linkInputRef.current?.select();
    }
  };

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
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow }}
          className="w-full max-w-md space-y-5"
        >
          {/* Code display */}
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Code de la partie
            </p>
            <div className="card py-5">
              <h1 className="text-5xl font-extrabold tracking-widest text-navy-700 font-mono mb-4">
                {code}
              </h1>

              {/* Invite link */}
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.target.select()}
                  className="input-field flex-1 text-xs text-slate-500 py-2"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopy}
                  className={[
                    'btn-secondary shrink-0 text-sm py-2 px-4 transition-all duration-base',
                    copied
                      ? '!text-emerald-700 !border-emerald-300 !bg-emerald-50'
                      : '',
                  ].join(' ')}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={copied ? 'copied' : 'copy'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: duration.fast }}
                    >
                      {copied ? '✓ Copié !' : 'Copier'}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Player list */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-700">
                Joueurs{' '}
                <span className="text-slate-400 font-normal text-sm">({players.length}/12)</span>
              </h2>
              <span className="text-xs text-slate-400 animate-pulse font-medium">
                En attente...
              </span>
            </div>
            <AnimatePresence>
              {players.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">
                  Aucun joueur pour l'instant…
                </p>
              ) : (
                <Scoreboard players={players} myPlayerId={myPlayerId} compact />
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          {isHost ? (
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                disabled={players.length < 1}
                className="btn-primary w-full text-lg py-4"
              >
                Lancer la partie
              </motion.button>
              <p className="text-center text-xs text-slate-400">
                Vous pouvez jouer seul pour tester
              </p>
            </div>
          ) : (
            <div className="card text-center">
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                En attente que l'hôte lance la partie…
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
