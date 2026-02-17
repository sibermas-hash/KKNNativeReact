/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.tsx',
    './resources/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006241', // UIN Saizu Green
          light: '#00875A',
          dark: '#004B32',
        },
        accent: {
          gold: '#D4AF37', // UIN Saizu Gold
          amber: '#F59E0B',
        },
        surface: {
          base: '#050505',
          panel: '#111827',
          card: 'rgba(255, 255, 255, 0.03)',
        }
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 98, 65, 0.2)',
        'neon-gold': '0 0 20px rgba(212, 175, 55, 0.2)',
      },
      backdropBlur: {
        'xxl': '40px',
      }
    },
  },
  plugins: [],
};
