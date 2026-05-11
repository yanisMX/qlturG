import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Podium from '../components/Podium';
import PageTransition from '../components/PageTransition';
import { duration } from '../styles/tokens';

export default function ResultsPage() {
  const { ranking, myPlayerId, reset } = useGameStore();

  const myEntry = ranking.find((r) => r.playerId === myPlayerId);

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
              style={{
                background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Résultats finaux
            </h1>
            {myEntry && (
              <p className="text-slate-500">
                Vous avez terminé{' '}
                <span className="font-bold text-navy-700">
                  {myEntry.rank === 1 ? '1er' : myEntry.rank === 2 ? '2e' : `${myEntry.rank}e`}
                </span>{' '}
                avec{' '}
                <span className="font-bold text-navy-700">
                  {myEntry.score.toLocaleString()} points
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
              className="card pb-8"
            >
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6 text-center">
                Podium
              </h2>
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
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
                Classement complet
              </h2>
              <div className="space-y-2">
                {ranking.slice(3).map((entry) => (
                  <motion.div
                    key={entry.playerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (entry.rank - 3) * 0.06 + 0.3, duration: duration.base }}
                    className={[
                      'flex items-center gap-3 px-4 py-3 rounded-xl border',
                      entry.playerId === myPlayerId
                        ? 'bg-navy-50 border-l-2 border-l-navy-500 border-navy-200 font-semibold'
                        : 'bg-white/60 border-slate-100',
                    ].join(' ')}
                  >
                    <span className="text-sm font-bold text-slate-400 w-5 text-center">
                      {entry.rank}
                    </span>
                    <span className="flex-1 truncate text-slate-800">{entry.nickname}</span>
                    <span className="text-sm font-bold text-navy-700 tabular-nums">
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
        </div>
      </div>
    </PageTransition>
  );
}
