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
        blue: {
          400: 'rgb(var(--accent-rgb, 10 132 255) / <alpha-value>)',
          500: 'rgb(var(--accent-rgb, 10 132 255) / <alpha-value>)',
          600: 'rgb(var(--accent-rgb, 10 132 255) / <alpha-value>)',
          700: 'rgb(var(--accent-rgb, 10 132 255) / <alpha-value>)',
        },
        ios: {
          bg: '#000000',
          surface: '#121214',
          card: '#1c1c1e',
          cardHover: '#252528',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.05)',
          blue: 'rgb(var(--accent-rgb, 10 132 255) / <alpha-value>)',
          blueHover: 'rgb(var(--accent-rgb, 10 132 255) / <alpha-value>)',
          green: '#30D158',
          red: '#FF453A',
          amber: '#FFD60A',
          purple: '#BF5AF2',
          orange: '#FF9F0A',
          teal: '#64D2FF',
          muted: '#8e8e93',
          secondary: '#aeaeb2',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
      },
      boxShadow: {
        'ios-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'ios-card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'ios-glow-green': '0 0 25px -5px rgba(48, 209, 88, 0.3)',
        'ios-glow-blue': '0 0 25px -4px var(--accent-glow, rgba(10, 132, 255, 0.35))',
        'ios-glow-red': '0 0 25px -5px rgba(255, 69, 58, 0.3)',
        'ios-glow-amber': '0 0 25px -5px rgba(255, 214, 10, 0.3)',
      },
      animation: {
        'pop-in': 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
