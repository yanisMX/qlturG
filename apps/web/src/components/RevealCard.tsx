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
              // Shake on wrong selected — uses translateX (transform only)
              animate={
                isWrongSelected && !shouldReduce
                  ? { x: [0, -4, 4, -3, 3, 0] }
                  : { x: 0 }
              }
              // Pulse scale on correct answer (1 iteration, 600ms)
              whileInView={
                isAnswer && !shouldReduce
                  ? { scale: [1, 1.02, 1] }
                  : undefined
              }
              transition={
                isWrongSelected
                  ? { duration: 0.35 }
                  : isAnswer
                    ? { duration: 0.6, delay: 0.15 }
                    : {}
              }
              className={[
                'flex items-center gap-3 px-5 py-4 min-h-[52px] rounded-xl border-2 font-medium transition-all',
                isAnswer ? 'choice-btn-correct' : '',
                isWrongSelected ? 'choice-btn-wrong animate-shake' : '',
                isNeutral ? 'border-slate-100 bg-slate-50/80 text-slate-400 opacity-50' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/60 text-sm font-bold flex items-center justify-center">
                {CHOICE_LABELS[i]}
              </span>
              <span className="flex-1">{choice}</span>
              {isAnswer && (
                <span className="ml-auto text-emerald-600 font-bold text-sm shrink-0">✓</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: duration.base }}
        className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4"
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          Explication
        </p>
        <p className="text-slate-700 leading-relaxed text-sm">{reveal.explanation}</p>
      </motion.div>

      {myScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: duration.base }}
          className={[
            'rounded-xl p-4 text-center border',
            isCorrect
              ? 'bg-emerald-50 border-emerald-200 shadow-glow-success'
              : 'bg-slate-50/80 border-slate-200',
          ].join(' ')}
        >
          {isCorrect ? (
            <p className="font-bold text-emerald-700 text-lg">
              +{myScore.deltaThisRound.toLocaleString()} points
            </p>
          ) : (
            <p className="font-semibold text-slate-500">
              {myAnswer === null ? 'Pas de réponse' : 'Réponse incorrecte'} — 0 point
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
