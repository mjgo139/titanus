import type { ReactNode } from 'react';
import { romano } from '../lib/logica';

/**
 * Piezas de la familia de apps estoicas (Stoica, StoaGym…).
 * Son iguales en todas: el laurel, los títulos de sección "I · TEXTO ——" y las fichas (chips).
 */

/** Laurel de la familia (mismo dibujo que Stoica). `marca` = sello pequeño; `fondo` = marca de agua */
export function Laurel({ size = 34, fondo = false, className = '' }: { size?: number; fondo?: boolean; className?: string }) {
  return (
    <svg width={size} height={size * 120 / 132} viewBox="0 0 132 120" aria-hidden className={`${fondo ? 'laurel-fondo' : ''} ${className}`}>
      <g fill="none" stroke="var(--gold)" strokeWidth={fondo ? 2 : 3} strokeLinecap="round">
        <path d="M58 108C26 98 12 66 20 24" /><path d="M74 108c32-10 46-42 38-84" />
      </g>
      <g fill="var(--gold)">
        {[[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]].map(([x, y, g]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="4" ry="9.5" transform={`rotate(${g} ${x} ${y})`} />
        ))}
      </g>
    </svg>
  );
}

/** Título de sección de la familia: "I · ENTRENAMIENTO DE HOY ————" con número romano y línea fina */
export function Grupo({ n, children, extra, className = '' }: { n?: number; children: ReactNode; extra?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <h2 className="grupo">{n ? <>{romano(n)} · </> : null}{children}</h2>
      <span className="h-px flex-1 bg-ln" aria-hidden />
      {extra}
    </div>
  );
}

/** Ficha (chip) de la familia: texto chico con ícono, borde fino y fondo oscuro */
export function Ficha({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`ficha ${className}`}>{children}</span>;
}

/** Cabecera de página de la familia: etiqueta en oro, título grande y una línea (ritmo de Stoica) */
export function CabeceraPagina({ etiqueta, titulo, linea, accion }: { etiqueta: string; titulo: ReactNode; linea?: ReactNode; accion?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="grupo">{etiqueta}</div>
        <h1 className="titulo mt-1.5">{titulo}</h1>
        {linea && <p className="mt-1.5 text-[15px] font-medium text-mu">{linea}</p>}
      </div>
      {accion}
    </header>
  );
}

/** Emblema de StoaGym: el laurel de la familia con la mancuerna marfil (igual al ícono de la app) */
export function Emblema({ size = 28, className = '' }: { size?: number; className?: string }) {
  const hojas = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
  const interiores = [[27, 41, 25], [28, 60, 8], [105, 41, -25], [104, 60, -8]];
  return (
    <svg width={size} height={size} viewBox="62 100 388 300" aria-hidden className={className} data-testid="emblema">
      <g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(110.8 115) scale(2.2)">
        <g fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M58 108C26 98 12 66 20 24" /><path d="M74 108c32-10 46-42 38-84" /></g>
        <g fill="var(--gold)">
          {hojas.map(([x, y, g]) => <ellipse key={`h${x}-${y}`} cx={x} cy={y} rx="4.6" ry="10.5" transform={`rotate(${g} ${x} ${y})`} />)}
          {interiores.map(([x, y, g]) => <ellipse key={`i${x}-${y}`} cx={x} cy={y} rx="3.6" ry="7.6" transform={`rotate(${g} ${x} ${y})`} />)}
        </g>
      </g></g>
      <g transform="translate(256 245) scale(.5)" style={{ fill: 'var(--marfil)' }}>
        <rect x="-75" y="-15" width="150" height="30" rx="8" /><rect x="-113" y="-82" width="42" height="164" rx="16" /><rect x="71" y="-82" width="42" height="164" rx="16" />
        <rect x="-155" y="-58" width="34" height="116" rx="14" /><rect x="121" y="-58" width="34" height="116" rx="14" />
        <rect x="-177" y="-20" width="22" height="40" rx="8" /><rect x="155" y="-20" width="22" height="40" rx="8" />
      </g>
    </svg>
  );
}
