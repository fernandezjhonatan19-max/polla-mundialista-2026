/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soccer: {
          light: '#4ade80',
          DEFAULT: '#16a34a',
          dark: '#14532d',
        },
        gold: {
          light: '#fde047',
          DEFAULT: '#eab308',
          dark: '#854d0e',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
