/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef9f5',
          100: '#d5f0e5',
          200: '#a8e0cb',
          300: '#6fcaab',
          400: '#3aad8a',
          500: '#1c8f6f',
          600: '#127358',
          700: '#0e5a45',
          800: '#0a4535',
          900: '#062e24',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
