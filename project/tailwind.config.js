/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#93C5FD',
          DEFAULT: '#60A5FA',
          dark: '#2563EB'
        },
        secondary: {
          light: '#FBA5D1',
          DEFAULT: '#F472B6',
          dark: '#DB2777'
        },
        accent: {
          yellow: '#FCD34D',
          orange: '#FB923C',
          green: '#4ADE80',
          purple: '#C084FC',
          pink: '#F9A8D4'
        }
      },
      fontFamily: {
        'display': ['Fredoka', 'sans-serif'],
        'body': ['Nunito', 'sans-serif']
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite'
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
        '105': '1.05'
      },
      boxShadow: {
        'playful': '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
        'playful-lg': '0 20px 40px -15px rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: []
};