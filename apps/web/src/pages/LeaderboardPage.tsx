import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { api, LeaderboardEntry, LeaderboardPage as LeaderboardData, MyPosition, Tier } from '../lib/api';
import UserAvatar from '../components/UserAvatar';
import PageTransition from '../components/PageTransition';

const TIER_ICON: Record<Tier, string> = {
  PLATINUM: '💎',
  GOLD: '🥇',
  SILVER: '🥈',
  BRONZE: '🥉',
};

const TIER_LABEL: Record<Tier, string> = {
  PLATINUM: 'Platine',
  GOLD: 'Or',
  SILVER: 'Argent',
  BRONZE: 'Bronze',
};

const TIER_COLOR: Record<Tier, string> = {
  PLATINUM: '#A8D8EA',
  GOLD: '#F5C76B',
  SILVER: '#B4B7CC',
  BRONZE: '#CD7F32',
};

function useCountdown(targetIso: string | null) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining('Reset en cours…'); return; }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(d > 0 ? `${d}j ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return remaining;
}

function TierBadge({ tier, size = 'sm' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const pad = size === 'md' ? 'px-2.5 py-1' : 'px-1.5 py-0.5';
  const text = size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold font-mono ${pad} ${text}`}
      style={{
        color: TIER_COLOR[tier],
        backgroundColor: `${TIER_COLOR[tier]}18`,
        border: `1px solid ${TIER_COLOR[tier]}40`,
      }}
    >
      {TIER_ICON[tier]} {TIER_LABEL[tier]}
    </span>
  );
}

function RankRow({
  entry,
  isMe,
  highlight,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  highlight?: boolean;
}) {
  const isTop3 = entry.rank <= 3;
  const crownColors = ['#F5C76B', '#B4B7CC', '#CD7F32'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
      style={
        isMe || highlight
          ? {
              backgroundColor: 'rgba(245,199,107,0.08)',
              borderColor: 'rgba(245,199,107,0.35)',
              borderLeftWidth: 3,
              borderLeftColor: '#F5C76B',
            }
          : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(242,238,227,0.08)' }
      }
    >
      <span
        className="w-7 text-center font-bold font-mono text-sm shrink-0"
        style={{ color: isTop3 ? crownColors[entry.rank - 1] : '#7A7F9B' }}
      >
        {isTop3 ? ['★', '✦', '◆'][entry.rank - 1] : `#${entry.rank}`}
      </span>

      <UserAvatar
        user={{ pseudo: entry.pseudo, avatarUrl: entry.avatarUrl }}
        size={32}
      />

      <span className="flex-1 truncate font-semibold" style={{ color: isMe ? '#F5C76B' : '#F2EEE3' }}>
        {entry.pseudo}
        {isMe && <span className="ml-1.5 text-xs font-mono" style={{ color: '#7A7F9B' }}>(vous)</span>}
      </span>

      <TierBadge tier={entry.tier} />

      <div className="text-right shrink-0">
        <p className="font-bold font-mono tabular-nums text-sm" style={{ color: '#F5C76B' }}>
          {entry.points.toLocaleString('fr-FR')}
        </p>
        <p className="text-xs font-mono" style={{ color: '#7A7F9B' }}>
          {entry.quizzesPlayed} quiz
        </p>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { user, token } = useAuthStore();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [myPos, setMyPos] = useState<MyPosition | null>(null);
  const [nextReset, setNextReset] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const countdown = useCountdown(nextReset);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [lb, reset] = await Promise.all([
        api.getLeaderboard(p, LIMIT),
        api.getNextReset(),
      ]);
      setData(lb);
      setNextReset(reset.nextReset);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  useEffect(() => {
    if (!token) return;
    api.getMyPosition(token).then(setMyPos).catch(() => null);
  }, [token]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;
  const myOnCurrentPage = data?.entries.some((e) => e.userId === user?.id);

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-8 pb-safe">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <Link to="/" className="text-sm font-medium transition-colors" style={{ color: '#7A7F9B' }}>
              ← Retour
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
              Classement de la semaine
            </h1>
            {countdown && (
              <p className="text-sm font-mono mt-1" style={{ color: '#7A7F9B' }}>
                Reset dans {countdown}
              </p>
            )}
          </div>

          {/* Sticky — current user position (if not on current page) */}
          <AnimatePresence>
            {myPos && !myOnCurrentPage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card sticky top-4 z-10"
                style={{ borderColor: 'rgba(245,199,107,0.3)' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-2 font-mono" style={{ color: '#7A7F9B' }}>
                  Votre position
                </p>
                <RankRow entry={myPos} isMe highlight />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leaderboard list */}
          <div className="card">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 font-mono" style={{ color: '#7A7F9B', letterSpacing: '0.14em' }}>
              Top {data?.total ?? '—'} joueurs
            </h2>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(242,238,227,0.05)' }} />
                ))}
              </div>
            ) : data?.entries.length === 0 ? (
              <p className="text-sm text-center py-8 font-mono" style={{ color: '#7A7F9B' }}>
                Aucun joueur classé cette semaine — soyez le premier !
              </p>
            ) : (
              <div className="space-y-2">
                {data?.entries.map((entry) => (
                  <RankRow
                    key={entry.userId}
                    entry={entry}
                    isMe={entry.userId === user?.id}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(242,238,227,0.08)' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30"
                  style={{ color: '#F5C76B', border: '1px solid rgba(245,199,107,0.3)' }}
                >
                  ← Précédent
                </button>
                <span className="text-sm font-mono" style={{ color: '#7A7F9B' }}>
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30"
                  style={{ color: '#F5C76B', border: '1px solid rgba(245,199,107,0.3)' }}
                >
                  Suivant →
                </button>
              </div>
            )}
          </div>

          {!user && (
            <p className="text-center text-sm font-mono" style={{ color: '#7A7F9B' }}>
              <Link to="/login" style={{ color: '#F5C76B' }}>Connectez-vous</Link> pour apparaître dans le classement
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
