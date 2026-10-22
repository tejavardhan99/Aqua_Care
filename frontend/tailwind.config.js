/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0e4d6a',
          800: '#0b374d',
          900: '#062a3d',
          950: '#031722',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0e7490',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        cyan: {
          400: '#22d3ee',
        },
        seafoam: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#cffafe',
          300: '#99f6e4',
          400: '#5eead4',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        status: {
          safe: '#10b981',
          'safe-bg': 'rgba(16, 185, 129, 0.12)',
          'safe-border': 'rgba(16, 185, 129, 0.3)',
          warning: '#f59e0b',
          'warning-bg': 'rgba(245, 158, 11, 0.14)',
          'warning-border': 'rgba(245, 158, 11, 0.35)',
          high: '#f97316',
          'high-bg': 'rgba(249, 115, 22, 0.15)',
          'high-border': 'rgba(249, 115, 22, 0.35)',
          critical: '#ef4444',
          'critical-bg': 'rgba(239, 68, 68, 0.18)',
          'critical-border': 'rgba(239, 68, 68, 0.4)',
          grey: '#64748b',
          'grey-bg': 'rgba(100, 116, 139, 0.15)',
          'grey-border': 'rgba(100, 116, 139, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(6, 42, 61, 0.08), 0 1px 4px 0 rgba(6, 42, 61, 0.04)',
        'glass-hover': '0 12px 40px 0 rgba(6, 42, 61, 0.15), 0 2px 8px 0 rgba(6, 42, 61, 0.06)',
        'glow-cyan': '0 0 20px -3px rgba(34, 211, 238, 0.35)',
        'glow-purple': '0 0 20px -3px rgba(168, 85, 247, 0.4)',
      },
      keyframes: {
        'wave-drift': {
          '0%, 100%': { transform: 'translateX(0) translateZ(0)' },
          '50%': { transform: 'translateX(-25%) translateZ(0)' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(100%) scale(0.6)', opacity: '0' },
          '30%': { opacity: '0.4' },
          '80%': { opacity: '0.2' },
          '100%': { transform: 'translateY(-120%) scale(1.1)', opacity: '0' },
        },
        'caustic-shimmer': {
          '0%, 100%': { opacity: '0.12', transform: 'scale(1) rotate(0deg)' },
          '50%': { opacity: '0.22', transform: 'scale(1.08) rotate(2deg)' },
        }
      },
      animation: {
        'wave-drift-slow': 'wave-drift 18s ease-in-out infinite',
        'bubble-rise-slow': 'bubble-rise 9s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'caustic-shimmer': 'caustic-shimmer 12s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
