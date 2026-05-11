import { motion, useReducedMotion } from 'framer-motion';
import { duration } from '../styles/tokens';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduce ? 0 : -8 }}
      transition={{ duration: duration.base }}
    >
      {children}
    </motion.div>
  );
}
