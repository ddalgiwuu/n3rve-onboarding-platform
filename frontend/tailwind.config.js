/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ===================================
        // shadcn/ui Semantic Colors
        // ===================================
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ===================================
        // Existing Color System
        // ===================================
        // ===================================
        // 🎨 PREMIUM COLOR SYSTEM (2024-2025)
        // Inspired by: Stripe, Linear, Vercel, Apple
        // ===================================

        // Foundation grays (neutral sophistication)
        gray: {
          0: '#FFFFFF',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },

        // Dark mode surfaces (elevated design)
        dark: {
          0: '#0A0A0A',    // Deep background
          50: '#121212',   // Surface 0dp
          100: '#1A1A1A',  // Surface 1dp
          200: '#222222',  // Surface 2dp
          300: '#2A2A2A',  // Surface 4dp
          400: '#333333',  // Surface 8dp
          500: '#525252',  // Border/divider
          600: '#737373',  // Text secondary
          700: '#A3A3A3',  // Text primary
          800: '#D4D4D4',  // Text emphasis
          900: '#F5F5F5',  // Strong emphasis
          950: '#FFFFFF',  // Pure white
        },

        // Refined accent (minimal strategic use)
        accent: {
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',  // Primary CTA
            500: '#3B82F6',  // Primary hover
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
            900: '#1E3A8A',
          },
          green: {
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
          },
          amber: {
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
          },
          red: {
            400: '#F87171',
            500: '#EF4444',
            600: '#DC2626',
          },
        },

        // ===================================
        // 📦 LEGACY COLORS (Commented for rollback)
        // Original purple/pink system
        // ===================================
        /*
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
        */
      },

      backgroundColor: {
        // Premium glass effects
        'glass-light-subtle': 'rgba(255, 255, 255, 0.7)',
        'glass-light-medium': 'rgba(255, 255, 255, 0.85)',
        'glass-light-strong': 'rgba(255, 255, 255, 0.95)',
        'glass-dark-subtle': 'rgba(10, 10, 10, 0.6)',
        'glass-dark-medium': 'rgba(10, 10, 10, 0.8)',
        'glass-dark-strong': 'rgba(10, 10, 10, 0.95)',

        // ===================================
        // 📦 LEGACY (Commented)
        // ===================================
        /*
        'white/80': 'rgba(255, 255, 255, 0.8)',
        'white/90': 'rgba(255, 255, 255, 0.9)',
        'white/95': 'rgba(255, 255, 255, 0.95)',
        'gray-800/80': 'rgba(31, 41, 55, 0.8)',
        'gray-900/80': 'rgba(17, 24, 39, 0.8)',
        'gray-900/95': 'rgba(17, 24, 39, 0.95)'
        */
      },

      borderColor: {
        'glass-light': 'rgba(0, 0, 0, 0.08)',
        'glass-dark': 'rgba(255, 255, 255, 0.08)',
      },

      boxShadow: {
        'glass-light': '0 8px 32px rgba(0, 0, 0, 0.04)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.25)',
        'premium-lg': '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
      },

      backdropBlur: {
        xs: '2px',
        premium: '24px',
      },

      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'blob': 'blob 7s infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'aurora-pulse': 'aurora-pulse 6s ease-in-out infinite',
        'breathing-glow': 'breathing-glow 8s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        'shimmer-sweep': 'shimmer-sweep 2.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-in',
        'slide-up': 'slide-up 0.4s ease-out',
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
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '0.6',
            transform: 'scale(1)'
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)'
          }
        },
        'aurora-pulse': {
          '0%, 100%': {
            opacity: '0.8',
            transform: 'translateX(0%)'
          },
          '25%': {
            opacity: '0.9',
            transform: 'translateX(-2%)'
          },
          '50%': {
            opacity: '1',
            transform: 'translateX(2%)'
          },
          '75%': {
            opacity: '0.9',
            transform: 'translateX(-1%)'
          }
        },
        'breathing-glow': {
          '0%, 100%': {
            opacity: '0.3',
            transform: 'scale(0.95)'
          },
          '50%': {
            opacity: '0.6',
            transform: 'scale(1.02)'
          }
        },
        'gradient-shift': {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        },
        'shimmer-sweep': {
          '0%': {
            transform: 'translateX(-100%) skewX(-12deg)',
            opacity: '0'
          },
          '50%': {
            opacity: '1'
          },
          '100%': {
            transform: 'translateX(200%) skewX(-12deg)',
            opacity: '0'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        }
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        // Premium glass card (light mode)
        '.glass-card-light': {
          background: 'rgba(255, 255, 255, 0.85) !important',
          'backdrop-filter': 'blur(24px) !important',
          '-webkit-backdrop-filter': 'blur(24px) !important',
          border: '1px solid rgba(0, 0, 0, 0.08) !important',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.04) !important'
        },

        // Premium glass card (dark mode)
        '.glass-card-dark': {
          background: 'rgba(10, 10, 10, 0.8) !important',
          'backdrop-filter': 'blur(24px) !important',
          '-webkit-backdrop-filter': 'blur(24px) !important',
          border: '1px solid rgba(255, 255, 255, 0.08) !important',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.6) !important'
        },

        // ===================================
        // 📦 LEGACY (Commented)
        // ===================================
        /*
        '.glass-effect': {
          background: 'rgba(255, 255, 255, 0.8) !important',
          'backdrop-filter': 'blur(10px) !important',
          '-webkit-backdrop-filter': 'blur(10px) !important',
          border: '1px solid rgba(255, 255, 255, 0.18) !important'
        }
        */
      });
    },
    function({ addUtilities }) {
      addUtilities({
        '.dark .glass-card': {
          background: 'rgba(10, 10, 10, 0.8) !important',
          'backdrop-filter': 'blur(24px) !important',
          '-webkit-backdrop-filter': 'blur(24px) !important',
          border: '1px solid rgba(255, 255, 255, 0.08) !important',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.6) !important'
        },

        // ===================================
        // 📦 LEGACY (Commented)
        // ===================================
        /*
        '.dark .glass-effect': {
          background: 'rgba(17, 24, 39, 0.8) !important',
          'backdrop-filter': 'blur(10px) !important',
          '-webkit-backdrop-filter': 'blur(10px) !important',
          'border': '1px solid rgba(255, 255, 255, 0.1) !important'
        }
        */
      });
    }
  ],
  safelist: [
    // New premium utilities
    'glass-card',
    'glass-card-light',
    'glass-card-dark',
    'backdrop-blur-premium',
    'shadow-premium',
    'shadow-premium-lg',
    'bg-glass-dark-subtle',
    'bg-glass-dark-medium',
    'bg-glass-dark-strong',
    'border-glass-dark',
    'border-glass-light',

    // Legacy safelist (kept for rollback)
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
