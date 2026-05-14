import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { Topic } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import Scoreboard from '../components/Scoreboard';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

const TOPIC_LABELS: Record<Topic, string> = {
  HISTOIRE: 'Histoire',
  GEOGRAPHIE: 'Géographie',
  GEOPOLITIQUE: 'Géopolitique',
  CINEMA: 'Cinéma',
  PHILOSOPHIE: 'Philosophie',
  LITTERATURE: 'Littérature',
  ANIMAUX: 'Animaux',
  INFORMATIQUE: 'Informatique',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  FACILE: 'Facile',
  MOYEN: 'Moyen',
  DIFFICILE: 'Difficile',
  VARIE: 'Varié',
};

const DATES = ['476', '800', '987', '1066', '1337', '1453', '1515', '1598', '1661', '1789', '1804', '1870', '1914', '1940', '1944', '1968'];

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { players, isHost, myPlayerId, status, gameMode, topics, difficulty, totalQuestions, addPlayer, removePlayer, setGameState, reset } =
    useGameStore();

  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const inviteLink = `${window.location.origin}/join?code=${code}`;

  const isSurvival = gameMode === 'SURVIVAL_SOLO' || gameMode === 'SURVIVAL_MULTI';

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

    const onPlayerJoined = (p: { playerId: string; nickname: string; avatarUrl?: string; score: number; lives?: number }) => {
      addPlayer({ id: p.playerId, nickname: p.nickname, avatarUrl: p.avatarUrl, score: p.score ?? 0, lives: p.lives });
    };
    const onPlayerLeft = (p: { playerId: string }) => {
      removePlayer(p.playerId);
    };
    const onLoading = () => navigate(`/play/${code}`);
    const onQuestion = () => navigate(`/play/${code}`);
    const onError = (err: { message: string }) => setGameState({ error: err.message });
    const onKicked = () => {
      reset();
      navigate('/');
    };

    socket.on('game:player-joined', onPlayerJoined);
    socket.on('game:player-left', onPlayerLeft);
    socket.on('game:loading', onLoading);
    socket.on('game:question', onQuestion);
    socket.on('game:error', onError);
    socket.on('game:kicked', onKicked);

    return () => {
      socket.off('game:player-joined', onPlayerJoined);
      socket.off('game:player-left', onPlayerLeft);
      socket.off('game:loading', onLoading);
      socket.off('game:question', onQuestion);
      socket.off('game:error', onError);
      socket.off('game:kicked', onKicked);
    };
  }, [code, navigate, addPlayer, removePlayer, setGameState, reset]);

  useEffect(() => {
    if (status === 'IN_PROGRESS') navigate(`/play/${code}`);
    if (status === 'FINISHED') navigate(`/results/${code}`);
  }, [status, code, navigate]);

  const handleStart = () => {
    const socket = getSocket();
    socket.emit('game:start');
  };

  const handleKick = (playerId: string) => {
    const socket = getSocket();
    socket.emit('game:kick', { playerId });
  };

  const tickerDates = [...DATES, ...DATES];

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 pb-20">
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
              <div className="flex gap-2 min-w-0">
                <input
                  ref={linkInputRef}
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.target.select()}
                  className="input-field flex-1 min-w-0 text-xs py-2 font-mono"
                  style={{ color: '#7A7F9B' }}
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCopy}
                  className="btn-secondary shrink-0 text-sm py-2 px-3 sm:px-4"
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
                <Scoreboard
                  players={players}
                  myPlayerId={myPlayerId}
                  compact
                  showLives={isSurvival}
                  onKick={isHost ? handleKick : undefined}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Game mode badge */}
          {isSurvival && (
            <div className="text-center">
              <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ color: '#FF6B5B', border: '1px solid rgba(255,107,91,0.3)', backgroundColor: 'rgba(255,107,91,0.08)' }}>
                {gameMode === 'SURVIVAL_SOLO' ? '💀 Survival Solo — 3 vies' : '💀 Survival Multi — dernier en vie'}
              </span>
            </div>
          )}

          {/* Game info badge */}
          <div className="text-center">
            <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ color: '#B4B7CC', border: '1px solid rgba(180,183,204,0.2)', backgroundColor: 'rgba(180,183,204,0.06)' }}>
              {[
                topics.length > 0 ? topics.map((t) => TOPIC_LABELS[t]).join(', ') : 'Mixte',
                difficulty ? DIFFICULTY_LABELS[difficulty] : null,
                !isSurvival ? `${totalQuestions} questions` : null,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>

          {/* Actions */}
          {isHost ? (
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                animate={players.length >= 2 ? {
                  boxShadow: ['0 0 0 0 rgba(245,199,107,0)', '0 0 0 8px rgba(245,199,107,0.18)', '0 0 0 0 rgba(245,199,107,0)'],
                } : {}}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                onClick={handleStart}
                disabled={players.length < 1}
                className="btn-primary w-full text-base py-4"
              >
                Lancer la partie
              </motion.button>
              <p className="text-center text-xs font-mono" style={{ color: '#7A7F9B' }}>
                {players.length >= 2 ? `${players.length} joueurs prêts — c'est parti ?` : 'On peut lancer dès 2, pas de pression.'}
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
        <div className="fixed bottom-0 left-0 right-0 pb-safe pointer-events-none px-safe" style={{ borderTop: '1px solid rgba(242,238,227,0.06)', paddingTop: '0.625rem' }}>
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
