import { motion, useReducedMotion } from 'framer-motion';
import { duration } from '../styles/tokens';

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

// 4 muted hues on dark surface — not Kahoot, not tricolore
const CHOICE_COLORS = [
  {
    idle: { border: 'rgba(99,102,241,0.25)', bg: '#1A2148' },
    hover: { border: 'rgba(99,102,241,0.5)', bg: 'rgba(99,102,241,0.08)' },
    selected: { border: 'rgba(99,102,241,0.7)', bg: 'rgba(99,102,241,0.15)' },
    labelIdle: { bg: 'rgba(99,102,241,0.18)', color: '#a5b4fc' },
    labelSelected: { bg: 'rgba(99,102,241,0.35)', color: '#c7d2fe' },
  },
  {
    idle: { border: 'rgba(139,92,246,0.25)', bg: '#1A2148' },
    hover: { border: 'rgba(139,92,246,0.5)', bg: 'rgba(139,92,246,0.08)' },
    selected: { border: 'rgba(139,92,246,0.7)', bg: 'rgba(139,92,246,0.15)' },
    labelIdle: { bg: 'rgba(139,92,246,0.18)', color: '#c4b5fd' },
    labelSelected: { bg: 'rgba(139,92,246,0.35)', color: '#ddd6fe' },
  },
  {
    idle: { border: 'rgba(20,184,166,0.25)', bg: '#1A2148' },
    hover: { border: 'rgba(20,184,166,0.5)', bg: 'rgba(20,184,166,0.08)' },
    selected: { border: 'rgba(20,184,166,0.7)', bg: 'rgba(20,184,166,0.15)' },
    labelIdle: { bg: 'rgba(20,184,166,0.18)', color: '#5eead4' },
    labelSelected: { bg: 'rgba(20,184,166,0.35)', color: '#99f6e4' },
  },
  {
    idle: { border: 'rgba(245,199,107,0.20)', bg: '#1A2148' },
    hover: { border: 'rgba(245,199,107,0.45)', bg: 'rgba(245,199,107,0.07)' },
    selected: { border: 'rgba(245,199,107,0.65)', bg: 'rgba(245,199,107,0.12)' },
    labelIdle: { bg: 'rgba(245,199,107,0.15)', color: '#F5C76B' },
    labelSelected: { bg: 'rgba(245,199,107,0.28)', color: '#fde68a' },
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
    <div className="space-y-5">
      <motion.h2
        initial={{ opacity: 0, y: shouldReduce ? 0 : -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.base }}
        className="text-xl font-semibold leading-snug"
        style={{ color: '#F2EEE3', fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
      >
        {text}
      </motion.h2>

      {/* 2×2 grid on desktop, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {choices.map((choice, i) => {
          const c = CHOICE_COLORS[i];
          const isSelected = selectedIndex === i;
          const isDimmed = disabled && !isSelected;

          const borderColor = isSelected ? c.selected.border : c.idle.border;
          const bgColor = isSelected ? c.selected.bg : c.idle.bg;

          return (
            <motion.button
              key={i}
              initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: isDimmed ? 0.45 : 1, y: 0 }}
              transition={{ duration: duration.base, delay: i * 0.07 }}
              whileTap={!disabled && !shouldReduce ? { scale: 0.96 } : undefined}
              onClick={() => !disabled && onSelect(i)}
              disabled={disabled}
              className="w-full text-left px-4 py-3.5 min-h-[52px] rounded-xl border-2 font-medium transition-all disabled:cursor-not-allowed"
              style={{
                borderColor,
                backgroundColor: bgColor,
                color: '#F2EEE3',
                transitionDuration: '150ms',
              }}
              onMouseEnter={(e) => {
                if (disabled || isSelected) return;
                (e.currentTarget as HTMLButtonElement).style.borderColor = c.hover.border;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.hover.bg;
              }}
              onMouseLeave={(e) => {
                if (disabled || isSelected) return;
                (e.currentTarget as HTMLButtonElement).style.borderColor = c.idle.border;
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = c.idle.bg;
              }}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center transition-all"
                  style={isSelected ? { backgroundColor: c.labelSelected.bg, color: c.labelSelected.color, transform: 'scale(1.1)' } : { backgroundColor: c.labelIdle.bg, color: c.labelIdle.color }}
                >
                  {CHOICE_LABELS[i]}
                </span>
                {choice}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
