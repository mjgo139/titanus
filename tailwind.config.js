/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', sf: 'var(--sf)', nav: 'var(--nav)',
        ln: 'var(--ln)', ln2: 'var(--ln2)', ln3: 'var(--ln3)',
        tx: 'var(--tx)', tx2: 'var(--tx2)', mu: 'var(--mu)', mu2: 'var(--mu2)',
        gold: 'var(--gold)', goldh: 'var(--goldh)', gold2: 'var(--gold2)', sf2: 'var(--sf2)', goldbg: 'var(--goldbg)', on: 'var(--on)',
        ok: 'var(--ok)', okbg: 'var(--okbg)', miss: 'var(--miss)', missbg: 'var(--missbg)',
      },
      fontFamily: { display: 'var(--f-display)', body: 'var(--f-body)', marca: 'var(--f-marca)' },
      borderRadius: { card: '16px', hero: '20px' },
    },
  },
  plugins: [],
};
