/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0084ff',
          dark: '#0066cc',
          light: '#66b3ff',
        },
        success: '#00c853',
        warning: '#ffc107',
        error: '#f44336',
        background: '#000000',
        card: {
          DEFAULT: '#121212',
          hover: '#1e1e1e',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b3b3b3',
        },
      },
      animation: {
        'pulse-blue': 'pulse-blue 1.5s infinite',
        'flash': 'flash 1s',
      },
      keyframes: {
        'pulse-blue': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7, color: '#0084ff' },
        },
        'flash': {
          '0%': { backgroundColor: 'rgba(0, 132, 255, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};