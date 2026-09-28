import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dongseo: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7d0d6',
          300: '#f0abb6',
          400: '#e4788c',
          500: '#d24a64',
          600: '#b82946',
          700: '#9e1b32', // Main Dongseo Burgundy Red
          800: '#84192d',
          900: '#6f1929',
          950: '#3d0912',
        },
      },
    },
  },
  plugins: [],
};
export default config;
