/**
 * Familia estoica · preset de Tailwind (v3). Uso en tailwind.config.js:
 *   import familia from './familia/tailwind-preset.js';
 *   export default { presets: [familia], content: [...] };
 * Así `bg-sf`, `text-gold`, `border-ln`, `font-display`… usan las variables de la familia.
 */
export default {
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', bg2: 'var(--bg2)', bg3: 'var(--bg3)', sf: 'var(--sf)', sf2: 'var(--sf2)', nav: 'var(--nav)',
        ln: 'var(--ln)', ln2: 'var(--ln2)', ln3: 'var(--ln3)',
        tx: 'var(--tx)', tx2: 'var(--tx2)', mu: 'var(--mu)', mu2: 'var(--mu2)',
        gold: 'var(--gold)', goldh: 'var(--goldh)', gold2: 'var(--gold2)', goldbg: 'var(--goldbg)', on: 'var(--on)',
        ok: 'var(--ok)', okbg: 'var(--okbg)', verde: 'var(--verde)', miss: 'var(--miss)', missbg: 'var(--missbg)',
        elegido: 'var(--elegido)', elegidobg: 'var(--elegidobg)', prot: 'var(--prot)', carb: 'var(--carb)', gras: 'var(--gras)',
        aviso: 'var(--aviso)', info: 'var(--info)', marfil: 'var(--marfil)',
        lat: { tx: 'var(--lat-tx)', on: 'var(--lat-tx-on)', activo: 'var(--lat-activo)', oro: 'var(--lat-oro)', mu: 'var(--lat-mu)', borde: 'var(--lat-borde)' },
      },
      fontFamily: { display: 'var(--f-display)', body: 'var(--f-body)', marca: 'var(--f-marca)' },
      fontSize: {
        micro: '11px', etiqueta: '11.5px', ficha: '12.5px', sec: '13.5px', texto: '15px', boton: '16px',
        num: '18px', tarjeta: '20px', saludo: '26px', titulo: '28px', 'titulo-pc': '36px', 'saludo-pc': '40px', grande: '48px', gigante: '64px',
      },
      borderRadius: { card: '16px', hero: '20px' },
      accentColor: { familia: 'var(--acento)' },
    },
  },
};
