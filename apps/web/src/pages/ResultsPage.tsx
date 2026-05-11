import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Podium from '../components/Podium';

export default function ResultsPage() {
  const { ranking, myPlayerId, reset } = useGameStore();

  const myEntry = ranking.find((r) => r.playerId === myPlayerId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8 mt-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-navy-800 mb-1">Résultats finaux</h1>
          {myEntry && (
            <p className="text-slate-500">
              Vous avez terminé{' '}
              <span className="font-bold text-navy-700">
                {myEntry.rank === 1
                  ? '1er'
                  : myEntry.rank === 2
                  ? '2e'
                  : `${myEntry.rank}e`}
              </span>{' '}
              avec{' '}
              <span className="font-bold text-navy-700">
                {myEntry.score.toLocaleString()} points
              </span>
            </p>
          )}
        </div>

        {ranking.length >= 1 && (
          <div className="card pb-8">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6 text-center">
              Podium
            </h2>
            <Podium ranking={ranking} />
          </div>
        )}

        {ranking.length > 3 && (
          <div className="card">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
              Classement complet
            </h2>
            <div className="space-y-2">
              {ranking.map((entry) => (
                <motion.div
                  key={entry.playerId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: entry.rank * 0.05 }}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl border',
                    entry.playerId === myPlayerId
                      ? 'bg-navy-50 border-navy-200 font-semibold'
                      : 'bg-white border-slate-100',
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
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to="/create"
            onClick={reset}
            className="btn-primary text-center"
          >
            Nouvelle partie
          </Link>
          <Link to="/" onClick={reset} className="btn-secondary text-center">
            Accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
