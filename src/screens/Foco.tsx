import type { Borrador } from '../lib/borrador';
import { buscarEjercicio, imagenesEjercicio } from '../lib/biblioteca';
import { DESCANSO_POR_DEFECTO, anteriorPara } from '../lib/entreno';
import { aKg, aUnidad, formatoNumero, redondear, reloj } from '../lib/logica';
import type { Ejercicio, EstadoEjercicio, Unidad } from '../lib/tipos';
import { Icono } from '../ui/Icono';
import { Animacion, Miniatura } from './Miniatura';

export interface Posicion { i: number; j: number }

/** Lista plana de todas las series para moverse "anterior / siguiente" */
export function todasLasSeries(b: Borrador): Posicion[] {
  return b.ejercicios.flatMap((e, i) => e.series.map((_, j) => ({ i, j })));
}

/** Primera serie sin hacer a partir de una posición (si no hay, la última) */
export function siguientePendiente(b: Borrador, desde?: Posicion): Posicion | undefined {
  const l = todasLasSeries(b);
  if (!l.length) return undefined;
  const k0 = desde ? l.findIndex((p) => p.i === desde.i && p.j === desde.j) : -1;
  const orden = [...l.slice(k0 + 1), ...l.slice(0, k0 + 1)];
  return orden.find((p) => !b.ejercicios[p.i].series[p.j].hecha) ?? l[l.length - 1];
}

const NOMBRE_TIPO = { normal: 'Serie normal', calentamiento: 'Calentamiento', fallo: 'Al fallo · todas las que puedas', drop: 'Drop set' } as const;
const kgTxt = (kg: number, u: Unidad) => `${formatoNumero(redondear(aUnidad(kg, u), 2))} ${u}`;

/** Control de peso o repeticiones: misma estructura en los dos para que queden alineados */
function Control({ etiqueta, valor, unidad, alCambiar, paso }: {
  etiqueta: string; valor: number; unidad: string; alCambiar: (n: number) => void; paso: number;
}) {
  const btn = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ln3 text-[22px] leading-none oro active:scale-95';
  return (
    <div className="min-w-0 flex-1">
      <div className="etiqueta text-center">{etiqueta}</div>
      <div className="mt-1 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1">
        <button aria-label={`Menos ${etiqueta}`} className={btn} onClick={() => alCambiar(Math.max(0, redondear(valor - paso, 2)))}>−</button>
        <input aria-label={etiqueta} type="number" inputMode="decimal" step={paso}
          className="h-11 w-full min-w-0 bg-transparent text-center num text-[32px] leading-none outline-none"
          value={valor ? redondear(valor, 2) : ''} placeholder="0"
          onChange={(e) => alCambiar(Math.max(0, Number(e.target.value) || 0))} />
        <button aria-label={`Más ${etiqueta}`} className={btn} onClick={() => alCambiar(redondear(valor + paso, 2))}>+</button>
      </div>
      <div className="mt-0.5 text-center text-[12px] text-mu">{unidad}</div>
    </div>
  );
}

/**
 * Vista de foco: lo esencial sin bajar la pantalla.
 * Ejercicio y serie, peso y reps, "Serie hecha", cronómetro de descanso y lo que sigue.
 */
export function Foco({ b, pos, setPos, estados, propios, u, ahora, descanso, setDescanso, marcar, cambiar }: {
  b: Borrador;
  pos: Posicion;
  setPos: (p: Posicion) => void;
  estados: Map<string, EstadoEjercicio>;
  propios: Ejercicio[];
  u: Unidad;
  ahora: number;
  descanso: { fin: number; total: number } | null;
  setDescanso: (f: (d: { fin: number; total: number } | null) => { fin: number; total: number } | null) => void;
  marcar: (i: number, j: number) => void;
  cambiar: (f: (x: Borrador) => Borrador | void) => void;
}) {
  const e = b.ejercicios[pos.i];
  const s = e?.series[pos.j];
  if (!e || !s) return null;
  const ej = buscarEjercicio(e.ejercicioId, propios);
  const ant = anteriorPara(estados.get(e.ejercicioId)?.ultima?.series, e.series, pos.j);
  const lista = todasLasSeries(b);
  const k = lista.findIndex((p) => p.i === pos.i && p.j === pos.j);
  const hechas = lista.filter((p) => b.ejercicios[p.i].series[p.j].hecha).length;
  const tipo = s.tipo ?? 'normal';
  const restante = descanso ? Math.max(0, (descanso.fin - ahora) / 1000) : 0;
  const proxima = lista.slice(k + 1).find((p) => !b.ejercicios[p.i].series[p.j].hecha);
  const pe = proxima ? b.ejercicios[proxima.i] : undefined;
  const ps = proxima && pe ? pe.series[proxima.j] : undefined;
  const pej = pe ? buscarEjercicio(pe.ejercicioId, propios) : undefined;
  const setValor = (campo: 'peso' | 'reps', v: number) =>
    cambiar((x) => { x.ejercicios[pos.i].series[pos.j][campo] = campo === 'peso' ? aKg(v, u) : Math.round(v); });
  const circ = 2 * Math.PI * 46;
  const flecha = 'flex h-[60px] w-10 items-center justify-center rounded-[12px] border border-ln2 text-mu disabled:opacity-30';
  const conFoto = !!imagenesEjercicio(e.ejercicioId);

  return (
    <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-6" data-testid="vista-foco">
      {/* PC: animación grande a la izquierda */}
      <div className="hidden lg:block">
        {conFoto
          ? <Animacion id={e.ejercicioId} nombre={ej?.nombre} className="h-full min-h-[300px] w-full rounded-[16px] border border-ln" />
          : <div className="flex h-full min-h-[300px] items-center justify-center rounded-[16px] border border-ln bg-sf"><Miniatura musculo={ej?.musculo} tam={120} /></div>}
      </div>

      <div className="flex flex-col gap-3">
        {/* Ejercicio, serie y avance (en el celular, con la animación al costado) */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 lg:hidden">
            {conFoto
              ? <Animacion id={e.ejercicioId} nombre={ej?.nombre} className="h-[84px] w-[112px] rounded-[12px] border border-ln" />
              : <Miniatura musculo={ej?.musculo} tam={84} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[24px] font-semibold leading-tight oro lg:text-[30px]">{ej?.nombre}</h2>
            <p className="mt-0.5 truncate text-[13px] text-mu">{e.objetivo ?? `${e.series.length} series`}</p>
            <p className="mt-1 text-[12px]">
              <span className="font-bold uppercase tracking-[.1em] oro" data-testid="posicion">Serie {pos.j + 1} de {e.series.length}</span>
              <span className="text-mu2"> · Ejercicio {pos.i + 1} de {b.ejercicios.length}</span>
            </p>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ln2" aria-label={`${hechas} de ${lista.length} series hechas`}>
          <div className="h-full transition-all" style={{ width: `${(hechas / lista.length) * 100}%`, background: 'var(--oro-grad)' }} />
        </div>

        {/* La serie actual */}
        <div className={`tarjeta ${s.hecha ? 'border-goldh' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`etiqueta truncate ${tipo === 'fallo' ? 'text-miss' : 'oro'}`}>{NOMBRE_TIPO[tipo]}</span>
            <button className="shrink-0 text-[13px] text-mu" aria-label="Copiar la vez anterior"
              onClick={() => ant && cambiar((x) => { const t = x.ejercicios[pos.i].series[pos.j]; t.peso = ant.peso; t.reps = ant.reps; })}>
              Anterior: <span className="text-tx2">{ant ? `${kgTxt(ant.peso, u)} × ${ant.reps}` : '—'}</span>
            </button>
          </div>
          <div className="mt-3 flex items-stretch gap-2">
            <Control etiqueta="Peso" unidad={u} valor={redondear(aUnidad(s.peso, u), 2)} paso={u === 'kg' ? 2.5 : 5} alCambiar={(v) => setValor('peso', v)} />
            <div className="w-px bg-ln2" />
            <Control etiqueta="Reps" unidad={tipo === 'fallo' ? 'máximo' : 'repeticiones'} valor={s.reps} paso={1} alCambiar={(v) => setValor('reps', v)} />
          </div>
          <div className="mt-4 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2">
            <button className={flecha} aria-label="Serie anterior" disabled={k <= 0} onClick={() => setPos(lista[k - 1])}><Icono n="atras" size={18} /></button>
            <button className="btn h-[60px] w-full text-[18px]" onClick={() => marcar(pos.i, pos.j)}
              aria-label={s.hecha ? 'Desmarcar serie' : 'Serie hecha'}>
              <Icono n="check" size={22} />{s.hecha ? 'Hecha · desmarcar' : 'Serie hecha'}
            </button>
            <button className={flecha} aria-label="Serie siguiente" disabled={k >= lista.length - 1} onClick={() => setPos(lista[k + 1])}>
              <Icono n="atras" size={18} className="rotate-180" />
            </button>
          </div>
        </div>

        {/* Cronómetro de descanso y lo que sigue */}
        <div className={`tarjeta flex items-center gap-4 py-3 ${descanso ? 'border-gold' : ''}`}
          role={descanso ? 'timer' : undefined} aria-label={descanso ? 'Descanso' : undefined}>
          <div className="relative h-[104px] w-[104px] shrink-0">
            <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90">
              <circle cx="52" cy="52" r="46" fill="none" stroke="var(--ln2)" strokeWidth="6" />
              {descanso && (
                <circle cx="52" cy="52" r="46" fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - restante / descanso.total)} />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num oro text-[28px] leading-none" data-testid="cronometro">{reloj(descanso ? restante : e.descanso ?? DESCANSO_POR_DEFECTO)}</span>
              <span className="mt-1 text-[10px] uppercase tracking-[.12em] text-mu">{descanso && restante <= 0 ? '¡Vamos!' : 'Descanso'}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {descanso ? (
              <div className="grid grid-cols-3 gap-1.5">
                <button className="chip px-0" onClick={() => setDescanso((d) => d && { ...d, fin: Math.max(Date.now(), d.fin - 15_000) })}>−15 s</button>
                <button className="chip px-0" onClick={() => setDescanso((d) => d && { fin: d.fin + 15_000, total: d.total + 15 })}>+15 s</button>
                <button className="chip chip-on px-0" onClick={() => setDescanso(() => null)}>Saltar</button>
              </div>
            ) : (
              <p className="text-[13px] text-mu">Arranca solo al marcar la serie.</p>
            )}
            <button className="mt-3 flex w-full items-baseline gap-2 border-t border-ln2 pt-2 text-left" disabled={!proxima}
              onClick={() => proxima && setPos(proxima)} data-testid="a-continuacion">
              <span className="etiqueta shrink-0">Sigue</span>
              <span className="min-w-0 flex-1 truncate text-[14px]">
                {proxima && ps && pe ? (
                  proxima.i === pos.i
                    ? <>Serie {proxima.j + 1} · <b className="text-tx2">{kgTxt(ps.peso, u)} × {ps.reps || 'máx'}</b></>
                    : <><b className="oro">{pej?.nombre}</b> · {pe.objetivo ?? `${pe.series.length} series`}</>
                ) : <span className="text-mu">Última serie: después tocá Terminar</span>}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
