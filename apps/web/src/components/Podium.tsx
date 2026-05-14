import { motion } from 'framer-motion';
import { RankingEntry } from '../store/gameStore';

interface PodiumProps {
  ranking: RankingEntry[];
}

const MEDALS = ['🥈', '🥇', '🥉'];

// [2nd left, 1st center, 3rd right]
const BAR_CONFIG = [
  { height: 100, goldOpacity: 0.5, rankLabel: '2e', textColor: '#B4B7CC', delay: 0.15 },
  { height: 148, goldOpacity: 1.0, rankLabel: '1er', textColor: '#0B1026', delay: 0.0 },
  { height: 68,  goldOpacity: 0.28, rankLabel: '3e', textColor: '#B4B7CC', delay: 0.3 },
] as const;

// Generates a deterministic color from nickname
function avatarColor(nickname: string) {
  const COLORS = ['#4338ca', '#7c3aed', '#0891b2', '#d97706', '#db2777', '#0f766e', '#dc2626', '#059669'];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Podium({ ranking }: PodiumProps) {
  const top3 = ranking.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];
  // Display order: 2nd left, 1st center, 3rd right
  const ordered = [second, first, third];

  return (
    <div className="flex items-end justify-center gap-1 sm:gap-2 w-full">
      {ordered.map((entry, i) => {
        const cfg = BAR_CONFIG[i];

        if (!entry) {
          return (
            <div key={i} className="flex-1 min-w-0 max-w-[7rem] flex flex-col items-center" style={{ marginBottom: 0 }}>
              <div
                className="w-full rounded-t-xl opacity-20"
                style={{
                  height: cfg.height,
                  background: `linear-gradient(180deg, rgba(245,199,107,${cfg.goldOpacity}) 0%, rgba(245,199,107,${cfg.goldOpacity * 0.6}) 100%)`,
                }}
              />
            </div>
          );
        }

        const isFirst = i === 1;
        const initials = (entry.nickname[0] ?? '?').toUpperCase();
        const avatarBg = avatarColor(entry.nickname);

        return (
          <div key={entry.playerId} className="flex-1 min-w-0 max-w-[7rem] flex flex-col items-center gap-1">
            {/* Medal */}
            <motion.span
              initial={{ opacity: 0, scale: 0, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: cfg.delay + 0.5, type: 'spring', stiffness: 280, damping: 16 }}
              className="text-2xl leading-none"
              style={{ animation: isFirst ? 'medalPop 0.6s 0.5s both' : undefined }}
              aria-hidden
            >
              {MEDALS[i]}
            </motion.span>

            {/* Avatar circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: cfg.delay + 0.3, type: 'spring', stiffness: 260, damping: 14 }}
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base shrink-0"
              style={{
                backgroundColor: avatarBg,
                boxShadow: isFirst ? `0 0 0 3px rgba(245,199,107,0.6), 0 0 16px rgba(245,199,107,0.3)` : `0 0 0 2px rgba(242,238,227,0.15)`,
              }}
            >
              {initials}
            </motion.div>

            {/* Nickname */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: cfg.delay + 0.35 }}
              className="text-xs font-semibold text-center truncate w-full px-1"
              style={{ color: isFirst ? '#F5C76B' : '#F2EEE3' }}
            >
              {entry.nickname}
            </motion.p>

            {/* Score */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: cfg.delay + 0.4 }}
              className="text-xs font-bold tabular-nums font-mono"
              style={{ color: isFirst ? '#F5C76B' : '#7A7F9B' }}
            >
              {entry.score.toLocaleString()} pts
            </motion.p>

            {/* Bar — grows from bottom */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: cfg.delay, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: '100%',
                height: cfg.height,
                transformOrigin: 'bottom',
                borderRadius: '10px 10px 0 0',
                background: `linear-gradient(180deg, rgba(245,199,107,${cfg.goldOpacity}) 0%, rgba(245,199,107,${cfg.goldOpacity * 0.55}) 100%)`,
                boxShadow: isFirst ? '0 0 32px rgba(245,199,107,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
