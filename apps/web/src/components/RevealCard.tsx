import { motion } from 'framer-motion';
import { RevealData } from '../store/gameStore';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

interface RevealCardProps {
  reveal: RevealData;
  choices: string[];
  myAnswer: number | null;
  myPlayerId: string | null;
}

export default function RevealCard({ reveal, choices, myAnswer, myPlayerId }: RevealCardProps) {
  const myScore = reveal.scores.find((s) => s.playerId === myPlayerId);
  const isCorrect = myAnswer === reveal.answerIndex;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-3">
        {choices.map((choice, i) => {
          const isAnswer = i === reveal.answerIndex;
          const isWrongSelected = myAnswer === i && !isAnswer;

          return (
            <div
              key={i}
              className={[
                'flex items-center gap-3 px-5 py-4 rounded-xl border-2 font-medium transition-all',
                isAnswer ? 'choice-btn-correct border-emerald-500' : '',
                isWrongSelected ? 'choice-btn-wrong border-rose-400' : '',
                !isAnswer && !isWrongSelected ? 'border-slate-100 bg-slate-50 text-slate-500' : '',
              ].join(' ')}
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/60 text-sm font-bold flex items-center justify-center">
                {CHOICE_LABELS[i]}
              </span>
              {choice}
              {isAnswer && (
                <span className="ml-auto text-emerald-600 font-bold text-sm">Bonne réponse</span>
              )}
            </div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-50 border border-slate-200 rounded-xl p-4"
      >
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Explication
        </p>
        <p className="text-slate-700 leading-relaxed">{reveal.explanation}</p>
      </motion.div>

      {myScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`rounded-xl p-4 text-center ${
            isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100 border border-slate-200'
          }`}
        >
          {isCorrect ? (
            <p className="font-bold text-emerald-700 text-lg">
              +{myScore.deltaThisRound} points
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
