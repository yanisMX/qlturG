import { motion, useReducedMotion } from 'framer-motion';
import { duration } from '../styles/tokens';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

// 4 harmonious hues — avoids the jarring quadricolore Kahoot look
const CHOICE_COLORS = [
  {
    idle: 'border-indigo-200 bg-white/80 text-slate-800',
    hover: 'hover:border-indigo-400 hover:bg-indigo-50/70 hover:shadow-card-hover',
    hoverTransform: 'hover:-translate-y-0.5',
    selected: 'border-indigo-500 bg-indigo-50 shadow-card',
    labelIdle: 'bg-indigo-100 text-indigo-700',
    labelSelected: 'bg-indigo-200 text-indigo-800',
  },
  {
    idle: 'border-violet-200 bg-white/80 text-slate-800',
    hover: 'hover:border-violet-400 hover:bg-violet-50/70 hover:shadow-card-hover',
    hoverTransform: 'hover:-translate-y-0.5',
    selected: 'border-violet-500 bg-violet-50 shadow-card',
    labelIdle: 'bg-violet-100 text-violet-700',
    labelSelected: 'bg-violet-200 text-violet-800',
  },
  {
    idle: 'border-cyan-200 bg-white/80 text-slate-800',
    hover: 'hover:border-cyan-400 hover:bg-cyan-50/70 hover:shadow-card-hover',
    hoverTransform: 'hover:-translate-y-0.5',
    selected: 'border-cyan-500 bg-cyan-50 shadow-card',
    labelIdle: 'bg-cyan-100 text-cyan-700',
    labelSelected: 'bg-cyan-200 text-cyan-800',
  },
  {
    idle: 'border-rose-200 bg-white/80 text-slate-800',
    hover: 'hover:border-rose-400 hover:bg-rose-50/70 hover:shadow-card-hover',
    hoverTransform: 'hover:-translate-y-0.5',
    selected: 'border-rose-500 bg-rose-50 shadow-card',
    labelIdle: 'bg-rose-100 text-rose-700',
    labelSelected: 'bg-rose-200 text-rose-800',
  },
] as const;

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
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: duration.slow }}
      className="space-y-5"
    >
      <h2 className="text-xl font-semibold text-slate-800 leading-snug">{text}</h2>

      {/* 2×2 grid on desktop, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {choices.map((choice, i) => {
          const colors = CHOICE_COLORS[i];
          const isSelected = selectedIndex === i;
          const isWaiting = disabled && isSelected;
          const isDimmed = disabled && !isSelected;

          return (
            <motion.button
              key={i}
              whileTap={!disabled && !shouldReduce ? { scale: 0.98 } : undefined}
              onClick={() => !disabled && onSelect(i)}
              disabled={disabled}
              className={[
                'w-full text-left px-4 py-3.5 min-h-[52px] rounded-xl border-2 font-medium',
                'transition-all duration-fast disabled:cursor-not-allowed',
                isSelected ? colors.selected : colors.idle,
                !disabled ? `${colors.hover} ${shouldReduce ? '' : colors.hoverTransform}` : '',
                isDimmed ? 'opacity-50' : '',
                isWaiting ? 'opacity-90' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className={[
                    'flex-shrink-0 w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center transition-colors',
                    isSelected ? colors.labelSelected : colors.labelIdle,
                  ].join(' ')}
                >
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
