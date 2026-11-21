import familia from './familia/tailwind-preset.js';

/** @type {import('tailwindcss').Config} */
export default {
  // Colores, letras y radios vienen de la familia estoica (familia/tailwind-preset.js)
  presets: [familia],
  content: ['./index.html', './src/**/*.{ts,tsx}', './familia/**/*.tsx'],
  plugins: [],
};
