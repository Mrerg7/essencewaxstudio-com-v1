/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#fbf9f6',
          100: '#f4efe7',
          200: '#e7dccb',
        },
        rose: {
          300: '#d9b3a8',
          400: '#c49286',
          500: '#b0786c',
          600: '#956155',
          700: '#7a4f46',
          800: '#66423b',
          900: '#563933',
          950: '#2e1c19',
        },
        gold: {
          300: '#e3d0ae',
          400: '#d1b57e',
          500: '#c09a5a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widestx: '0.22em',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
