import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import {
  aKg, aUnidad, claveDia, contarSeries, duracion, fechaLarga, formatoNumero, formatoPeso, inicioDia, mejorSerie,
  rachaSemanas, rango, redondear, romano, semanasEnRango,
} from '../lib/logica';
import type { Ejercicio, Entrenamiento, EstadoEjercicio, RegistroCuerpo } from '../lib/tipos';
import { estatuas, foco } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { CabeceraPagina, Grupo } from '../ui/familia';
import { Icono } from '../ui/Icono';
import { Cargando, GraficoBarras, GraficoLinea, Hoja, Selector, Vacio } from '../ui/piezas';
import { useEmpezar } from './empezar';
import { Miniatura } from './Miniatura';

type Vista = 'resumen' | 'historial' | 'records' | 'medidas';
const PAGINA = 20;

export default function Progreso() {
  const [params, setParams] = useSearchParams();
  const vista = (params.get('v') as Vista) || 'resumen';
  return (
    <div className="pt-6">
      <div className="mb-5"><CabeceraPagina etiqueta="Tu camino" titulo="Progreso" linea="Cada semana suma. Mirá cuánto avanzaste." /></div>
      <div className="lg:max-w-[560px]">
      <Selector nombre="Sección" valor={vista} alCambiar={(v) => setParams({ v }, { replace: true })}
        opciones={[{ v: 'resumen', t: 'Resumen' }, { v: 'historial', t: 'Historial' }, { v: 'records', t: 'Récords' }, { v: 'medidas', t: 'Medidas' }]} />
      </div>
      <div className="mt-5">
        {vista === 'resumen' && <ResumenProgreso />}
        {vista === 'historial' && <Historial />}
        {vista === 'records' && <Records />}
        {vista === 'medidas' && <Medidas />}
      </div>
    </div>
  );
}

function usePropios() {
  const { repo, usuario } = useSesion();
  const [p, setP] = useState<Ejercicio[]>([]);
  useEffect(() => { repo.leerPropios(usuario.uid).then(setP); }, [repo, usuario.uid]);
  return p;
}

const RANGOS_TIEMPO = { '1M': 5, '3M': 13, '6M': 26, '1A': 52 } as const;

/** Todo sale del resumen del perfil: 0 lecturas extra */
function ResumenProgreso() {
  const { perfil } = useSesion();
  const [tiempo, setTiempo] = useState<keyof typeof RANGOS_TIEMPO>('3M');
  const [medida, setMedida] = useState<'v' | 'n' | 'm'>('v');
  const u = perfil.unidad;
  const ahora = Date.now();
  const sem = perfil.resumen.semanas;
  const ult4 = semanasEnRango(sem, 4, ahora);
  const prev4 = semanasEnRango(sem, 8, ahora).slice(0, 4);
  const suma = (l: { v: number; n: number; m: number }[], k: 'v' | 'n' | 'm') => l.reduce((t, x) => t + x[k], 0);
  const cambio = (k: 'v' | 'n' | 'm') => {
    const a = suma(ult4, k), b = suma(prev4, k);
    return b ? Math.round(((a - b) / b) * 100) : null;
  };
  const lista = semanasEnRango(sem, RANGOS_TIEMPO[tiempo], ahora);
  const previo = semanasEnRango(sem, RANGOS_TIEMPO[tiempo] * 2, ahora).slice(0, RANGOS_TIEMPO[tiempo]);
  const valor = (x: { v: number; n: number; m: number }) => (medida === 'v' ? aUnidad(x.v, u) : x[medida]);
  const datos = lista.map((x) => ({ fecha: x.fecha, y: valor(x) }));
  const total = lista.reduce((t, x) => t + valor(x), 0);
  const totalPrevio = previo.reduce((t, x) => t + valor(x), 0);
  const activas = lista.filter((x) => x.n > 0).length;
  const varPeriodo = totalPrevio ? Math.round(((total - totalPrevio) / totalPrevio) * 100) : null;
  const diaMes = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' });
  const r = rango(perfil.resumen.total);
  const racha = rachaSemanas(perfil.resumen.dias, ahora);
  const fmt = (n: number) => (medida === 'v' ? `${formatoNumero(redondear(n, 0))} ${u}` : medida === 'n' ? `${n} entrenos` : `${n} min`);

  const filas: [string, string, number | null][] = [
    ['Entrenamientos', String(suma(ult4, 'n')), cambio('n')],
    ['Volumen', `${formatoNumero(redondear(aUnidad(suma(ult4, 'v'), u), 0))} ${u}`, cambio('v')],
    ['Tiempo entrenando', duracion(suma(ult4, 'm') * 60000), cambio('m')],
  ];

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div>
      <div className="tarjeta relative min-h-[215px] overflow-hidden">
        <img src={estatuas(perfil.figura).espalda} alt="" style={{ objectPosition: foco(perfil.figura, 'espalda') }} className="mascara-izq absolute -right-4 top-0 h-full w-[48%] object-cover" />
        <div className="relative z-[1]">
          <h3 className="font-display text-[20px] font-semibold">Tu evolución</h3>
          <p className="text-[12.5px] text-mu">Últimas 4 semanas</p>
          {filas.map(([t, v, c]) => (
            <p key={t} className="mt-3 text-[13.5px]">
              <b className="num text-[18px]">{v}</b>{' '}
              {c !== null && <span className={c >= 0 ? 'oro' : 'text-miss'}>{c >= 0 ? '↑' : '↓'} {Math.abs(c)} %</span>}
              <br /><span className="text-mu">{t}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="tarjeta mt-3 p-[9px]">
        <Selector nombre="Período" valor={tiempo} alCambiar={setTiempo}
          opciones={(Object.keys(RANGOS_TIEMPO) as (keyof typeof RANGOS_TIEMPO)[]).map((k) => ({ v: k, t: k }))} />
        <div className="mt-3 flex gap-3 px-1 text-[13.5px]">
          {([['v', 'Volumen'], ['n', 'Entrenos'], ['m', 'Minutos']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setMedida(k)} className={medida === k ? 'oro font-semibold underline underline-offset-4' : 'text-mu'}>{t}</button>
          ))}
        </div>
        <div className="mt-2 px-1">
          <GraficoBarras datos={datos} etiqueta={`Gráfico semanal de ${medida === 'v' ? 'volumen' : medida === 'n' ? 'entrenamientos' : 'minutos'}`} formato={fmt}
            formatoCorto={medida === 'n' ? (n) => String(Math.round(n)) : undefined}
            detalle={(i) => {
              const x = lista[i];
              const fin = x.fecha + 6 * 86_400_000;
              return (
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-mu">Semana del {diaMes.format(x.fecha).replace('.', '')} al {diaMes.format(fin).replace('.', '')}</span>
                  <span className="flex gap-3">
                    <b className="oro">{formatoNumero(redondear(aUnidad(x.v, u), 0))} {u}</b>
                    <span>{x.n} {x.n === 1 ? 'entreno' : 'entrenos'}</span>
                    <span>{duracion(x.m * 60000)}</span>
                  </span>
                </div>
              );
            }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 px-1 xl:grid-cols-4" data-testid="totales-periodo">
          {[
            ['Total', fmt(total)],
            ['Promedio semanal', fmt(Math.round(total / RANGOS_TIEMPO[tiempo]))],
            ['Semanas activas', `${activas} de ${RANGOS_TIEMPO[tiempo]}`],
            ['Vs. período anterior', varPeriodo === null ? '—' : `${varPeriodo >= 0 ? '↑' : '↓'} ${Math.abs(varPeriodo)} %`],
          ].map(([t, v]) => (
            <div key={t} className="rounded-[10px] bg-sf2 px-2 py-2 text-center">
              <div className="text-[11px] uppercase tracking-[.08em] text-mu2">{t}</div>
              <div className={`num mt-0.5 text-[16px] ${t.startsWith('Vs') && varPeriodo !== null ? (varPeriodo >= 0 ? 'oro' : 'text-miss') : ''}`}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      </div>
      <div>
      <Calendario dias={perfil.resumen.dias} />

      <Grupo n={1} className="mt-6" extra={<Link to="/progreso?v=records" className="oro text-[15px] font-semibold">Ver récords</Link>}>Logros</Grupo>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { i: 'fuego', v: romano(racha) === '—' ? '0' : romano(racha), t: 'Racha', s: racha === 1 ? 'semana' : 'semanas' },
          { i: 'corona', v: String(r.nivel), t: r.nombre, s: 'nivel' },
          { i: 'trofeo', v: String(perfil.resumen.total), t: 'Constancia', s: 'entrenos' },
        ].map((x) => (
          <div key={x.t} className="tarjeta min-h-[110px] px-1 text-center">
            <Icono n={x.i} size={32} className="oro mx-auto" />
            <div className="num mt-1 text-[20px]">{x.v}</div>
            <p className="text-[12.5px] text-mu">{x.t}<br />{x.s}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function Calendario({ dias }: { dias: number[] }) {
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); });
  const set = useMemo(() => new Set(dias.map(inicioDia)), [dias]);
  const d0 = new Date(mes);
  const offset = (d0.getDay() + 6) % 7;
  const total = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
  const hoy = inicioDia(Date.now());
  const celdas = Array.from({ length: offset + total }, (_, i) => (i < offset ? null : new Date(d0.getFullYear(), d0.getMonth(), i - offset + 1).getTime()));
  const enMes = celdas.filter((c) => c && set.has(c)).length;
  const mover = (k: number) => setMes(new Date(d0.getFullYear(), d0.getMonth() + k, 1).getTime());
  return (
    <div className="tarjeta mt-3 lg:mt-0" aria-label="Calendario de entrenamientos">
      <div className="flex items-center justify-between">
        <button aria-label="Mes anterior" className="toque -ml-3 flex items-center justify-center oro" onClick={() => mover(-1)}><Icono n="atras" /></button>
        <div className="text-center">
          <div className="font-display text-[18px] font-semibold first-letter:uppercase">{new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric' }).format(mes)}</div>
          <div className="text-[12.5px] text-mu">{enMes} {enMes === 1 ? 'día entrenado' : 'días entrenados'}</div>
        </div>
        <button aria-label="Mes siguiente" className="toque -mr-3 flex rotate-180 items-center justify-center oro" onClick={() => mover(1)}><Icono n="atras" /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-mu2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => <span key={i}>{l}</span>)}
        {celdas.map((c, i) => (
          <span key={i} className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] font-medium ${c && set.has(c) ? '' : c === hoy ? 'border border-gold oro' : 'text-tx2'}`}
            style={c && set.has(c) ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>
            {c ? new Date(c).getDate() : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

function Historial() {
  const { repo, usuario, perfil } = useSesion();
  const empezar = useEmpezar();
  const propios = usePropios();
  const [items, setItems] = useState<Entrenamiento[] | null>(null);
  const [mas, setMas] = useState(false);
  const [abierto, setAbierto] = useState<Entrenamiento | null>(null);
  const u = perfil.unidad;

  useEffect(() => {
    repo.leerHistorial(usuario.uid, PAGINA).then((l) => { setItems(l); setMas(l.length === PAGINA); });
  }, [repo, usuario.uid]);

  async function cargarMas() {
    if (!items?.length) return;
    const l = await repo.leerHistorial(usuario.uid, PAGINA, items[items.length - 1].inicio);
    setItems([...items, ...l]);
    setMas(l.length === PAGINA);
  }

  if (!items) return <Cargando />;
  if (!items.length) return <Vacio titulo="Sin entrenamientos todavía" linea="Cuando termines tu primer entrenamiento, aparece acá." />;
  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
        {items.map((e) => (
          <li key={e.id} className="tarjeta" data-testid="entreno-historial">
            <button className="w-full text-left" onClick={() => setAbierto(e)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="titulo-tarjeta">{e.nombre}</h3>
                  <p className="text-[13.5px] text-mu first-letter:uppercase">{fechaLarga(e.inicio)}</p>
                </div>
                {e.records.length > 0 && <span className="chip h-7 gap-1 border-gold2 oro"><Icono n="medalla" size={16} />{e.records.length}</span>}
              </div>
              <div className="mt-3 grid grid-cols-3 text-[13.5px]">
                <div><div className="text-mu">Duración</div><div className="font-semibold">{duracion(e.fin - e.inicio)}</div></div>
                <div><div className="text-mu">Volumen</div><div className="font-semibold">{formatoPeso(e.volumen, u, 0)}</div></div>
                <div><div className="text-mu">Series</div><div className="font-semibold">{contarSeries(e.ejercicios)}</div></div>
              </div>
              <div className="divisor my-3 opacity-40" />
              <ul className="flex flex-col gap-1.5 text-[15px]">
                {e.ejercicios.slice(0, 3).map((x) => (
                  <li key={x.ejercicioId} className="flex items-center gap-2">
                    <Miniatura musculo={buscarEjercicio(x.ejercicioId, propios)?.musculo} id={x.ejercicioId} tam={28} />
                    <span className="flex-1 truncate">{x.series.length} series · {buscarEjercicio(x.ejercicioId, propios)?.nombre}</span>
                  </li>
                ))}
                {e.ejercicios.length > 3 && <li className="text-[13.5px] text-mu">Ver {e.ejercicios.length - 3} {e.ejercicios.length - 3 === 1 ? 'ejercicio' : 'ejercicios'} más</li>}
              </ul>
            </button>
          </li>
        ))}
      </ul>
      {mas && <button className="btn-sec w-full mt-4" onClick={cargarMas}>Ver más</button>}

      <Hoja abierta={!!abierto} alCerrar={() => setAbierto(null)} etiqueta={abierto ? fechaLarga(abierto.inicio) : ''} titulo={abierto?.nombre ?? ''}>
        {abierto && (
          <>
            {abierto.nota && <p className="mb-3 italic text-tx2">“{abierto.nota}”</p>}
            {abierto.ejercicios.map((x) => {
              const m = mejorSerie(x);
              return (
                <div key={x.ejercicioId} className="border-b border-ln2 py-3 last:border-0">
                  <div className="font-semibold oro">{buscarEjercicio(x.ejercicioId, propios)?.nombre}</div>
                  {x.nota && <p className="text-[13.5px] italic text-mu">{x.nota}</p>}
                  <ol className="mt-1 text-[15px] num">
                    {x.series.map((s, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="w-5 text-mu">{s.tipo === 'calentamiento' ? 'C' : s.tipo === 'fallo' ? 'F' : s.tipo === 'drop' ? 'D' : j + 1}</span>
                        <span>{formatoNumero(redondear(aUnidad(s.peso, u)))} {u} × {s.reps}</span>
                        {m === s && <span className="oro text-[12.5px]">mejor</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
            <button className="btn mt-5 w-full" onClick={() => { const e = abierto; setAbierto(null); empezar.repetir(e); }}>
              <Icono n="repetir" size={20} />Repetir entrenamiento
            </button>
          </>
        )}
      </Hoja>
    </>
  );
}

function Records() {
  const { repo, usuario, perfil } = useSesion();
  const propios = usePropios();
  const [estados, setEstados] = useState<EstadoEjercicio[] | null>(null);
  useEffect(() => {
    repo.leerEstados(usuario.uid).then((m) => setEstados([...m.values()].sort((a, b) => (b.mejor1RM ?? b.mejorPeso) - (a.mejor1RM ?? a.mejorPeso))));
  }, [repo, usuario.uid]);
  if (!estados) return <Cargando />;
  if (!estados.length) return <Vacio titulo="Sin récords todavía" linea="Tus mejores marcas por ejercicio aparecen después de entrenar." />;
  const u = perfil.unidad;
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {estados.map((s) => {
        const ej = buscarEjercicio(s.ejercicioId, propios);
        return (
          <li key={s.ejercicioId}>
            <Link to={`/progreso/ejercicio/${s.ejercicioId}`} className="tarjeta flex items-center gap-3">
              <Miniatura musculo={ej?.musculo} id={s.ejercicioId} tam={48} />
              <span className="flex-1">
                <span className="block font-semibold">{ej?.nombre ?? s.ejercicioId}</span>
                <span className="text-[12.5px] text-mu">{s.puntos.length} sesiones{s.mejor1RM ? ` · 1RM ${formatoPeso(s.mejor1RM, u)}` : ''}</span>
              </span>
              <span className="num oro text-[20px]">{formatoPeso(s.mejorPeso, u)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const MEDIDAS: { k: keyof RegistroCuerpo; t: string; unidad: 'peso' | 'cm' }[] = [
  { k: 'peso', t: 'Peso', unidad: 'peso' },
  { k: 'cintura', t: 'Cintura', unidad: 'cm' },
  { k: 'pecho', t: 'Pecho', unidad: 'cm' },
  { k: 'brazo', t: 'Brazo', unidad: 'cm' },
  { k: 'muslo', t: 'Muslo', unidad: 'cm' },
];

function Medidas() {
  const { repo, usuario, perfil, aviso } = useSesion();
  const u = perfil.unidad;
  const [regs, setRegs] = useState<RegistroCuerpo[] | null>(null);
  const [form, setForm] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});

  useEffect(() => { repo.leerCuerpo(usuario.uid).then(setRegs); }, [repo, usuario.uid]);

  async function guardar() {
    const hoy = Date.now();
    const r: RegistroCuerpo = { id: claveDia(hoy), fecha: hoy };
    for (const m of MEDIDAS) {
      const n = parseFloat((vals[m.k] ?? '').replace(',', '.'));
      if (Number.isFinite(n) && n > 0) (r as unknown as Record<string, number>)[m.k] = m.unidad === 'peso' ? aKg(n, u) : n;
    }
    if (Object.keys(r).length <= 2) { aviso('Cargá al menos una medida'); return; }
    await repo.guardarCuerpo(usuario.uid, r);
    setRegs((l) => [...(l ?? []).filter((x) => x.id !== r.id), r].sort((a, b) => a.fecha - b.fecha));
    setForm(false); setVals({});
    aviso('Medidas guardadas');
  }

  if (!regs) return <Cargando />;
  const ultimo = [...regs].reverse();
  const val = (k: keyof RegistroCuerpo) => ultimo.find((r) => r[k] !== undefined)?.[k] as number | undefined;
  const pesos = regs.filter((r) => r.peso).map((r) => ({ x: r.fecha, y: aUnidad(r.peso!, u) }));

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="tarjeta">
        <div className="etiqueta">Peso corporal</div>
        <div className="num oro mt-1 text-[40px]">{val('peso') ? formatoPeso(val('peso')!, u) : '—'}</div>
        <div className="mt-2">
          <GraficoLinea puntos={pesos} etiqueta="Peso corporal en el tiempo" formato={(n) => `${formatoNumero(redondear(n))} ${u}`} />
        </div>
      </div>
      <div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-0">
        {MEDIDAS.slice(1).map((m) => (
          <div key={m.k} className="tarjeta">
            <div className="etiqueta">{m.t}</div>
            <div className="num mt-1 text-[26px]">{val(m.k) ? `${formatoNumero(redondear(val(m.k)!))} cm` : '—'}</div>
          </div>
        ))}
      </div>
      <button className="btn w-full mt-5" onClick={() => setForm(true)}>Registrar medidas de hoy</button>
      </div>

      <Hoja abierta={form} alCerrar={() => setForm(false)} etiqueta="Medidas" titulo="Registro de hoy">
        <p className="mb-3 text-[13.5px] text-mu">Un registro personal, sin objetivos obligatorios.</p>
        <div className="grid grid-cols-2 gap-4">
          {MEDIDAS.map((m) => (
            <label key={m.k}>
              <span className="etiqueta">{m.t} ({m.unidad === 'peso' ? u : 'cm'})</span>
              <input className="campo mt-2 num" inputMode="decimal" value={vals[m.k] ?? ''}
                onChange={(e) => setVals({ ...vals, [m.k]: e.target.value })} />
            </label>
          ))}
        </div>
        <button className="btn w-full mt-6" onClick={guardar}>Guardar</button>
      </Hoja>
    </div>
  );
}
