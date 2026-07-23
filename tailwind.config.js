/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        taller: {
          DEFAULT: '#4A5D3F',
          dark: '#3C4C33',
          sidebar: '#1E271C',
          accent: '#728866',
          light: '#F8F9FA',
        },
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        180: '180ms',
        280: '280ms',
        420: '420ms',
      },
      keyframes: {
        'et-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'et-badge-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.22)' },
          '100%': { transform: 'scale(1)' },
        },
        'et-soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.72' },
        },
        'et-banner-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.88' },
        },
        'et-state-flash': {
          '0%': { opacity: '0.55', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'marquee-derecha': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        'et-fade-up': 'et-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'et-badge-pop': 'et-badge-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'et-soft-pulse': 'et-soft-pulse 2.8s ease-in-out infinite',
        'et-banner-glow': 'et-banner-glow 4s ease-in-out infinite',
        'et-state-flash': 'et-state-flash 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'marquee-derecha': 'marquee-derecha 25s linear infinite',
      },
    },
  },
  plugins: [],
};
