import { motion, useReducedMotion } from 'framer-motion';
import { RevealData } from '../store/gameStore';
import { duration } from '../styles/tokens';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

interface RevealCardProps {
  reveal: RevealData;
  choices: string[];
  myAnswer: number | null;
  myPlayerId: string | null;
}

export default function RevealCard({ reveal, choices, myAnswer, myPlayerId }: RevealCardProps) {
  const shouldReduce = useReducedMotion();
  const myScore = reveal.scores.find((s) => s.playerId === myPlayerId);
  const isCorrect = myAnswer === reveal.answerIndex;

  return (
    <motion.div
      initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.base }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {choices.map((choice, i) => {
          const isAnswer = i === reveal.answerIndex;
          const isWrongSelected = myAnswer === i && !isAnswer;
          const isNeutral = !isAnswer && !isWrongSelected;

          return (
            <motion.div
              key={i}
              animate={isWrongSelected && !shouldReduce ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
              whileInView={isAnswer && !shouldReduce ? { scale: [1, 1.02, 1] } : undefined}
              transition={isWrongSelected ? { duration: 0.35 } : isAnswer ? { duration: 0.6, delay: 0.15 } : {}}
              className={['flex items-center gap-3 px-5 py-4 min-h-[52px] rounded-xl border-2 font-medium transition-all',
                isAnswer ? 'choice-btn-correct' : '',
                isWrongSelected ? 'choice-btn-wrong animate-shake' : '',
              ].filter(Boolean).join(' ')}
              style={isNeutral ? { borderColor: 'rgba(242,238,227,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#7A7F9B', opacity: 0.5 } : {}}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center"
                style={{ backgroundColor: 'rgba(242,238,227,0.10)', color: '#B4B7CC' }}
              >
                {CHOICE_LABELS[i]}
              </span>
              <span className="flex-1">{choice}</span>
              {isAnswer && (
                <span className="ml-auto font-bold text-sm shrink-0" style={{ color: '#4ADE80' }}>✓</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: duration.base }}
        className="rounded-xl p-4"
        style={{ backgroundColor: 'rgba(242,238,227,0.04)', border: '1px solid rgba(242,238,227,0.08)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7F9B', fontFamily: '"Geist Mono", monospace', letterSpacing: '0.12em' }}>
          Explication
        </p>
        <p className="leading-relaxed text-sm" style={{ color: '#B4B7CC' }}>{reveal.explanation}</p>
      </motion.div>

      {myScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: duration.base }}
          className="rounded-xl p-4 text-center"
          style={isCorrect
            ? { backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', boxShadow: '0 0 0 3px rgba(74,222,128,0.06)' }
            : { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(242,238,227,0.08)' }
          }
        >
          {isCorrect ? (
            <p className="font-bold text-lg" style={{ color: '#4ADE80', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
              +{myScore.deltaThisRound.toLocaleString()} points
            </p>
          ) : (
            <p className="font-semibold" style={{ color: '#7A7F9B' }}>
              {myAnswer === null ? 'Pas de réponse' : 'Réponse incorrecte'} — 0 point
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
