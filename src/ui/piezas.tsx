import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  const [montada, setMontada] = useState(abierta);
  // al cerrar se sigue mostrando lo último mientras baja, para que no salte
  const ultimo = useRef({ titulo, etiqueta, children });
  if (abierta) ultimo.current = { titulo, etiqueta, children };
  useEffect(() => {
    if (abierta) { setMontada(true); return; }
    const t = setTimeout(() => setMontada(false), 220);
    return () => clearTimeout(t);
  }, [abierta]);
  useEffect(() => {
    if (!abierta) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [abierta, alCerrar]);
  if (!abierta && !montada) return null;
  const sale = !abierta;
  const v = ultimo.current;
  return (
    <div className={`fixed inset-0 z-50 flex items-end lg:items-center justify-center ${sale ? 'pointer-events-none' : ''}`}
      role={sale ? undefined : 'dialog'} aria-modal={sale ? undefined : true} aria-label={sale ? undefined : v.titulo} aria-hidden={sale || undefined}>
      <button aria-label="Cerrar" tabIndex={sale ? -1 : 0} className={`absolute inset-0 bg-black/45 ${sale ? 'velo-sale' : 'velo-entra'}`} onClick={alCerrar} />
      <div className={`relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto bg-sf rounded-t-[18px] lg:rounded-[18px] border border-ln2 px-5 pb-8 pt-3 ${sale ? 'hoja-sale' : 'hoja-entra'}`}
        style={{ boxShadow: 'var(--sombra)' }}>
        <div className="mx-auto mb-3 h-[3px] w-9 rounded-full bg-ln3 lg:hidden" />
        <div className="flex items-start justify-between">
          <div>
            {v.etiqueta && <div className="etiqueta">{v.etiqueta}</div>}
            <h2 className="titulo-tarjeta mt-1">{v.titulo}</h2>
          </div>
          <button aria-label="Cerrar" onClick={alCerrar} className="toque -mr-2 flex items-center justify-center text-mu">
            <Icono n="cerrar" />
          </button>
        </div>
        <div className="mt-4">{v.children}</div>
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

/**
 * Esqueleto mientras carga: la silueta de lo que va a aparecer, con un brillo suave.
 * forma: 'pagina' (título + tarjetas), 'lista' (tarjetas), 'tarjeta' (un bloque) o 'linea'.
 */
export function Cargando({ forma = 'lista' }: { forma?: 'pagina' | 'lista' | 'tarjeta' | 'linea' }) {
  const B = ({ c = '' }: { c?: string }) => <div className={`esqueleto ${c}`} />;
  return (
    <div role="status" aria-busy className="aparece" data-testid="esqueleto">
      <span className="sr-only">Cargando…</span>
      {forma === 'pagina' && (
        <div className="pt-6">
          <B c="mx-auto h-8 w-1/2 lg:mx-0 lg:w-1/3" />
          <B c="mx-auto mt-3 h-4 w-2/3 lg:mx-0 lg:w-1/2" />
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            <B c="h-[180px]" /><B c="h-[180px] max-lg:hidden" />
            <B c="h-[96px]" /><B c="h-[96px]" /><B c="h-[96px] max-lg:hidden" /><B c="h-[96px] max-lg:hidden" />
          </div>
        </div>
      )}
      {forma === 'lista' && (
        <div className="flex flex-col gap-3 py-2">
          {[0, 1, 2].map((k) => (
            <div key={k} className="tarjeta flex items-center gap-3" style={{ opacity: 1 - k * 0.22 }}>
              <B c="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1"><B c="h-4 w-2/3" /><B c="mt-2 h-3 w-1/3" /></div>
            </div>
          ))}
        </div>
      )}
      {forma === 'tarjeta' && <B c="h-[165px] lg:h-[232px]" />}
      {forma === 'linea' && <B c="h-4 w-full" />}
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

/** Barras por semana: valor sobre cada barra, fecha de cada semana y detalle al tocar */
export function GraficoBarras({ datos, etiqueta, formato, formatoCorto, detalle, mejor = 'Mejor semana' }: {
  datos: { fecha: number; y: number }[]; etiqueta: string; formato: (n: number) => string; mejor?: string;
  formatoCorto?: (n: number) => string; detalle?: (i: number) => ReactNode;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const W = 340, H = 190, top = 22, base = 158;
  const max = Math.max(1, ...datos.map((d) => d.y));
  const ancho = W / datos.length;
  const pocos = datos.length <= 14;
  const conValores = datos.length <= 8;
  const cadaCuanto = datos.length <= 7 ? 1 : 2;
  const dia = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' });
  const mes = new Intl.DateTimeFormat('es-PY', { month: 'short' });
  const corto = formatoCorto ?? ((n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n))));
  const elegido = sel ?? datos.length - 1;
  return (
    <figure aria-label={etiqueta}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
        <defs>
          <linearGradient id="barraOro" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--goldh)" /><stop offset="1" stopColor="var(--gold2)" />
          </linearGradient>
        </defs>
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line x1={0} x2={W} y1={base - f * (base - top)} y2={base - f * (base - top)} stroke="var(--ln2)" strokeDasharray="3 4" />
            <text x={2} y={base - f * (base - top) - 3} fontSize="9" fill="var(--mu2)">{corto(max * f)}</text>
          </g>
        ))}
        <line x1={0} x2={W} y1={base + 0.5} y2={base + 0.5} stroke="var(--ln)" />
        {datos.map((d, i) => {
          const h = (d.y / max) * (base - top);
          const x = i * ancho + ancho * 0.16;
          const w = ancho * 0.68;
          const on = i === elegido;
          const nuevoMes = i === 0 || new Date(d.fecha).getMonth() !== new Date(datos[i - 1].fecha).getMonth();
          return (
            <g key={d.fecha} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
              <rect x={i * ancho} y={top - 10} width={ancho} height={base - top + 34} fill="transparent" />
              <rect x={x} y={base - h} width={w} height={Math.max(h, d.y ? 2 : 0)} rx={3} fill="url(#barraOro)" opacity={on ? 1 : 0.62} />
              {(conValores || on) && d.y > 0 && (
                <text x={x + w / 2} y={base - h - 5} fontSize="10" textAnchor="middle" fill={on ? 'var(--gold)' : 'var(--mu)'} fontWeight={on ? 700 : 400}>{corto(d.y)}</text>
              )}
              {(pocos ? (datos.length - 1 - i) % cadaCuanto === 0 || on : nuevoMes) && (
                <text x={x + w / 2} y={base + 14} fontSize="9.5" textAnchor="middle" fill={on ? 'var(--gold)' : 'var(--mu)'}>
                  {(pocos ? dia.format(d.fecha) : mes.format(d.fecha)).replace('.', '')}
                </text>
              )}
              {!pocos && d.y === 0 && <circle cx={x + w / 2} cy={base - 2} r={1.2} fill="var(--ln3)" />}
            </g>
          );
        })}
      </svg>
      {detalle && <figcaption className="mt-2 rounded-[10px] border border-ln2 px-3 py-2 text-[13px]" data-testid="detalle-semana">{detalle(elegido)}</figcaption>}
      {!detalle && <figcaption className="mt-1 text-right text-[12px] text-mu">{mejor}: {formato(max)}</figcaption>}
    </figure>
  );
}
