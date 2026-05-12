/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Qltur G — Indigo Nuit palette
        bg: { DEFAULT: '#0B1026', 2: '#131A3A' },
        surface: '#1A2148',
        ink: { DEFAULT: '#F2EEE3', dim: '#B4B7CC', mute: '#7A7F9B' },
        accent: '#F5C76B',
        coral: '#FF6B5B',
        // navy remapped to brand gold for backward compat
        navy: {
          50: '#1A2148',
          100: '#131A3A',
          200: 'rgba(242,238,227,0.10)',
          500: '#F5C76B',
          600: '#e6b54f',
          700: '#F5C76B',
          800: '#d9a43a',
          900: '#c8893a',
        },
        rouge: {
          500: '#FF6B5B',
          600: '#e85a4a',
        },
        or: {
          400: '#F5C76B',
          500: '#e6b54f',
        },
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      animation: {
        shake: 'shake 350ms ease-in-out',
        'float-1': 'float1 25s ease-in-out infinite',
        'float-2': 'float2 30s ease-in-out infinite',
        'float-3': 'float3 20s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        progress: 'progress linear',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
        'avatar-pop': 'avatarPop 280ms cubic-bezier(.2,.7,.2,1) forwards',
        'mascot-float': 'mascotFloat 5s ease-in-out infinite',
        'ticker-scroll': 'tickerScroll 28s linear infinite',
        'confetti-fall': 'confettiFall 1.4s cubic-bezier(.2,.7,.2,1) forwards',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        float1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(40px, -30px) scale(1.08)' },
        },
        float2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-30px, 20px) scale(0.95)' },
          '66%': { transform: 'translate(20px, -10px) scale(1.05)' },
        },
        float3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-20px, 30px) scale(1.06)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        timerPulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255,107,91,0.45)' },
          '50%': { transform: 'scale(1.07)', boxShadow: '0 0 0 10px rgba(255,107,91,0)' },
        },
        avatarPop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.12)', opacity: '1' },
          '85%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        mascotFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-4px) rotate(2deg)' },
        },
        tickerScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        confettiFall: {
          '0%': { transform: 'translate(-50%,-50%) translate(0,-30px) rotate(0deg)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translate(-50%,-50%) translate(var(--tx),var(--ty)) rotate(540deg)', opacity: '0' },
        },
      },
      boxShadow: {
        card: '0 2px 8px 0 rgb(0 0 0 / 0.35)',
        'card-hover': '0 4px 20px -2px rgb(0 0 0 / 0.5)',
        'glow-accent': '0 0 0 3px rgba(245,199,107,0.3)',
        'glow-coral': '0 0 0 3px rgba(255,107,91,0.3)',
        'glow-success': '0 0 0 3px rgba(245,199,107,0.25)',
        'glow-error': '0 0 0 3px rgba(255,107,91,0.25)',
      },
    },
  },
  plugins: [],
};
