import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import UserAvatar from '../components/UserAvatar';
import { useAuthStore } from '../store/authStore';
import { duration } from '../styles/tokens';

export default function HomePage() {
  const { user, isLoading } = useAuthStore();

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* User chip — top right */}
        {!isLoading && (
          <div className="fixed top-4 right-4">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2.5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-full pl-1 pr-4 py-1 shadow-card hover:shadow-card-hover transition-all duration-base"
              >
                <UserAvatar user={user} size={30} />
                <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                  {user.pseudo}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold bg-white/80 backdrop-blur-sm border border-slate-200/80 text-navy-700 rounded-full px-4 py-2 shadow-card hover:shadow-card-hover transition-all duration-base"
              >
                Connexion
              </Link>
            )}
          </div>
        )}

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-1.5 mb-6">
            <div className="w-2.5 h-9 bg-indigo-600 rounded-sm" />
            <div className="w-2.5 h-9 bg-white border border-slate-200 rounded-sm shadow-sm" />
            <div className="w-2.5 h-9 bg-rouge-500 rounded-sm" />
          </div>

          <h1
            className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-3"
            style={{
              background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Histoire de France
          </h1>

          <p className="text-slate-500 text-lg max-w-sm mx-auto leading-relaxed">
            Quiz multijoueur en temps réel — testez vos connaissances
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, delay: 0.15 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Link to="/create" className="btn-primary text-center text-lg py-4 rounded-2xl">
            Créer une partie
          </Link>
          <Link to="/join" className="btn-secondary text-center text-lg py-4 rounded-2xl">
            Rejoindre une partie
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: duration.base }}
          className="flex flex-wrap justify-center gap-2 mt-10"
        >
          {["Jusqu'à 12 joueurs", 'Questions QCM', 'Classement en direct', 'Bonus de rapidité'].map(
            (pill) => (
              <span
                key={pill}
                className="text-xs font-medium text-slate-500 bg-white/70 border border-slate-200/80 px-3 py-1.5 rounded-full"
              >
                {pill}
              </span>
            ),
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
