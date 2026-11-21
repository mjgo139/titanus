/**
 * Familia estoica · figuras del emblema de cada app, para <Emblema figura={FIGURAS.x} />.
 * Lienzo de 512 con centro en (256, 245), igual que familia/emblema.mjs. Se pintan con --marfil;
 * el check usa --figura-trazo (el color del fondo detrás del emblema).
 */
export const FIGURAS = {
  /** StoaGym · entrenamiento */
  mancuerna: (
    <g transform="translate(256 245) scale(.5)">
      <rect x="-75" y="-15" width="150" height="30" rx="8" /><rect x="-113" y="-82" width="42" height="164" rx="16" /><rect x="71" y="-82" width="42" height="164" rx="16" />
      <rect x="-155" y="-58" width="34" height="116" rx="14" /><rect x="121" y="-58" width="34" height="116" rx="14" />
      <rect x="-177" y="-20" width="22" height="40" rx="8" /><rect x="155" y="-20" width="22" height="40" rx="8" />
    </g>
  ),
  /** StoaFit · nutrición */
  manzana: (
    <g transform="translate(256 256) scale(1.42) translate(-256 -256)">
      <g transform="translate(198.5 184) scale(1.15)">
        <path d="M50 36C41 28 22 27 15 44c-7 17 2 43 15 52 6 4 12 4 16 2 2.5-1.2 5.5-1.2 8 0 4 2 10 2 16-2 13-9 22-35 15-52-7-17-26-16-35-8Z" />
        <path fill="none" stroke="var(--marfil)" strokeWidth="5" strokeLinecap="round" d="M50 36c0-9 2-16 7-21" />
        <path fill="var(--gold)" d="M57 19c4-10 14-14 24-12-2 10-12 16-24 12Z" />
      </g>
    </g>
  ),
  /** StoaHabit · hábitos */
  check: (
    <g transform="translate(256 245) scale(.5)">
      <circle r="126" />
      <path d="M-54 2 L-16 40 L58 -38" fill="none" stroke="var(--figura-trazo)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
};
