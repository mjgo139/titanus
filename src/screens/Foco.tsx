import type { Borrador } from '../lib/borrador';
import { buscarEjercicio, imagenesEjercicio } from '../lib/biblioteca';
import { DESCANSO_POR_DEFECTO, anteriorPara, aplicarSugerencia } from '../lib/entreno';
import { aKg, aUnidad, formatoNumero, redondear, reloj, romano } from '../lib/logica';
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

function Paso({ etiqueta, valor, unidad, alCambiar, paso, decimales }: {
  etiqueta: string; valor: number; unidad?: string; alCambiar: (n: number) => void; paso: number; decimales: number;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="etiqueta text-center">{etiqueta}</div>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <button aria-label={`Menos ${etiqueta}`} onClick={() => alCambiar(Math.max(0, redondear(valor - paso, 2)))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ln3 text-[22px] oro lg:h-12 lg:w-12">−</button>
        <div className="flex min-w-0 flex-col items-center">
          <input aria-label={etiqueta} type="number" inputMode="decimal" step={paso}
            className="w-full min-w-[60px] max-w-[130px] bg-transparent text-center num text-[36px] leading-none outline-none lg:text-[44px]"
            value={valor ? redondear(valor, decimales) : ''} placeholder="0"
            onChange={(e) => alCambiar(Math.max(0, Number(e.target.value) || 0))} />
          {unidad && <span className="text-[12px] text-mu">{unidad}</span>}
        </div>
        <button aria-label={`Más ${etiqueta}`} onClick={() => alCambiar(redondear(valor + paso, 2))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ln3 text-[22px] oro lg:h-12 lg:w-12">+</button>
      </div>
    </div>
  );
}

/** Vista de foco: una serie a pantalla completa, con la animación grande, el cronómetro grande y lo que sigue */
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
  const est = estados.get(e.ejercicioId);
  const ant = anteriorPara(est?.ultima?.series, e.series, pos.j);
  const lista = todasLasSeries(b);
  const k = lista.findIndex((p) => p.i === pos.i && p.j === pos.j);
  const tipo = s.tipo ?? 'normal';
  const numNormal = e.series.slice(0, pos.j + 1).filter((x) => (x.tipo ?? 'normal') !== 'calentamiento').length;
  const restante = descanso ? Math.max(0, (descanso.fin - ahora) / 1000) : 0;
  const pasoPeso = u === 'kg' ? 2.5 : 5;
  const sug = e.sugerencia;

  // Lo que sigue: próximas series de este ejercicio y el próximo ejercicio
  const proximas = lista.slice(k + 1).filter((p) => !b.ejercicios[p.i].series[p.j].hecha);
  const mismas = proximas.filter((p) => p.i === pos.i).slice(0, 2);
  const otro = proximas.find((p) => p.i !== pos.i);

  const setValor = (campo: 'peso' | 'reps', v: number) =>
    cambiar((x) => { x.ejercicios[pos.i].series[pos.j][campo] = campo === 'peso' ? aKg(v, u) : Math.round(v); });

  const circ = 2 * Math.PI * 54;
  return (
    <div className="mt-3" data-testid="vista-foco">
      <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-[.12em] text-mu">
        <span>Ejercicio {romano(pos.i + 1)} de {romano(b.ejercicios.length)}</span>
        <span className="oro" data-testid="posicion">Serie {pos.j + 1} de {e.series.length}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ln2">
        <div className="h-full transition-all" style={{ width: `${((k + (s.hecha ? 1 : 0)) / lista.length) * 100}%`, background: 'var(--oro-grad)' }} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-semibold leading-tight oro lg:text-[34px]">{ej?.nombre}</h2>
          {e.objetivo && <p className="mt-1 text-[14px] text-mu">Objetivo: <span className="text-tx2">{e.objetivo}</span></p>}
        </div>
      </div>

      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Columna 1: animación grande y cronómetro */}
        <div>
          <div className="relative">
            <Animacion id={e.ejercicioId} nombre={ej?.nombre} className="aspect-[4/3] w-full rounded-[16px] border border-ln" />
            {!imagenesEjercicio(e.ejercicioId) && (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[16px] border border-ln bg-sf">
                <Miniatura musculo={ej?.musculo} tam={120} />
              </div>
            )}
          </div>

          <div className={`tarjeta mt-3 flex items-center gap-4 ${descanso ? 'border-gold' : ''}`} role={descanso ? 'timer' : undefined} aria-label={descanso ? 'Descanso' : 'Duración'}>
            <div className="relative h-[120px] w-[120px] shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--ln2)" strokeWidth="6" />
                {descanso && (
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - restante / descanso.total)} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="num oro text-[30px] leading-none" data-testid="cronometro">{reloj(descanso ? restante : (ahora - b.inicio) / 1000)}</span>
                <span className="mt-1 text-[11px] uppercase tracking-[.12em] text-mu">{descanso ? (restante > 0 ? 'Descanso' : '¡Vamos!') : 'Total'}</span>
              </div>
            </div>
            <div className="flex-1">
              {descanso ? (
                <>
                  <p className="text-[14px] text-tx2">Respirá. Después: <b className="oro">{proximas[0] ? `serie ${proximas[0].j + 1} de ${buscarEjercicio(b.ejercicios[proximas[0].i].ejercicioId, propios)?.nombre}` : 'terminar'}</b></p>
                  <div className="mt-3 flex gap-2">
                    <button className="chip flex-1" onClick={() => setDescanso((d) => d && { ...d, fin: Math.max(Date.now(), d.fin - 15_000) })}>−15 s</button>
                    <button className="chip flex-1" onClick={() => setDescanso((d) => d && { fin: d.fin + 15_000, total: d.total + 15 })}>+15 s</button>
                    <button className="chip chip-on flex-1" onClick={() => setDescanso(() => null)}>Saltar</button>
                  </div>
                </>
              ) : (
                <p className="text-[14px] text-mu">
                  Al marcar la serie arranca el descanso de <b className="text-tx2">{reloj(e.descanso ?? DESCANSO_POR_DEFECTO)}</b>.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna 2: la serie actual y lo que sigue */}
        <div className="mt-4 lg:mt-0">

          {sug && sug.accion !== 'mantener' && !sug.aplicada && (
            <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-gold2 bg-goldbg px-3 py-2 lg:mt-0" data-testid="sugerencia">
              <Icono n="progreso" size={20} className="oro shrink-0" />
              <p className="flex-1 text-[13px]"><b className="oro">Sobrecarga:</b> {sug.texto}</p>
              <button className="btn h-9 px-3 text-[13px]" onClick={() => cambiar((x) => {
                const ex = x.ejercicios[pos.i];
                ex.series = aplicarSugerencia(ex.series, ex.sugerencia!);
                ex.sugerencia = { ...ex.sugerencia!, aplicada: true };
              })}>Aplicar</button>
            </div>
          )}
          {sug && (sug.aplicada || sug.accion === 'mantener') && (
            <p className="mt-3 text-[13px] text-mu lg:mt-0" data-testid="sugerencia">
              <Icono n="progreso" size={14} className="oro mr-1 inline" />{sug.aplicada ? `Sobrecarga aplicada: ${formatoNumero(redondear(aUnidad(sug.peso, u)))} ${u}. ` : ''}{sug.texto}
            </p>
          )}

          <div className={`tarjeta mt-4 ${s.hecha ? 'border-goldh' : ''}`}>
            <div className="flex items-center justify-between">
              <span className={`etiqueta ${tipo === 'fallo' ? 'text-miss' : 'oro'}`}>
                {tipo === 'calentamiento' ? 'Calentamiento' : `Serie ${numNormal}`} · {NOMBRE_TIPO[tipo]}
              </span>
              {s.hecha && <span className="chip chip-on h-7">Hecha</span>}
            </div>
            <button className="mt-2 text-[14px] text-mu" aria-label="Copiar la vez anterior"
              onClick={() => ant && cambiar((x) => { const t = x.ejercicios[pos.i].series[pos.j]; t.peso = ant.peso; t.reps = ant.reps; })}>
              Anterior: <span className="text-tx2">{ant ? `${formatoNumero(redondear(aUnidad(ant.peso, u)))} ${u} × ${ant.reps}` : '—'}</span>
            </button>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-0 sm:divide-x sm:divide-ln2">
              <Paso etiqueta="Peso" unidad={u} valor={redondear(aUnidad(s.peso, u), 2)} paso={pasoPeso} decimales={2} alCambiar={(v) => setValor('peso', v)} />
              <Paso etiqueta="Reps" valor={s.reps} paso={1} decimales={0} alCambiar={(v) => setValor('reps', v)} />
            </div>
            <button className="btn mt-5 h-16 w-full text-[18px]" onClick={() => marcar(pos.i, pos.j)}
              aria-label={s.hecha ? 'Desmarcar serie' : 'Serie hecha'}>
              <Icono n="check" size={22} />{s.hecha ? 'Desmarcar' : 'Serie hecha'}
            </button>
            <div className="mt-3 flex justify-between">
              <button className="btn-sec h-10 px-3 text-[13px]" disabled={k <= 0} onClick={() => setPos(lista[k - 1])}><Icono n="atras" size={16} />Anterior</button>
              <button className="btn-sec h-10 px-3 text-[13px]" disabled={k >= lista.length - 1} onClick={() => setPos(lista[k + 1])}>
                Siguiente<Icono n="atras" size={16} className="rotate-180" />
              </button>
            </div>
          </div>

          <h3 className="mt-6 mb-2 font-display text-[19px] font-semibold">A continuación</h3>
          <ul className="flex flex-col gap-2" data-testid="a-continuacion">
            {mismas.map((p) => {
              const x = e.series[p.j];
              return (
                <li key={`s${p.j}`}>
                  <button className="tarjeta flex w-full items-center gap-3 py-3 text-left" onClick={() => setPos(p)}>
                    <span className="num w-8 text-center text-[20px] oro">{x.tipo === 'fallo' ? 'F' : x.tipo === 'calentamiento' ? 'C' : p.j + 1}</span>
                    <span className="flex-1 text-[14px]">Serie {p.j + 1} · {ej?.nombre}</span>
                    <span className="num text-[15px] text-tx2">{formatoNumero(redondear(aUnidad(x.peso, u)))} {u} × {x.reps || 'máx'}</span>
                  </button>
                </li>
              );
            })}
            {otro && (() => {
              const ex = b.ejercicios[otro.i];
              const o = buscarEjercicio(ex.ejercicioId, propios);
              return (
                <li>
                  <button className="tarjeta flex w-full items-center gap-3 py-3 text-left" onClick={() => setPos(otro)}>
                    <Miniatura musculo={o?.musculo} id={ex.ejercicioId} tam={44} />
                    <span className="flex-1">
                      <span className="etiqueta">Próximo ejercicio</span>
                      <span className="block font-semibold oro">{o?.nombre}</span>
                      <span className="text-[13px] text-mu">{ex.objetivo ?? `${ex.series.length} series`}</span>
                    </span>
                    <Icono n="atras" size={18} className="rotate-180 text-mu" />
                  </button>
                </li>
              );
            })()}
            {!proximas.length && <li className="tarjeta py-3 text-center text-[14px] text-mu">Es la última serie. Al terminar, tocá <b className="oro">Terminar</b>.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
