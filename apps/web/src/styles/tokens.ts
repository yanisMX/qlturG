// Design tokens consumed by components for framer-motion transitions and inline styles.
// Tailwind class equivalents are documented in tailwind.config.js.

export const duration = {
  fast: 0.15,   // hover micro-interactions
  base: 0.25,   // standard transitions, page exit/enter
  slow: 0.4,    // reveals, page entrances
} as const;

// Qltur G — Indigo Nuit palette
export const colors = {
  bg: '#0B1026',
  bg2: '#131A3A',
  surface: '#1A2148',
  ink: '#F2EEE3',
  inkDim: '#B4B7CC',
  inkMute: '#7A7F9B',
  accent: '#F5C76B',   // gold — CTA, "G", podium
  coral: '#FF6B5B',    // negative feedback, errors
  line: 'rgba(242, 238, 227, 0.10)',
  lineHi: 'rgba(242, 238, 227, 0.22)',
} as const;

export const shadow = {
  card: '0 2px 8px 0 rgb(0 0 0 / 0.35)',
  cardHover: '0 4px 20px -2px rgb(0 0 0 / 0.5)',
  glowAccent: '0 0 0 3px rgba(245, 199, 107, 0.25)',
  glowCoral: '0 0 0 3px rgba(255, 107, 91, 0.25)',
} as const;
