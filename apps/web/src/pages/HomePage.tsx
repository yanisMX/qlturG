import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-10 bg-navy-700 rounded" />
          <div className="w-3 h-10 bg-white border border-slate-200 rounded" />
          <div className="w-3 h-10 bg-rouge-500 rounded" />
        </div>
        <h1 className="text-4xl font-extrabold text-navy-800 tracking-tight mb-3">
          Histoire de France
        </h1>
        <p className="text-slate-500 text-lg max-w-sm mx-auto leading-relaxed">
          Quiz multijoueur en temps réel — testez vos connaissances en histoire de France
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <Link to="/create" className="btn-primary text-center text-lg py-4">
          Créer une partie
        </Link>
        <Link to="/join" className="btn-secondary text-center text-lg py-4">
          Rejoindre une partie
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-16 text-slate-400 text-sm"
      >
        Jusqu'à 12 joueurs · Questions QCM · Classement en temps réel
      </motion.p>
    </div>
  );
}
