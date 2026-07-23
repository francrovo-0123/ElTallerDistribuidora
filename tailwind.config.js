/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/**/*.{html,js}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
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
          '60%': { opacity: '1', transform: 'translateY(-2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'et-badge-pop': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.18)' },
          '55%': { transform: 'scale(0.94)' },
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
          '55%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'et-btn-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          '55%': { opacity: '1', transform: 'translateY(-1px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'et-btn-tap': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(0.96)' },
          '70%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'et-btn-icon-tap': {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(0.88)' },
          '65%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'et-shine': {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)', opacity: '0' },
          '35%': { opacity: '0.55' },
          '100%': { transform: 'translateX(160%) skewX(-18deg)', opacity: '0' },
        },
        'et-ripple': {
          '0%': { transform: 'scale(0)', opacity: '0.35' },
          '70%': { opacity: '0.12' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'et-ring-in': {
          '0%': { boxShadow: '0 0 0 0 rgba(61, 82, 57, 0.35)' },
          '70%': { boxShadow: '0 0 0 6px rgba(61, 82, 57, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(61, 82, 57, 0)' },
        },
        'marquee-derecha': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        'et-fade-up': 'et-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'et-badge-pop': 'et-badge-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'et-soft-pulse': 'et-soft-pulse 2.8s ease-in-out infinite',
        'et-banner-glow': 'et-banner-glow 4s ease-in-out infinite',
        'et-state-flash': 'et-state-flash 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        'et-btn-in': 'et-btn-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        'et-btn-tap': 'et-btn-tap 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
        'et-btn-icon-tap': 'et-btn-icon-tap 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
        'et-shine': 'et-shine 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        'et-ripple': 'et-ripple 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'et-ring-in': 'et-ring-in 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
        'marquee-derecha': 'marquee-derecha 25s linear infinite',
      },
    },
  },
  plugins: [],
};

