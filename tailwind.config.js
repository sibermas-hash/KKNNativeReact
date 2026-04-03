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
          DEFAULT: '#10a853', // UIN SAIZU Green
          light: '#34d399',
          dark: '#059669',
          50: '#f0fdf4',
          100: '#dcfce7',
        },
        accent: {
          slate: '#64748b', // Neutral slate
          green: '#10a853',
        },
        surface: {
          base: '#ffffff',
          panel: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9',
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
