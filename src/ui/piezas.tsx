import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icono } from './Icono';

/** Ritmo de cada pantalla: etiqueta pequeña, título grande y una línea de explicación */
export function Encabezado({ etiqueta, titulo, linea, atras, accion }: {
  etiqueta: string; titulo: ReactNode; linea?: ReactNode; atras?: boolean | string; accion?: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <header className="entrar pt-6 pb-5">
      <div className="flex items-center justify-between min-h-[28px]">
        <div className="flex items-center gap-1">
          {atras && (
            <button aria-label="Volver" className="toque -ml-3 flex items-center justify-center text-mu"
              onClick={() => (typeof atras === 'string' ? nav(atras) : nav(-1))}>
              <Icono n="atras" />
            </button>
          )}
          <span className="etiqueta">{etiqueta}</span>
        </div>
        {accion}
      </div>
      <h1 className="titulo mt-2">{titulo}</h1>
      {linea && <p className="mt-2 text-mu font-medium">{linea}</p>}
    </header>
  );
}

export function Seccion({ titulo, children, accion }: { titulo: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="etiqueta">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

/** Hoja que sube desde abajo (en PC se centra) */
export function Hoja({ abierta, alCerrar, titulo, etiqueta, children }: {
  abierta: boolean; alCerrar: () => void; titulo: string; etiqueta?: string; children: ReactNode;
}) {
  useEffect(() => {
    if (!abierta) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [abierta, alCerrar]);
  if (!abierta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" role="dialog" aria-modal aria-label={titulo}>
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/40" onClick={alCerrar} />
      <div className="subir relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto bg-sf rounded-t-[18px] lg:rounded-[18px] border border-ln2 px-5 pb-8 pt-3"
        style={{ boxShadow: 'var(--sombra)' }}>
        <div className="mx-auto mb-3 h-[3px] w-9 rounded-full bg-ln3 lg:hidden" />
        <div className="flex items-start justify-between">
          <div>
            {etiqueta && <div className="etiqueta">{etiqueta}</div>}
            <h2 className="titulo-tarjeta mt-1">{titulo}</h2>
          </div>
          <button aria-label="Cerrar" onClick={alCerrar} className="toque -mr-2 flex items-center justify-center text-mu">
            <Icono n="cerrar" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** Celebración breve y elegante */
export function Celebracion({ visible, titulo, linea, icono = 'medalla', alCerrar }: {
  visible: boolean; titulo: string; linea?: string; icono?: 'medalla' | 'laurel'; alCerrar: () => void;
}) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(alCerrar, 3200);
    return () => clearTimeout(t);
  }, [visible, alCerrar]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="status" onClick={alCerrar}>
      <div className="absolute inset-0 bg-black/35" />
      <div className="rebote relative hero text-center w-full max-w-[340px] py-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 text-gold bg-sf/60">
          <Icono n={icono} size={44} />
        </div>
        <div className="etiqueta mt-5 text-gold">Récord personal</div>
        <div className="titulo-tarjeta mt-2 text-[24px]">{titulo}</div>
        {linea && <p className="mt-2 text-mu">{linea}</p>}
      </div>
    </div>
  );
}

export function Cargando() {
  return (
    <div className="flex items-center justify-center py-20 text-mu" aria-busy>
      <span className="etiqueta">Cargando…</span>
    </div>
  );
}

export function Vacio({ titulo, linea, children }: { titulo: string; linea: string; children?: ReactNode }) {
  return (
    <div className="tarjeta text-center py-10">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-goldbg text-gold">
        <Icono n="laurel" />
      </div>
      <div className="titulo-tarjeta">{titulo}</div>
      <p className="mt-2 text-mu">{linea}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Selector<T extends string>({ opciones, valor, alCambiar, nombre }: {
  opciones: { v: T; t: string }[]; valor: T; alCambiar: (v: T) => void; nombre: string;
}) {
  return (
    <div role="radiogroup" aria-label={nombre} className="flex rounded-full border border-ln bg-bg p-1">
      {opciones.map((o) => (
        <button key={o.v} role="radio" aria-checked={valor === o.v} onClick={() => alCambiar(o.v)}
          className={`flex-1 h-9 rounded-full text-[13px] font-semibold transition-colors ${valor === o.v ? 'bg-sf text-tx shadow-sm border border-ln2' : 'text-mu'}`}>
          {o.t}
        </button>
      ))}
    </div>
  );
}

/** Gráfico de línea simple en SVG */
export function GraficoLinea({ puntos, etiqueta, formato }: {
  puntos: { x: number; y: number }[]; etiqueta: string; formato: (n: number) => string;
}) {
  if (puntos.length < 2) {
    return <p className="text-mu text-[14px] py-6 text-center">Hacen falta al menos dos entrenamientos para dibujar el gráfico.</p>;
  }
  const W = 320, H = 150, px = 8, py = 14;
  const xs = puntos.map((p) => p.x), ys = puntos.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const rx = (x: number) => px + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * px);
  const ry = (y: number) => H - py - ((y - y0) / (y1 - y0 || 1)) * (H - 2 * py);
  const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${rx(p.x).toFixed(1)},${ry(p.y).toFixed(1)}`).join(' ');
  const ult = puntos[puntos.length - 1];
  return (
    <figure aria-label={etiqueta}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={px} x2={W - px} y1={py + f * (H - 2 * py)} y2={py + f * (H - 2 * py)} stroke="var(--ln2)" />
        ))}
        <path d={`${d} L${rx(ult.x)},${H - py} L${rx(puntos[0].x)},${H - py} Z`} fill="var(--goldbg)" opacity={0.55} />
        <path d={d} fill="none" stroke="var(--gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={rx(ult.x)} cy={ry(ult.y)} r={4} fill="var(--gold)" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-[12px] text-mu">
        <span>Mín. {formato(y0)}</span><span>Máx. {formato(y1)}</span>
      </figcaption>
    </figure>
  );
}
