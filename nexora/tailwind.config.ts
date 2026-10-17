import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#07070a', 900: '#0c0c10', 800: '#131318', 700: '#1c1c23', 600: '#2a2a33' },
        gold: { DEFAULT: '#e0b02a', soft: '#f5d060', deep: '#a87a0c' },
        steel: { DEFAULT: '#9a9aa6', light: '#cfcfd6' },
      },
      fontFamily: {
        display: ['"Arial Narrow"', 'Impact', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      letterSpacing: { wider2: '0.18em' },
    },
  },
  plugins: [],
};
export default config;
