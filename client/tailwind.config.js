import { fileURLToPath } from 'node:url';

// Absolute, forward-slashed directory of this config file, so content globs
// resolve correctly no matter which working directory the build runs from.
const root = fileURLToPath(new URL('.', import.meta.url))
  .replace(/\\/g, '/')
  .replace(/\/+$/, '');

/** @type {import('tailwindcss').Config} */
export default {
  content: [`${root}/index.html`, `${root}/src/**/*.{js,ts,jsx,tsx}`],
  theme: {
    extend: {
      colors: {
        // ChargeSense brand palette
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // primary — Electric Green
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        ink: {
          DEFAULT: '#111827', // dark
          soft: '#1f2937',
        },
        surface: '#f8fafc', // background
        muted: '#64748b', // muted text
        line: '#e2e8f0', // borders
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        'card-hover':
          '0 4px 6px -1px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        panel: '0 10px 30px -12px rgba(16, 24, 40, 0.18)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s ease-out',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
