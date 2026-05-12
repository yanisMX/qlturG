import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  endsAt: string;
  totalSeconds?: number;
  onExpire?: () => void;
  onAlert?: (isAlert: boolean) => void;
}

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer({ endsAt, totalSeconds = 10, onExpire, onAlert }: TimerProps) {
  const [remaining, setRemaining] = useState(10);
  const calledRef = useRef(false);
  const alertRef = useRef(false);

  useEffect(() => {
    calledRef.current = false;
    alertRef.current = false;

    const tick = () => {
      const now = Date.now();
      const end = new Date(endsAt).getTime();
      const diff = Math.max(0, end - now);
      const secs = Math.ceil(diff / 1000);
      setRemaining(secs);

      const nowAlert = secs <= 5;
      if (nowAlert !== alertRef.current) {
        alertRef.current = nowAlert;
        onAlert?.(nowAlert);
      }

      if (diff <= 0 && !calledRef.current) {
        calledRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endsAt, onExpire, onAlert]);

  const pct = remaining / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE - pct * CIRCUMFERENCE;
  const isAlert = remaining <= 3;
  const strokeColor = isAlert ? '#FF6B5B' : '#F5C76B';

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative w-16 h-16 flex items-center justify-center"
        style={isAlert ? { animation: 'timerPulse 1s ease-in-out infinite' } : undefined}
      >
        <svg
          className="absolute inset-0 -rotate-90"
          width="64" height="64" viewBox="0 0 64 64"
          aria-hidden="true"
        >
          {/* Track */}
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="rgba(242,238,227,0.10)" strokeWidth="3" />
          {/* Progress */}
          <circle
            cx="32" cy="32" r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.3s' }}
          />
        </svg>
        <span
          className="relative z-10 font-mono font-bold text-xl tabular-nums"
          style={{ color: isAlert ? '#FF6B5B' : '#F2EEE3', transition: 'color 0.3s', fontFamily: '"Geist Mono", monospace' }}
        >
          {remaining}
        </span>
      </div>
    </div>
  );
}
