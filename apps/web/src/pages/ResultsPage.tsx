import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Podium from '../components/Podium';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

const CONFETTI_PARTICLES = [
  { tx: '-60px', ty: '70px', color: '#F5C76B', delay: '0s' },
  { tx: '65px', ty: '80px', color: '#FF6B5B', delay: '0.1s' },
  { tx: '-30px', ty: '100px', color: '#F5C76B', delay: '0.18s' },
  { tx: '85px', ty: '55px', color: '#FF6B5B', delay: '0.12s' },
  { tx: '-8px', ty: '120px', color: '#F5C76B', delay: '0.24s' },
  { tx: '-80px', ty: '90px', color: '#FF6B5B', delay: '0.06s' },
  { tx: '48px', ty: '110px', color: '#F5C76B', delay: '0.28s' },
  { tx: '-50px', ty: '60px', color: '#FF6B5B', delay: '0.34s' },
] as const;

function ConfettiBurst() {
  return (
    <div className="relative w-0 h-0 pointer-events-none" aria-hidden>
      {CONFETTI_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-sm"
          style={{
            left: '50%',
            top: '50%',
            backgroundColor: p.color,
            // @ts-ignore CSS custom properties
            '--tx': p.tx,
            '--ty': p.ty,
            animation: `confettiFall 1.4s cubic-bezier(.2,.7,.2,1) ${p.delay} forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const { ranking, myPlayerId, reset } = useGameStore();
  const myEntry = ranking.find((r) => r.playerId === myPlayerId);
  const isWinner = myEntry?.rank === 1;

  return (
    <PageTransition>
      <div className="min-h-screen p-6 flex flex-col items-center">
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
            >
              {/* Confetti on winner */}
              {isWinner && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  <ConfettiBurst />
                </div>
              )}
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
            <Link to="/create" onClick={reset} className="btn-primary text-center">
              Nouvelle partie
            </Link>
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
