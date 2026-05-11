import { motion } from 'framer-motion';
import { RankingEntry } from '../store/gameStore';
import { duration } from '../styles/tokens';

interface PodiumProps {
  ranking: RankingEntry[];
}

const BAR_STYLES = [
  // 2nd place (left)
  {
    height: 'h-24',
    gradient: 'from-slate-300 to-slate-400',
    label: '2e',
    textColor: 'text-slate-600',
  },
  // 1st place (center)
  {
    height: 'h-36',
    gradient: 'from-amber-300 to-amber-500',
    label: '1er',
    textColor: 'text-amber-600',
  },
  // 3rd place (right)
  {
    height: 'h-16',
    gradient: 'from-amber-600 to-amber-800',
    label: '3e',
    textColor: 'text-amber-800',
  },
] as const;

export default function Podium({ ranking }: PodiumProps) {
  const top3 = ranking.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];
  const ordered = [second, first, third];
  const styleOrdered = [BAR_STYLES[0], BAR_STYLES[1], BAR_STYLES[2]];

  return (
    <div className="flex items-end justify-center gap-3">
      {ordered.map((entry, i) => {
        const style = styleOrdered[i];
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
                aria-hidden
              >
                ★
              </motion.span>
            )}

            <p className={`text-xs font-bold uppercase tracking-wide ${style.textColor}`}>
              {style.label}
            </p>
            <p className="text-sm font-semibold text-slate-700 text-center truncate w-full px-1">
              {entry.nickname}
            </p>
            <p className="text-xs font-bold text-slate-500 tabular-nums">
              {entry.score.toLocaleString()} pts
            </p>

            <div
              className={`${style.height} w-full rounded-t-xl bg-gradient-to-b ${style.gradient} flex items-start justify-center pt-3 shadow-card`}
            >
              <span className="text-xl font-black text-white/90">{entry.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
