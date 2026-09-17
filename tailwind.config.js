/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          950: '#021024', // Deep Midnight Black-Navy
          900: '#052659', // Royal Navy Blue
          700: '#3B6B9B', // Deep Slate Ocean
          500: '#5483B3', // Steel Sky Blue
          300: '#7DA0CA', // Soft Powder Blue
          100: '#C1E8FF', // Ice Light Blue
          50:  '#F4FAFF', // Crisp Frost White
        },
        warm: {
          50:  '#FFF9F5',
          100: '#FFF1E6',
          200: '#FFE0C8',
          300: '#FFC499',
          400: '#FFA96B',
          500: '#FF8A3D', // Vibrant Light Orange
          600: '#FF6B35', // Sunset Tangerine
          700: '#E85522',
        },
        coral: {
          400: '#FF758C',
          500: '#FF5E7E',
        },
        brand: {
          50:  '#C1E8FF',
          100: '#A6DCFF',
          200: '#7DA0CA',
          300: '#5483B3',
          400: '#3B6B9B',
          500: '#255085',
          600: '#052659',
          700: '#031B42',
          800: '#021024',
          900: '#010813',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'bounce-in': 'bounceIn 0.4s ease-out',
        'spin-slow': 'spin 4s linear infinite',
        'count-up': 'countUp 0.6s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.75' } },
        shimmer: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
        bounceIn: { '0%': { opacity: '0', transform: 'scale(0.9)' }, '50%': { transform: 'scale(1.02)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        countUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        glow: { '0%': { filter: 'drop-shadow(0 0 10px rgba(125,160,202,0.3))' }, '100%': { filter: 'drop-shadow(0 0 20px rgba(84,131,179,0.6))' } },
      },
      boxShadow: {
        'palette': '0 12px 30px -10px rgba(5, 38, 89, 0.25)',
        'palette-lg': '0 20px 40px -15px rgba(2, 16, 36, 0.35)',
        'palette-glow': '0 0 25px rgba(193, 232, 255, 0.45)',
      }
    },
  },
  plugins: [],
}
