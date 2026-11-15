import { useState, type ReactNode } from 'react';
import { Icono } from '../ui/Icono';
import { nuevoId } from '../lib/logica';
import { iniciales, TEXTO_ESTADO, type EstadoCliente } from './logica';
import type { Comentario, Objetivo } from './tipos';

const fecha = (t: number) => new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' }).format(t).replace('.', '');
export const fechaHora = (t: number) =>
  new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(t).replace('.', '');
export { fecha as fechaPro };

/** Medallón con iniciales, en oro */
export function Medallon({ nombre, tam = 44 }: { nombre: string; tam?: number }) {
  return (
    <span aria-hidden className="marca flex shrink-0 items-center justify-center rounded-full border border-gold2 oro"
      style={{ width: tam, height: tam, fontSize: tam * 0.36, background: 'radial-gradient(circle at 30% 30%, var(--goldbg), var(--sf))' }}>
      {iniciales(nombre)}
    </span>
  );
}

const COLOR_ESTADO: Record<EstadoCliente, string> = {
  'al-dia': 'var(--verde)', atencion: 'var(--gold)', inactivo: 'var(--miss)', nuevo: 'var(--mu)',
};

export function ChipEstado({ estado }: { estado: EstadoCliente }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[.08em]"
      style={{ color: COLOR_ESTADO[estado], borderColor: COLOR_ESTADO[estado] }} data-testid="estado-cliente">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR_ESTADO[estado] }} />{TEXTO_ESTADO[estado]}
    </span>
  );
}

export function Barra({ valor }: { valor: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-ln2" role="progressbar" aria-valuenow={Math.round(valor * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(valor * 100)}%`, background: valor >= 1 ? 'var(--verde)' : 'var(--oro-grad)' }} />
    </div>
  );
}

/** Dato grande con etiqueta */
export function Dato({ etiqueta, valor, alerta }: { etiqueta: string; valor: ReactNode; alerta?: boolean }) {
  return (
    <div className="tarjeta py-3 text-center">
      <div className="etiqueta truncate">{etiqueta}</div>
      <div className={`num mt-1 text-[22px] ${alerta ? 'text-miss' : 'oro'}`}>{valor}</div>
    </div>
  );
}

/** Conversación sobre un registro (o general). Cada uno escribe los suyos. */
export function HiloComentarios({ comentarios, yo, sobre, alEnviar, placeholder = 'Escribí un comentario…', compacto = false }: {
  comentarios: Comentario[];
  yo: { uid: string; nombre: string };
  sobre?: Comentario['sobre'];
  alEnviar: (c: Comentario) => Promise<void>;
  placeholder?: string;
  compacto?: boolean;
}) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const lista = [...comentarios].sort((a, b) => a.fecha - b.fecha);
  async function enviar() {
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    try {
      await alEnviar({ id: nuevoId(), autorId: yo.uid, autorNombre: yo.nombre, ...(sobre ? { sobre } : {}), texto: t.slice(0, 1000), fecha: Date.now(), leido: false });
      setTexto('');
    } finally { setEnviando(false); }
  }
  return (
    <div className={compacto ? 'mt-2' : ''}>
      {lista.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Comentarios">
          {lista.map((c) => {
            const mio = c.autorId === yo.uid;
            return (
              <li key={c.id} className={`max-w-[88%] rounded-[12px] border px-3 py-2 text-[14px] ${mio ? 'self-end border-gold2' : 'self-start border-ln2 bg-sf2'}`} data-testid="comentario">
                <div className="flex items-baseline justify-between gap-3 text-[11px] text-mu">
                  <b className={mio ? 'oro' : 'text-tx2'}>{mio ? 'Vos' : c.autorNombre}</b><span>{fechaHora(c.fecha)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-line">{c.texto}</p>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-2 flex items-end gap-2">
        <textarea aria-label={placeholder} value={texto} onChange={(e) => setTexto(e.target.value)} rows={1} placeholder={placeholder} maxLength={1000}
          className="min-h-[44px] flex-1 resize-none rounded-[12px] border border-ln2 bg-transparent px-3 py-2.5 text-[14px] outline-none focus:border-gold" />
        <button className="btn h-11 w-11 shrink-0 px-0" aria-label="Enviar comentario" disabled={!texto.trim() || enviando} onClick={enviar}>
          <Icono n="mensaje" size={18} />
        </button>
      </div>
    </div>
  );
}

export interface Medicion { actual?: number; avance: number; texto: string }

/** Lista de objetivos con su avance. La medición la hace cada especialidad. */
export function ListaObjetivos({ objetivos, medir, alBorrar, alCumplir }: {
  objetivos: Objetivo[];
  medir: (o: Objetivo) => Medicion;
  alBorrar?: (o: Objetivo) => void;
  alCumplir?: (o: Objetivo) => void;
}) {
  if (!objetivos.length) return <p className="tarjeta py-6 text-center text-[14px] text-mu">Todavía no hay objetivos.</p>;
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {objetivos.map((o) => {
        const m = medir(o);
        return (
          <li key={o.id} className="tarjeta" data-testid="objetivo">
            <div className="flex items-start gap-3">
              <Icono n={m.avance >= 1 ? 'medalla' : 'objetivo'} size={22} className="oro shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{o.titulo}</div>
                <div className="mt-0.5 text-[13px] text-mu">{m.texto}{o.hasta ? ` · hasta el ${fecha(o.hasta)}` : ''}</div>
              </div>
              {alCumplir && o.tipo === 'libre' && (
                <button className={`chip h-8 shrink-0 px-2.5 text-[12px] ${o.cumplido ? 'chip-on' : ''}`} onClick={() => alCumplir(o)} aria-pressed={!!o.cumplido}>
                  <Icono n="check" size={14} />{o.cumplido ? 'Cumplido' : 'Marcar'}
                </button>
              )}
              {alBorrar && (
                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-mu2 hover:text-miss" aria-label={`Quitar objetivo ${o.titulo}`} onClick={() => alBorrar(o)}>
                  <Icono n="basura" size={16} />
                </button>
              )}
            </div>
            <div className="mt-3"><Barra valor={m.avance} /></div>
          </li>
        );
      })}
    </ul>
  );
}
