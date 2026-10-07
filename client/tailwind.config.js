/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf4',
          100: '#d6fae3',
          200: '#b1f4ca',
          300: '#7ae9a9',
          400: '#3cd581',
          500: '#1db954', // Emerald accent
          600: '#119b43',
          700: '#107a37',
          800: '#12602e',
          900: '#114f28',
          950: '#042c14',
        },
        dark: {
          base: '#000000',
          surface: '#121212',
          elevated: '#181818',
          highlight: '#242424',
          border: '#2e2e2e',
          subtext: '#a7a7a7',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'equalizer': 'equalizer 1s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        equalizer: {
          '0%': { height: '4px' },
          '100%': { height: '16px' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
