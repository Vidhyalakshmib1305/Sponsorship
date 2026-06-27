/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF4500',
          dark:    '#C23200',
          light:   '#FF6A00',
        },
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};