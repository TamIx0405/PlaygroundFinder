/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#7EE7FC',
          DEFAULT: '#4FB8E5',
          dark: '#2B95D3'
        },
        secondary: {
          light: '#FFB6E1',
          DEFAULT: '#FF8AC8',
          dark: '#FF5CAF'
        },
        accent: {
          yellow: '#FFD53E',
          orange: '#FF8A4C',
          green: '#4ADE80',
          purple: '#A78BFA'
        },
        background: {
          light: '#E0F2FE',
          DEFAULT: '#93C5FD',
          dark: '#3B82F6'
        }
      },
      fontFamily: {
        'display': ['Fredoka', 'sans-serif'],
        'body': ['Nunito', 'sans-serif']
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        'playful': '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
        'playful-lg': '0 20px 40px -15px rgba(0, 0, 0, 0.2)'
      }
    },
  },
  plugins: [],
};