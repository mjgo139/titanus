import type { ReactNode } from 'react';

/**
 * Familia estoica · piezas de React iguales en las 4 apps.
 * Solo usan clases de piezas.css y variables de tokens.css (no dependen de Tailwind).
 */

/** Números romanos (1 → I, 4 → IV…) */
export function romano(n: number): string {
  const tabla: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  let x = Math.max(0, Math.floor(n));
  for (const [v, s] of tabla) while (x >= v) { r += s; x -= v; }
  return r;
}

const HOJAS = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
const INTERIORES = [[27, 41, 25], [28, 60, 8], [105, 41, -25], [104, 60, -8]];

/** Laurel de la familia. `fondo` = marca de agua grande y tenue (clase .laurel-fondo) */
export function Laurel({ size = 34, fondo = false, className = '' }: { size?: number; fondo?: boolean; className?: string }) {
  return (
    <svg width={size} height={size * 120 / 132} viewBox="0 0 132 120" aria-hidden className={`${fondo ? 'laurel-fondo' : ''} ${className}`}>
      <g fill="none" stroke="var(--gold)" strokeWidth={fondo ? 2 : 3} strokeLinecap="round">
        <path d="M58 108C26 98 12 66 20 24" /><path d="M74 108c32-10 46-42 38-84" />
      </g>
      <g fill="var(--gold)">
        {HOJAS.map(([x, y, g]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4" ry="9.5" transform={`rotate(${g} ${x} ${y})`} />)}
      </g>
    </svg>
  );
}

/** Título de sección: "I · ENTRENAMIENTO DE HOY ————" */
export function Grupo({ n, children, extra, className = '' }: { n?: number; children: ReactNode; extra?: ReactNode; className?: string }) {
  return (
    <div className={`grupo-fila ${className}`}>
      <h2 className="grupo">{n ? <>{romano(n)} · </> : null}{children}</h2>
      <span className="grupo-linea" aria-hidden />
      {extra}
    </div>
  );
}

/** Ficha (chip): texto chico con ícono, borde fino */
export function Ficha({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`ficha ${className}`}>{children}</span>;
}

/** Cabecera de página: etiqueta en oro, título grande y una línea */
export function CabeceraPagina({ etiqueta, titulo, linea, accion }: { etiqueta: string; titulo: ReactNode; linea?: ReactNode; accion?: ReactNode }) {
  return (
    <header className="cabecera-pagina">
      <div>
        <div className="grupo">{etiqueta}</div>
        <h1 className="titulo">{titulo}</h1>
        {linea && <p className="cabecera-linea">{linea}</p>}
      </div>
      {accion}
    </header>
  );
}

/**
 * Emblema de la familia: el laurel del ícono con la figura propia de cada app al centro.
 * `figura` = elementos SVG dibujados sobre un lienzo de 512×512 con centro en (256, 245),
 * por ejemplo la mancuerna de StoaGym. Se pintan con el color marfil.
 */
export function Emblema({ size = 28, figura, className = '', testId = 'emblema' }: { size?: number; figura: ReactNode; className?: string; testId?: string }) {
  return (
    <svg width={size} height={size} viewBox="62 100 388 300" aria-hidden className={className} data-testid={testId}>
      <g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(110.8 115) scale(2.2)">
        <g fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M58 108C26 98 12 66 20 24" /><path d="M74 108c32-10 46-42 38-84" /></g>
        <g fill="var(--gold)">
          {HOJAS.map(([x, y, g]) => <ellipse key={`h${x}-${y}`} cx={x} cy={y} rx="4.6" ry="10.5" transform={`rotate(${g} ${x} ${y})`} />)}
          {INTERIORES.map(([x, y, g]) => <ellipse key={`i${x}-${y}`} cx={x} cy={y} rx="3.6" ry="7.6" transform={`rotate(${g} ${x} ${y})`} />)}
        </g>
      </g></g>
      <g style={{ fill: 'var(--marfil)' }}>{figura}</g>
    </svg>
  );
}
