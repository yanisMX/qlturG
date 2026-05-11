import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { duration } from '../styles/tokens';

interface TimerProps {
  endsAt: string;
  onExpire?: () => void;
}

export default function Timer({ endsAt, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(10);
  const calledRef = useRef(false);

  useEffect(() => {
    calledRef.current = false;

    const tick = () => {
      const now = Date.now();
      const end = new Date(endsAt).getTime();
      const diff = Math.max(0, end - now);
      const secs = Math.ceil(diff / 1000);
      setRemaining(secs);

      if (diff <= 0 && !calledRef.current) {
        calledRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  const pct = (remaining / 10) * 100;

  const barColor =
    remaining > 5
      ? 'bg-emerald-500'
      : remaining > 2
        ? 'bg-amber-400'
        : 'bg-rose-500';

  const textColor =
    remaining <= 2 ? 'text-rose-500' : remaining <= 5 ? 'text-amber-500' : 'text-slate-700';

  const isPulsing = remaining <= 3;

  return (
    <div className={`flex items-center gap-3 ${isPulsing ? 'animate-pulse' : ''}`}>
      {/* Progress bar — scaleX from left to avoid animating width */}
      <div className="relative flex-1 h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-0 rounded-full origin-left ${barColor}`}
          style={{ scaleX: pct / 100 }}
          transition={{ duration: duration.fast }}
        />
      </div>

      <span
        className={`text-2xl font-bold tabular-nums w-8 text-right transition-colors duration-base ${textColor}`}
      >
        {remaining}
      </span>
    </div>
  );
}
