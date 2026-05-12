import { motion } from 'framer-motion';
import { RankingEntry } from '../store/gameStore';
import { duration } from '../styles/tokens';

interface PodiumProps {
  ranking: RankingEntry[];
}

// Podium: 1st full gold, 2nd 50% opacity, 3rd 30% opacity
const BAR_STYLES = [
  // 2nd place (left)
  { height: 96, opacity: 0.55, label: '2e', rankColor: '#B4B7CC' },
  // 1st place (center)
  { height: 140, opacity: 1, label: '1er', rankColor: '#0B1026' },
  // 3rd place (right)
  { height: 64, opacity: 0.32, label: '3e', rankColor: '#B4B7CC' },
] as const;

export default function Podium({ ranking }: PodiumProps) {
  const top3 = ranking.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];
  const ordered = [second, first, third];

  return (
    <div className="flex items-end justify-center gap-3">
      {ordered.map((entry, i) => {
        const style = BAR_STYLES[i];
        if (!entry) return <div key={i} className="w-28" />;

        return (
          <motion.div
            key={entry.playerId}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 + 0.1, duration: duration.slow }}
            className="flex flex-col items-center gap-1.5 w-28"
          >
            {i === 1 && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="text-2xl"
                style={{ color: '#F5C76B' }}
                aria-hidden
              >
                ★
              </motion.span>
            )}

            <p className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: i === 1 ? '#F5C76B' : '#7A7F9B', letterSpacing: '0.1em' }}>
              {style.label}
            </p>
            <p className="text-sm font-semibold text-center truncate w-full px-1" style={{ color: '#F2EEE3' }}>
              {entry.nickname}
            </p>
            <p className="text-xs font-bold tabular-nums font-mono" style={{ color: '#B4B7CC' }}>
              {entry.score.toLocaleString()} pts
            </p>

            <div
              className="w-full rounded-t-xl flex items-start justify-center pt-3"
              style={{
                height: style.height,
                background: `linear-gradient(180deg, rgba(245,199,107,${style.opacity}) 0%, rgba(245,199,107,${style.opacity * 0.7}) 100%)`,
                boxShadow: i === 1 ? '0 0 20px rgba(245,199,107,0.25)' : 'none',
              }}
            >
              <span className="text-xl font-black" style={{ color: i === 1 ? '#0B1026' : 'rgba(242,238,227,0.7)' }}>{entry.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
