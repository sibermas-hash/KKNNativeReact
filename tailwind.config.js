/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.tsx',
    './resources/**/*.ts',
  ],
  theme: {
    fontFamily: {
      sans: ['Outfit', 'sans-serif'],
      serif: ['Fraunces', 'serif'],
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10a853', // UIN SAIZU Green
          light: '#34d399',
          dark: '#059669',
          50: '#f0fdf4',
          100: '#dcfce7',
        },
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10a853', // UIN Green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          yellow: '#fec42d', // Amber highlight
          slate: '#64748b', 
        },
        surface: {
          base: '#ffffff',
          panel: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9',
          'dark-base': '#0f172a',
          'dark-panel': '#1e293b',
          'dark-card': '#1e293b',
          'dark-border': '#334155',
          'dark-hover': '#475569',
        }
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'sm-soft': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'lg-soft': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xxl': '40px',
      }
    },
  },
  plugins: [],
};
