/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#F0F9F9',
          100: '#D7F0EF',
          200: '#B2E2E0',
          300: '#7BCCCA',
          400: '#3AA7A4',
          500: '#14919B',
          600: '#0D7377',
          700: '#0B5E62',
          800: '#0A4C4F',
          900: '#083B3D',
        },
        navy: {
          900: '#0E1F2C',
          800: '#162C3D',
          700: '#1D3B52',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

