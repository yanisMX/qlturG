import { motion, AnimatePresence } from 'framer-motion';
import { PlayerInfo } from '../store/gameStore';
import { duration } from '../styles/tokens';

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
          const isMe = player.id === myPlayerId;
          const isFirst = idx === 0;
          const delta = revealScores?.find((s) => s.playerId === player.id)?.deltaThisRound;

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.base }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
              style={
                isMe
                  ? { backgroundColor: 'rgba(245,199,107,0.08)', borderColor: 'rgba(245,199,107,0.35)', borderLeftWidth: 2, borderLeftColor: '#F5C76B', fontWeight: 600 }
                  : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(242,238,227,0.08)' }
              }
            >
              {/* Rank / crown */}
              <span className="text-sm font-bold w-5 text-center shrink-0 font-mono" style={{ color: '#7A7F9B' }}>
                {isFirst ? (
                  <span style={{ color: '#F5C76B' }} aria-label="1er">★</span>
                ) : (
                  idx + 1
                )}
              </span>

              <span className="flex-1 truncate" style={{ color: '#F2EEE3' }}>{player.nickname}</span>

              {!compact && (
                <span className="text-sm font-bold tabular-nums font-mono" style={{ color: '#F5C76B' }}>
                  {player.score.toLocaleString()}
                </span>
              )}

              {delta !== undefined && delta > 0 && (
                <motion.span
                  key={`delta-${player.id}`}
                  initial={{ opacity: 0, scale: 0.7, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 font-mono"
                  style={{ color: '#F5C76B', backgroundColor: 'rgba(245,199,107,0.15)', border: '1px solid rgba(245,199,107,0.3)' }}
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
