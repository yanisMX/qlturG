import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { Topic } from '../store/gameStore';
import { getSocket } from '../socket/socket';
import Podium from '../components/Podium';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

const TOPIC_OPTIONS: { id: Topic; label: string }[] = [
  { id: 'HISTOIRE', label: 'Histoire' },
  { id: 'GEOGRAPHIE', label: 'Géographie' },
  { id: 'GEOPOLITIQUE', label: 'Géopolitique' },
  { id: 'CINEMA', label: 'Cinéma' },
  { id: 'PHILOSOPHIE', label: 'Philosophie' },
  { id: 'LITTERATURE', label: 'Littérature' },
];

const RAIN_COLORS = ['#F5C76B', '#FF6B5B', '#F2EEE3', '#a5b4fc', '#F5C76B', '#FF6B5B'];

// Deterministic confetti particles (no Math.random in render)
const RAIN_PARTICLES = Array.from({ length: 48 }, (_, i) => ({
  left: `${((i * 13 + 7) % 97) + 1}%`,
  delay: `${((i * 0.19) % 3).toFixed(2)}s`,
  duration: `${(2.4 + (i * 0.11) % 2).toFixed(2)}s`,
  color: RAIN_COLORS[i % RAIN_COLORS.length],
  size: 4 + (i % 5),
  borderRadius: i % 3 === 0 ? '50%' : '2px',
}));

function ConfettiRain() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden style={{ zIndex: 0 }}>
      {RAIN_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: p.left,
            top: '-12px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.borderRadius,
            animation: `confettiRain ${p.duration} ${p.delay} ease-in infinite`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { ranking, myPlayerId, isHost, topics, reset, setGameState } = useGameStore();
  const myEntry = ranking.find((r) => r.playerId === myPlayerId);
  const isWinner = myEntry?.rank === 1;
  const [rematching, setRematching] = useState(false);
  const [rematchTopics, setRematchTopics] = useState<Topic[]>(topics);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const topicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topicsRef.current && !topicsRef.current.contains(e.target as Node)) {
        setTopicsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTopic = (id: Topic) =>
    setRematchTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const topicLabel =
    rematchTopics.length === 0
      ? 'Mixte (tous)'
      : TOPIC_OPTIONS.filter((o) => rematchTopics.includes(o.id))
          .map((o) => o.label)
          .join(', ');

  useEffect(() => {
    const socket = getSocket();
    const onState = (state: {
      gameId: string; code: string; status: string; difficulty: string;
      topics?: Topic[]; gameMode: string; speedBonus: boolean;
      doublePointsBonus: boolean; totalQuestions: number; questionDuration: number;
      hostId: string; players: unknown[]; yourPlayerId: string; isHost: boolean;
    }) => {
      reset();
      setGameState({
        gameId: state.gameId,
        code: state.code,
        status: state.status as 'LOBBY',
        difficulty: state.difficulty as 'FACILE',
        topics: state.topics ?? [],
        gameMode: state.gameMode as 'STANDARD',
        speedBonus: state.speedBonus,
        doublePointsBonus: state.doublePointsBonus,
        totalQuestions: state.totalQuestions,
        questionDuration: state.questionDuration,
        hostId: state.hostId,
        players: state.players as never,
        myPlayerId: state.yourPlayerId,
        isHost: state.isHost,
      });
      navigate(`/lobby/${state.code}`);
    };
    socket.once('game:state', onState);
    return () => { socket.off('game:state', onState); };
  }, [navigate, reset, setGameState]);

  const handleRematch = () => {
    setRematching(true);
    getSocket().emit('game:rematch', { topics: rematchTopics });
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-6 flex flex-col items-center" style={{ position: 'relative' }}>
        {isWinner && <ConfettiRain />}
        <div className="w-full max-w-lg space-y-6 mt-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.slow }}
            className="text-center"
          >
            <h1
              className="text-4xl font-extrabold mb-2"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif', color: '#F2EEE3', letterSpacing: '-0.02em' }}
            >
              Résultats <span style={{ color: '#F5C76B' }}>finaux</span>
            </h1>
            {myEntry && (
              <p style={{ color: '#B4B7CC' }}>
                Tu as terminé{' '}
                <span style={{ fontWeight: 700, color: '#F5C76B' }}>
                  {myEntry.rank === 1 ? '1er' : myEntry.rank === 2 ? '2e' : `${myEntry.rank}e`}
                </span>{' '}
                avec{' '}
                <span style={{ fontWeight: 700, color: '#F5C76B' }}>
                  {myEntry.score.toLocaleString()} pts
                </span>
              </p>
            )}
          </motion.div>

          {/* Podium */}
          {ranking.length >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, delay: 0.1 }}
              className="card pb-8 relative overflow-visible"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-6 text-center font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.16em' }}>
                Podium
              </p>
              <Podium ranking={ranking} />
            </motion.div>
          )}

          {/* Full ranking (> 3 players) */}
          {ranking.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, delay: 0.25 }}
              className="card"
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-4 font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.16em' }}>
                Classement complet
              </p>
              <div className="space-y-2">
                {ranking.slice(3).map((entry) => (
                  <motion.div
                    key={entry.playerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (entry.rank - 3) * 0.06 + 0.3, duration: duration.base }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={entry.playerId === myPlayerId
                      ? { backgroundColor: 'rgba(245,199,107,0.08)', borderColor: 'rgba(245,199,107,0.3)', borderLeftWidth: 2, borderLeftColor: '#F5C76B', fontWeight: 600 }
                      : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(242,238,227,0.07)' }
                    }
                  >
                    <span className="text-sm font-bold w-5 text-center font-mono" style={{ color: '#7A7F9B' }}>
                      {entry.rank}
                    </span>
                    <span className="flex-1 truncate" style={{ color: '#F2EEE3' }}>{entry.nickname}</span>
                    <span className="text-sm font-bold tabular-nums font-mono" style={{ color: '#F5C76B' }}>
                      {entry.score.toLocaleString()} pts
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: duration.base }}
            className="flex flex-col gap-3"
          >
            {isHost && (
              <div ref={topicsRef} className="relative">
                <label className="block text-xs font-semibold mb-1.5 font-mono uppercase tracking-wider" style={{ color: '#7A7F9B' }}>
                  Thème de la prochaine partie
                </label>
                <button
                  type="button"
                  onClick={() => setTopicsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-base"
                  style={rematchTopics.length > 0
                    ? { borderColor: '#F5C76B', backgroundColor: 'rgba(245,199,107,0.08)', color: '#F2EEE3' }
                    : { borderColor: 'rgba(242,238,227,0.10)', backgroundColor: 'transparent', color: '#7A7F9B' }
                  }
                >
                  <span className="truncate">{topicLabel}</span>
                  <span className="ml-2 shrink-0 text-xs" style={{ color: '#7A7F9B' }}>
                    {topicsOpen ? '▲' : '▼'}
                  </span>
                </button>
                {topicsOpen && (
                  <div
                    className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden"
                    style={{
                      border: '1px solid rgba(242,238,227,0.12)',
                      backgroundColor: '#0F1629',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {TOPIC_OPTIONS.map(({ id, label }) => {
                      const checked = rematchTopics.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleTopic(id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-base"
                          style={{
                            color: checked ? '#F2EEE3' : '#7A7F9B',
                            backgroundColor: checked ? 'rgba(245,199,107,0.07)' : 'transparent',
                          }}
                        >
                          <span
                            className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
                            style={{
                              border: checked ? '2px solid #F5C76B' : '2px solid rgba(242,238,227,0.2)',
                              backgroundColor: checked ? '#F5C76B' : 'transparent',
                            }}
                          >
                            {checked && (
                              <span style={{ color: '#0B1026', fontSize: '9px', fontWeight: 800, lineHeight: 1 }}>✓</span>
                            )}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                    {rematchTopics.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setRematchTopics([])}
                        className="w-full px-4 py-2 text-xs text-left transition-colors duration-base"
                        style={{ color: '#7A7F9B', borderTop: '1px solid rgba(242,238,227,0.08)' }}
                      >
                        Tout décocher
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {isHost ? (
              <button
                onClick={handleRematch}
                disabled={rematching}
                className="btn-primary text-center"
              >
                {rematching ? 'Création en cours…' : 'Nouvelle partie'}
              </button>
            ) : (
              <Link to="/create" onClick={reset} className="btn-primary text-center">
                Nouvelle partie
              </Link>
            )}
            <Link to="/" onClick={reset} className="btn-secondary text-center">
              Accueil
            </Link>
          </motion.div>

          {/* Footer quote */}
          <p className="text-center text-xs font-mono pb-4" style={{ color: '#7A7F9B', opacity: 0.6 }}>
            « L'Histoire est un éternel recommencement. »
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
