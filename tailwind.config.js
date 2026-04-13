/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.tsx',
    './resources/**/*.ts',
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['Outfit', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        // Primary - Emerald Green (UIN SAIZU)
        primary: {
          DEFAULT: '#10a853',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10a853',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Accent - Amber/Gold
        accent: {
          amber: {
            DEFAULT: '#f59e0b',
            50: '#fffbeb',
            100: '#fef3c7',
            500: '#f59e0b',
            600: '#d97706',
          },
          // Accent - Sky Blue
          sky: {
            DEFAULT: '#0ea5e9',
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#0ea5e9',
            600: '#0284c7',
          },
          // Accent - Violet
          violet: {
            DEFAULT: '#8b5cf6',
            50: '#f5f3ff',
            100: '#ede9fe',
            500: '#8b5cf6',
            600: '#7c3aed',
          },
        },
        // Surface Colors
        surface: {
          base: '#ffffff',
          panel: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9',
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'sm-soft': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'lg-soft': '0 10px 40px -10px rgba(16, 168, 83, 0.15)',
        'glow': '0 0 20px rgba(16, 168, 83, 0.3)',
      },
    },
  },
  plugins: [],
};
