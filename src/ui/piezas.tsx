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
            <button aria-label="Volver" className="toque -ml-3 flex items-center justify-center oro"
              onClick={() => (typeof atras === 'string' ? nav(atras) : nav(-1))}>
              <Icono n="atras" />
            </button>
          )}
          <span className="etiqueta oro">{etiqueta}</span>
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
        <Icono n="corona" />
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
    <div role="radiogroup" aria-label={nombre} className="flex gap-[5px]">
      {opciones.map((o) => (
        <button key={o.v} role="radio" aria-checked={valor === o.v} onClick={() => alCambiar(o.v)}
          className={`chip flex-1 h-10 ${valor === o.v ? 'chip-on' : ''}`}>
          {o.t}
        </button>
      ))}
    </div>
  );
}

/** Gráfico de línea en oro, con relleno degradado y puntos */
export function GraficoLinea({ puntos, etiqueta, formato }: {
  puntos: { x: number; y: number }[]; etiqueta: string; formato: (n: number) => string;
}) {
  if (puntos.length < 2) {
    return <p className="text-mu text-[14px] py-6 text-center">Hacen falta al menos dos registros para dibujar el gráfico.</p>;
  }
  const W = 330, H = 160, px = 10, py = 16;
  const xs = puntos.map((p) => p.x), ys = puntos.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const rx = (x: number) => px + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * px);
  const ry = (y: number) => H - py - ((y - y0) / (y1 - y0 || 1)) * (H - 2 * py);
  const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${rx(p.x).toFixed(1)},${ry(p.y).toFixed(1)}`).join(' ');
  const ult = puntos[puntos.length - 1];
  const id = 'g' + etiqueta.replace(/[^a-z]/gi, '').slice(0, 12);
  return (
    <figure aria-label={etiqueta}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--gold2)" stopOpacity=".55" /><stop offset="1" stopColor="var(--gold2)" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={px} x2={W - px} y1={py + f * (H - 2 * py)} y2={py + f * (H - 2 * py)} stroke="var(--ln2)" strokeWidth={0.6} />
        ))}
        <path d={`${d} L${rx(ult.x)},${H - py} L${rx(puntos[0].x)},${H - py} Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {puntos.length <= 24 && puntos.map((p, i) => <circle key={i} cx={rx(p.x)} cy={ry(p.y)} r={3.2} fill="var(--gold)" />)}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[12px] text-mu">
        <span>Mín. {formato(y0)}</span><span>Máx. {formato(y1)}</span>
      </figcaption>
    </figure>
  );
}

/** Barras por semana (volumen o entrenamientos) */
export function GraficoBarras({ datos, etiqueta, formato }: {
  datos: { fecha: number; y: number }[]; etiqueta: string; formato: (n: number) => string;
}) {
  const W = 330, H = 150, py = 18;
  const max = Math.max(1, ...datos.map((d) => d.y));
  const ancho = (W - 4) / datos.length;
  const meses = new Intl.DateTimeFormat('es-PY', { month: 'short' });
  return (
    <figure aria-label={etiqueta}>
      <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full h-auto">
        <defs>
          <linearGradient id="barraOro" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--goldh)" /><stop offset="1" stopColor="var(--gold2)" />
          </linearGradient>
        </defs>
        <line x1={0} x2={W} y1={H - py + 0.5} y2={H - py + 0.5} stroke="var(--ln2)" />
        {datos.map((d, i) => {
          const h = (d.y / max) * (H - 2 * py);
          const x = 2 + i * ancho + ancho * 0.18;
          const nuevoMes = i === 0 || new Date(d.fecha).getMonth() !== new Date(datos[i - 1].fecha).getMonth();
          return (
            <g key={d.fecha}>
              <rect x={x} y={H - py - h} width={ancho * 0.64} height={Math.max(h, d.y ? 2 : 0)} rx={2} fill="url(#barraOro)" />
              {nuevoMes && datos.length > 6 && <text x={x} y={H + 8} fontSize="10" fill="var(--mu)">{meses.format(d.fecha).replace('.', '')}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-right text-[12px] text-mu">Mejor semana: {formato(max === 1 && !datos.some((d) => d.y) ? 0 : max)}</figcaption>
    </figure>
  );
}
