/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F3E8FF',
          100: '#E9D5FF',
          200: '#D8B4FE',
          300: '#C084FC',
          400: '#A855F7',
          500: '#9333EA',
          600: '#6A1B9A', // Primary Purple specified in guidelines
          700: '#581C87',
          800: '#4C1D95',
          900: '#3B0764',
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#D4AF37', // Tertiary Gold
          700: '#B45309',
        },
        desc: '#6A7282',
        bgmain: '#FAFAFA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(106, 27, 154, 0.08)',
        glassSm: '0 4px 16px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
