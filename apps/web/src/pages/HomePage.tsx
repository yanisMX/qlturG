import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import UserAvatar from '../components/UserAvatar';
import { FloatingNapoleon, FloatingMarianne } from '../components/HistoryCharacters';
import { useAuthStore } from '../store/authStore';
import { duration } from '../styles/tokens';


export default function HomePage() {
  const { user, isLoading } = useAuthStore();

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ position: 'relative' }}>

        {/* Napoléon — côté gauche (desktop uniquement) */}
        <div
          className="hidden lg:block pointer-events-none select-none"
          style={{ position: 'fixed', bottom: '10%', left: '3%', zIndex: 0, opacity: 0.62 }}
        >
          <FloatingNapoleon />
        </div>

        {/* Marianne — côté droit (desktop uniquement) */}
        <div
          className="hidden lg:block pointer-events-none select-none"
          style={{ position: 'fixed', bottom: '14%', right: '3%', zIndex: 0, opacity: 0.62 }}
        >
          <FloatingMarianne />
        </div>
        {/* User chip — top right */}
        {!isLoading && (
          <div className="fixed top-4 right-4 z-10">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-full pl-1 pr-4 py-1 transition-all duration-base"
                style={{ backgroundColor: 'rgba(242,238,227,0.06)', border: '1px solid rgba(242,238,227,0.14)' }}
              >
                <UserAvatar user={user} size={30} />
                <span className="text-sm font-semibold max-w-[120px] truncate" style={{ color: '#F2EEE3' }}>
                  {user.pseudo}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold rounded-full px-4 py-2 transition-all duration-base"
                style={{ color: '#F2EEE3', backgroundColor: 'rgba(242,238,227,0.06)', border: '1px solid rgba(242,238,227,0.14)' }}
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
          {/* QG logo — animated float */}
          <div className="flex justify-center mb-6" style={{ animation: 'mascotFloat 5s ease-in-out infinite' }}>
            <svg viewBox="0 0 320 320" width="160" height="160" aria-label="Qltur G — icône principale">
              <rect x="10" y="10" width="300" height="300" rx="60" fill="rgba(245,199,107,0.10)" stroke="rgba(245,199,107,0.35)" strokeWidth="1.5"/>
              <text x="160" y="178" textAnchor="middle" dominantBaseline="central"
                fontFamily="Space Grotesk, system-ui, sans-serif" fontWeight="700" fontSize="176"
                letterSpacing="-10" fill="#F2EEE3">Q<tspan fill="#F5C76B">G</tspan></text>
              <circle cx="102" cy="188" r="5.5" fill="#F5C76B"/>
              <circle cx="160" cy="160" r="138" fill="none" stroke="rgba(242,238,227,0.14)" strokeWidth="1" strokeDasharray="2 8">
                <animateTransform attributeName="transform" type="rotate" from="0 160 160" to="360 160 160" dur="40s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>

          {/* Wordmark */}
          <h1
            className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-2"
            style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif', letterSpacing: '-0.03em', color: '#F2EEE3' }}
          >
            Qltur <span style={{ color: '#F5C76B' }}>G</span>
          </h1>

          <p style={{ color: '#7A7F9B', fontFamily: '"Geist Mono", monospace', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase' }} className="mb-4">
            Quiz · Histoire · Multi
          </p>

          <p style={{ color: '#B4B7CC' }} className="text-base max-w-sm mx-auto leading-relaxed">
            Un quiz multijoueur où chaque partie devient un quartier général d'amis.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, delay: 0.15 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Link to="/create" className="btn-primary text-center text-base py-4">
            Créer une partie
          </Link>
          <Link to="/join" className="btn-secondary text-center text-base py-4">
            Rejoindre une partie
          </Link>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: duration.base }}
          className="flex flex-wrap justify-center gap-2 mt-10"
        >
          {[
            { dot: true, label: 'Jusqu\'à 12 joueurs' },
            { dot: true, label: 'QCM · 10 secondes' },
            { dot: true, label: 'Classement en direct' },
            { dot: true, label: 'Bonus de rapidité' },
          ].map(({ label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-mono"
              style={{ color: '#7A7F9B', border: '1px solid rgba(242,238,227,0.12)', backgroundColor: 'rgba(242,238,227,0.04)', letterSpacing: '0.04em' }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#F5C76B', flexShrink: 0, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
