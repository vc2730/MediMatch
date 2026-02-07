/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d7f0ff',
          200: '#b2e2ff',
          300: '#7ccfff',
          400: '#3bb4ff',
          500: '#1694ff',
          600: '#0f74e6',
          700: '#0c59b3',
          800: '#0f4b8d',
          900: '#123f73'
        },
        ink: {
          50: '#f4f7fb',
          100: '#e6ecf4',
          200: '#c8d3e3',
          300: '#9fb0c9',
          400: '#7387a8',
          500: '#566b8c',
          600: '#435471',
          700: '#34445c',
          800: '#263348',
          900: '#192234'
        }
      },
      boxShadow: {
        glow: '0 20px 40px -20px rgba(20, 115, 230, 0.45)'
      },
      borderRadius: {
        xl: '1.2rem',
        '2xl': '1.8rem'
      }
    }
  },
  plugins: []
}
