import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import UserAvatar from '../components/UserAvatar';
import { FloatingNapoleon, FloatingMarianne } from '../components/HistoryCharacters';
import { useAuthStore } from '../store/authStore';
import { api, LeaderboardEntry, MyPosition, Tier } from '../lib/api';
import { duration } from '../styles/tokens';

const TIER_ICON: Record<Tier, string> = { PLATINUM: '💎', GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉' };
const TIER_COLOR: Record<Tier, string> = {
  PLATINUM: '#A8D8EA',
  GOLD: '#F5C76B',
  SILVER: '#B4B7CC',
  BRONZE: '#CD7F32',
};

export default function HomePage() {
  const { user, token, isLoading } = useAuthStore();
  const [top5, setTop5] = useState<LeaderboardEntry[]>([]);
  const [myPos, setMyPos] = useState<MyPosition | null>(null);

  useEffect(() => {
    api.getLeaderboard(1, 5).then((d) => setTop5(d.entries)).catch(() => null);
  }, []);

  useEffect(() => {
    if (!token) return;
    api.getMyPosition(token).then(setMyPos).catch(() => null);
  }, [token]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:p-6 pb-safe" style={{ position: 'relative' }}>

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

        {/* Version badge — top left */}
        <div className="fixed top-4 left-4 z-10">
          <span
            className="text-xs font-mono px-2 py-1 rounded-full"
            style={{ color: '#7A7F9B', border: '1px solid rgba(180,183,204,0.15)', backgroundColor: 'rgba(180,183,204,0.05)' }}
          >
            v{__APP_VERSION__}
          </span>
        </div>

        {/* User chip — top right */}
        {!isLoading && (
          <div className="fixed top-4 right-4 z-10">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full pl-1 pr-3 sm:pr-4 py-1 transition-all duration-base"
                style={{ backgroundColor: 'rgba(242,238,227,0.06)', border: '1px solid rgba(242,238,227,0.14)' }}
              >
                <UserAvatar user={user} size={28} />
                <span className="text-sm font-semibold max-w-[80px] sm:max-w-[120px] truncate" style={{ color: '#F2EEE3' }}>
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
          className="text-center mb-6 sm:mb-10"
        >
          <div className="flex justify-center mb-4 sm:mb-6" style={{ animation: 'mascotFloat 5s ease-in-out infinite' }}>
            <svg viewBox="0 0 320 320" className="w-28 h-28 sm:w-40 sm:h-40" aria-label="Qltur G — icône principale">
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

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-2"
            style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif', letterSpacing: '-0.03em', color: '#F2EEE3' }}
          >
            Qltur <span style={{ color: '#F5C76B' }}>G</span>
          </h1>

          <p style={{ color: '#7A7F9B', fontFamily: '"Geist Mono", monospace', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase' }} className="mb-3 sm:mb-4">
            Quiz · Histoire · Multi
          </p>

          <p style={{ color: '#B4B7CC' }} className="text-sm sm:text-base max-w-xs sm:max-w-sm mx-auto leading-relaxed">
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

        {/* Leaderboard widget */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.slow, delay: 0.28 }}
          className="w-full max-w-xs mt-6"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(242,238,227,0.08)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(242,238,227,0.06)' }}
            >
              <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.14em' }}>
                Classement · Cette semaine
              </span>
              <Link to="/leaderboard" className="text-xs font-semibold font-mono transition-colors" style={{ color: '#F5C76B' }}>
                Tout voir →
              </Link>
            </div>

            {/* Top 5 */}
            <div className="px-3 py-2 space-y-1">
              {top5.length === 0 ? (
                <p className="text-xs text-center py-4 font-mono" style={{ color: '#7A7F9B' }}>
                  Aucun joueur classé — jouez pour apparaître !
                </p>
              ) : (
                top5.map((entry) => {
                  const isMe = entry.userId === user?.id;
                  const rankColors = ['#F5C76B', '#B4B7CC', '#CD7F32'];
                  return (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors"
                      style={isMe
                        ? { backgroundColor: 'rgba(245,199,107,0.08)', border: '1px solid rgba(245,199,107,0.2)' }
                        : { border: '1px solid transparent' }
                      }
                    >
                      <span
                        className="w-5 text-center text-xs font-bold font-mono shrink-0"
                        style={{ color: entry.rank <= 3 ? rankColors[entry.rank - 1] : '#7A7F9B' }}
                      >
                        {entry.rank <= 3 ? ['★', '✦', '◆'][entry.rank - 1] : `#${entry.rank}`}
                      </span>
                      <UserAvatar user={{ pseudo: entry.pseudo, avatarUrl: entry.avatarUrl }} size={24} />
                      <span className="flex-1 truncate text-sm font-semibold" style={{ color: isMe ? '#F5C76B' : '#F2EEE3' }}>
                        {entry.pseudo}
                      </span>
                      <span
                        className="text-xs font-bold font-mono shrink-0"
                        style={{ color: TIER_COLOR[entry.tier] }}
                      >
                        {TIER_ICON[entry.tier]}
                      </span>
                      <span className="text-xs font-bold font-mono tabular-nums shrink-0" style={{ color: '#F5C76B' }}>
                        {entry.points.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* My position — if logged in and not in top 5 */}
            {myPos && !top5.some((e) => e.userId === user?.id) && (
              <div
                className="px-3 pb-2"
              >
                <div
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(245,199,107,0.08)', border: '1px solid rgba(245,199,107,0.2)', borderTop: '1px solid rgba(242,238,227,0.08)', marginTop: 4 }}
                >
                  <span className="w-5 text-center text-xs font-bold font-mono shrink-0" style={{ color: '#7A7F9B' }}>
                    #{myPos.rank}
                  </span>
                  <UserAvatar user={{ pseudo: myPos.pseudo, avatarUrl: myPos.avatarUrl }} size={24} />
                  <span className="flex-1 truncate text-sm font-semibold" style={{ color: '#F5C76B' }}>
                    {myPos.pseudo}
                    <span className="ml-1 text-xs font-mono" style={{ color: '#7A7F9B' }}>(vous)</span>
                  </span>
                  <span className="text-xs font-bold font-mono shrink-0" style={{ color: TIER_COLOR[myPos.tier] }}>
                    {TIER_ICON[myPos.tier]}
                  </span>
                  <span className="text-xs font-bold font-mono tabular-nums shrink-0" style={{ color: '#F5C76B' }}>
                    {myPos.points.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            )}

            {/* Login prompt */}
            {!user && !isLoading && (
              <div
                className="px-4 py-2.5 text-center"
                style={{ borderTop: '1px solid rgba(242,238,227,0.06)' }}
              >
                <Link to="/login" className="text-xs font-semibold font-mono transition-colors" style={{ color: '#7A7F9B' }}>
                  <span style={{ color: '#F5C76B' }}>Connectez-vous</span> pour apparaître dans le classement
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: duration.base }}
          className="flex flex-wrap justify-center gap-2 mt-8"
        >
          {[
            'Jusqu\'à 12 joueurs',
            'QCM · 10 secondes',
            'Classement en direct',
            'Bonus de rapidité',
          ].map((label) => (
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
