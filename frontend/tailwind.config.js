/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        n3rve: {
          50: '#f3f0ff',
          100: '#e9e5ff',
          200: '#d5ccff',
          300: '#b5a3ff',
          400: '#9070ff',
          500: '#5B02FF',
          600: '#5002e6',
          700: '#4301cc',
          800: '#3701a6',
          900: '#2d0186',
          950: '#1a004d'
        }
      },
      backgroundColor: {
        'white/80': 'rgba(255, 255, 255, 0.8)',
        'white/90': 'rgba(255, 255, 255, 0.9)',
        'white/95': 'rgba(255, 255, 255, 0.95)',
        'gray-800/80': 'rgba(31, 41, 55, 0.8)',
        'gray-900/80': 'rgba(17, 24, 39, 0.8)',
        'gray-900/95': 'rgba(17, 24, 39, 0.95)'
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'blob': 'blob 7s infinite'
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'blob': {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)'
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)'
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)'
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)'
          }
        }
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.glass-effect': {
          background: 'rgba(255, 255, 255, 0.8) !important',
          'backdrop-filter': 'blur(10px) !important',
          '-webkit-backdrop-filter': 'blur(10px) !important',
          border: '1px solid rgba(255, 255, 255, 0.18) !important'
        }
      });
    },
    function({ addUtilities }) {
      addUtilities({
        '.dark .glass-effect': {
          background: 'rgba(17, 24, 39, 0.8) !important',
          'backdrop-filter': 'blur(10px) !important',
          '-webkit-backdrop-filter': 'blur(10px) !important',
          border: '1px solid rgba(255, 255, 255, 0.1) !important'
        }
      });
    }
  ],
  safelist: [
    'glass-effect',
    'backdrop-blur-sm',
    'backdrop-blur',
    'backdrop-blur-md',
    'backdrop-blur-lg',
    'backdrop-blur-xl',
    'backdrop-blur-2xl',
    'bg-white/80',
    'bg-white/90',
    'bg-white/95',
    'bg-gray-800/80',
    'bg-gray-900/80',
    'bg-gray-900/95',
    'bg-white/5',
    'bg-white/10',
    'bg-white/20',
    'hover:backdrop-blur-sm',
    'hover:bg-gray-100/50',
    'hover:bg-gray-800/50',
    'text-n3rve-main',
    'text-yellow-600',
    'text-green-500',
    'text-green-600',
    'text-red-600',
    'text-purple-600',
    'text-indigo-600',
    'text-blue-600',
    'text-pink-600',
    'text-gray-600',
    'group-hover:text-n3rve-main',
    'group-hover:text-yellow-600',
    'group-hover:text-green-600',
    'group-hover:text-red-600',
    'group-hover:text-purple-600',
    'group-hover:text-blue-600',
    'group-hover:text-pink-600',
    'group-hover:text-gray-600'
  ]
};
