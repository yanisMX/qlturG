// Design tokens consumed by components for framer-motion transitions and inline styles.
// Tailwind class equivalents are documented in tailwind.config.js.

export const duration = {
  fast: 0.15,   // hover micro-interactions
  base: 0.25,   // standard transitions, page exit/enter
  slow: 0.4,    // reveals, page entrances
} as const;

export const colors = {
  primary: '#4338ca',       // indigo-700 / navy-700
  primaryLight: '#eef2ff',  // indigo-50 / navy-50
  accent: '#8b5cf6',        // violet-500
  cyan: '#22d3ee',          // cyan-400
  success: '#10b981',       // emerald-500
  error: '#f43f5e',         // rose-500
  gold: '#fbbf24',          // amber-400 / or-400
} as const;

export const shadow = {
  card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
  cardHover: '0 4px 12px -2px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.08)',
} as const;
