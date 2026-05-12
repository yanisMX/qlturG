import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import Scoreboard from '../components/Scoreboard';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

const DATES = ['476', '800', '987', '1066', '1337', '1453', '1515', '1598', '1661', '1789', '1804', '1870', '1914', '1940', '1944', '1968'];

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
    const onQuestion = () => navigate(`/play/${code}`);
    const onError = (err: { message: string }) => setGameState({ error: err.message });

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

  // Duplicate for seamless scroll
  const tickerDates = [...DATES, ...DATES];

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow }}
          className="w-full max-w-md space-y-5"
        >
          {/* Code display */}
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.16em' }}>
              Mot de passe du QG
            </p>
            <div className="card py-6">
              <h1 className="text-5xl font-extrabold tracking-[0.3em] mb-4 font-mono" style={{ color: '#F5C76B', fontFamily: '"Geist Mono", monospace' }}>
                {code}
              </h1>

              {/* Invite link */}
              <div className="flex gap-2">
                <input
                  ref={linkInputRef}
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.target.select()}
                  className="input-field flex-1 text-xs py-2 font-mono"
                  style={{ color: '#7A7F9B' }}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopy}
                  className="btn-secondary shrink-0 text-sm py-2 px-4"
                  style={copied ? { color: '#F5C76B', borderColor: 'rgba(245,199,107,0.4)', backgroundColor: 'rgba(245,199,107,0.08)' } : {}}
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
              <h2 className="font-bold" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
                Joueurs{' '}
                <span className="font-normal text-sm font-mono" style={{ color: '#7A7F9B' }}>({players.length}/12)</span>
              </h2>
              <span className="text-xs font-medium font-mono animate-pulse" style={{ color: '#7A7F9B' }}>
                En attente…
              </span>
            </div>
            <AnimatePresence>
              {players.length === 0 ? (
                <p className="text-sm text-center py-2" style={{ color: '#7A7F9B' }}>
                  En attendant d'autres têtes pensantes…
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
                className="btn-primary w-full text-base py-4"
              >
                Lancer la partie
              </motion.button>
              <p className="text-center text-xs font-mono" style={{ color: '#7A7F9B' }}>
                On peut lancer dès 2, pas de pression.
              </p>
            </div>
          ) : (
            <div className="card text-center">
              <div className="flex items-center justify-center gap-2" style={{ color: '#7A7F9B' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F5C76B' }} />
                En attente que l'hôte lance la partie…
              </div>
            </div>
          )}
        </motion.div>

        {/* Chronological ticker — bottom */}
        <div className="fixed bottom-0 left-0 right-0 py-2.5 pointer-events-none" style={{ borderTop: '1px solid rgba(242,238,227,0.06)' }}>
          <div className="ticker-wrap">
            <div className="ticker-track">
              {tickerDates.map((date, i) => (
                <span
                  key={i}
                  className="inline-block mx-5 text-xs font-mono"
                  style={{ color: i % 3 === 0 ? '#F5C76B' : '#7A7F9B', opacity: 0.7 }}
                >
                  {date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
