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
          DEFAULT: '#0B6B3A',
          dark: '#07512B',
        },
      },
    },
  },
  plugins: [],
};
