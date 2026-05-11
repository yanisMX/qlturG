import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

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
  const color =
    remaining > 5 ? 'bg-emerald-500' : remaining > 2 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${color}`}
          style={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <span
        className={`text-2xl font-bold tabular-nums w-8 text-right transition-colors duration-300 ${
          remaining <= 3 ? 'text-rose-500' : 'text-slate-700'
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}
