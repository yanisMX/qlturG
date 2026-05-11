import { motion } from 'framer-motion';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

interface QuestionCardProps {
  text: string;
  choices: string[];
  selectedIndex: number | null;
  disabled: boolean;
  onSelect: (idx: number) => void;
}

export default function QuestionCard({
  text,
  choices,
  selectedIndex,
  disabled,
  onSelect,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-slate-800 leading-snug">{text}</h2>

      <div className="grid grid-cols-1 gap-3">
        {choices.map((choice, i) => {
          const isSelected = selectedIndex === i;
          return (
            <motion.button
              key={i}
              whileHover={!disabled ? { scale: 1.01 } : undefined}
              whileTap={!disabled ? { scale: 0.99 } : undefined}
              onClick={() => !disabled && onSelect(i)}
              disabled={disabled}
              className={[
                'choice-btn',
                isSelected ? 'choice-btn-selected border-navy-600 bg-navy-50' : '',
                disabled && !isSelected ? 'opacity-60' : '',
              ].join(' ')}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-navy-100 text-navy-700 text-sm font-bold flex items-center justify-center">
                  {CHOICE_LABELS[i]}
                </span>
                {choice}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
