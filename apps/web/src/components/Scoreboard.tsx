import { motion, AnimatePresence } from 'framer-motion';
import { PlayerInfo } from '../store/gameStore';

interface ScoreboardProps {
  players: PlayerInfo[];
  myPlayerId: string | null;
  compact?: boolean;
  revealScores?: Array<{ playerId: string; deltaThisRound: number }>;
}

export default function Scoreboard({
  players,
  myPlayerId,
  compact = false,
  revealScores,
}: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sorted.map((player, idx) => {
          const delta = revealScores?.find((s) => s.playerId === player.id)?.deltaThisRound;

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-xl border',
                player.id === myPlayerId
                  ? 'bg-navy-50 border-navy-200 font-semibold'
                  : 'bg-white border-slate-100',
              ].join(' ')}
            >
              <span className="text-sm font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
              <span className="flex-1 truncate text-slate-800">{player.nickname}</span>
              {!compact && (
                <span className="text-sm font-bold text-navy-700 tabular-nums">
                  {player.score.toLocaleString()}
                </span>
              )}
              {delta !== undefined && delta > 0 && (
                <motion.span
                  key={`delta-${player.id}`}
                  initial={{ opacity: 0, scale: 0.7, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0"
                >
                  +{delta.toLocaleString()}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
