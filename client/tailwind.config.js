/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#EC2127',
          50: '#FDE8E9',
          100: '#FBD1D2',
          200: '#F7A3A6',
          300: '#F37579',
          400: '#EF474D',
          500: '#EC2127',
          600: '#C91920',
          700: '#9A1318',
          800: '#6B0D11',
          900: '#3D080A',
        }
      }
    },
  },
  plugins: [],
}
