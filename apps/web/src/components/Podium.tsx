import { motion } from 'framer-motion';
import { RankingEntry } from '../store/gameStore';

interface PodiumProps {
  ranking: RankingEntry[];
}

export default function Podium({ ranking }: PodiumProps) {
  const top3 = ranking.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];

  const heights = ['h-32', 'h-24', 'h-16'];
  const medals = ['🥇', '🥈', '🥉'];
  const order = [second, first, third];
  const displayHeights = [heights[1], heights[0], heights[2]];
  const displayMedals = [medals[1], medals[0], medals[2]];

  return (
    <div className="flex items-end justify-center gap-4">
      {order.map((entry, i) => {
        if (!entry) return <div key={i} className="w-28" />;
        return (
          <motion.div
            key={entry.playerId}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 + 0.2 }}
            className="flex flex-col items-center gap-2 w-28"
          >
            <span className="text-2xl">{displayMedals[i]}</span>
            <p className="text-sm font-semibold text-slate-700 text-center truncate w-full px-1">
              {entry.nickname}
            </p>
            <p className="text-xs font-bold text-navy-600">{entry.score.toLocaleString()} pts</p>
            <div
              className={`${displayHeights[i]} w-full rounded-t-xl ${
                i === 1
                  ? 'bg-or-400'
                  : i === 0
                  ? 'bg-slate-300'
                  : 'bg-amber-700/60'
              } flex items-center justify-center`}
            >
              <span className="text-2xl font-black text-white/80">{entry.rank}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
