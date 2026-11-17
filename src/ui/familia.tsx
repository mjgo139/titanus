import type { ReactNode } from 'react';
import { romano } from '../lib/logica';

/**
 * Piezas de la familia de apps estoicas (Stoica, TITANUS…).
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
