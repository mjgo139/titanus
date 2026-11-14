import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import {
  aKg, aUnidad, claveDia, contarSeries, duracion, fechaCorta, fechaLarga, formatoNumero, formatoPeso, redondear,
} from '../lib/logica';
import type { Ejercicio, Entrenamiento, EstadoEjercicio, RegistroCuerpo } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, GraficoLinea, Hoja, Selector, Vacio } from '../ui/piezas';

type Vista = 'historial' | 'records' | 'cuerpo';
const PAGINA = 20;

export default function Progreso() {
  const [params, setParams] = useSearchParams();
  const vista = (params.get('v') as Vista) || 'historial';
  return (
    <div>
      <Encabezado etiqueta="Progreso" titulo="Lo que construiste" linea="Historial, récords y tu cuerpo, semana a semana." />
      <Selector nombre="Sección" valor={vista} alCambiar={(v) => setParams({ v }, { replace: true })}
        opciones={[{ v: 'historial', t: 'Historial' }, { v: 'records', t: 'Récords' }, { v: 'cuerpo', t: 'Cuerpo' }]} />
      <div className="mt-5">
        {vista === 'historial' && <Historial />}
        {vista === 'records' && <Records />}
        {vista === 'cuerpo' && <Cuerpo />}
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

function Historial() {
  const { repo, usuario, perfil } = useSesion();
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
      <ul className="tarjeta py-1">
        {items.map((e) => (
          <li key={e.id}>
            <button className="fila w-full text-left" onClick={() => setAbierto(e)}>
              <span className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-goldbg text-gold">
                <span className="num text-[15px] leading-none">{new Date(e.inicio).getDate()}</span>
                <span className="text-[9px] font-bold uppercase">{fechaCorta(e.inicio).split(' ')[1]?.replace('.', '')}</span>
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{e.nombre}</span>
                <span className="text-[13px] text-mu">{duracion(e.fin - e.inicio)} · {contarSeries(e.ejercicios)} series · {formatoPeso(e.volumen, u, 0)}</span>
              </span>
              {e.records.length > 0 && <Icono n="medalla" size={18} className="text-gold" />}
            </button>
          </li>
        ))}
      </ul>
      {mas && <button className="btn-sec w-full mt-4" onClick={cargarMas}>Ver más</button>}

      <Hoja abierta={!!abierto} alCerrar={() => setAbierto(null)} etiqueta={abierto ? fechaLarga(abierto.inicio) : ''} titulo={abierto?.nombre ?? ''}>
        {abierto && abierto.ejercicios.map((x) => (
          <div key={x.ejercicioId} className="py-3 border-b border-ln2 last:border-0">
            <div className="font-semibold">{buscarEjercicio(x.ejercicioId, propios)?.nombre}</div>
            <div className="mt-1 text-[14px] text-mu num">
              {x.series.map((s) => `${formatoNumero(redondear(aUnidad(s.peso, u)))}×${s.reps}`).join('  ·  ')} {u}
            </div>
          </div>
        ))}
      </Hoja>
    </>
  );
}

function Records() {
  const { repo, usuario, perfil } = useSesion();
  const propios = usePropios();
  const [estados, setEstados] = useState<EstadoEjercicio[] | null>(null);
  useEffect(() => {
    repo.leerEstados(usuario.uid).then((m) => setEstados([...m.values()].sort((a, b) => (b.ultima?.fecha ?? 0) - (a.ultima?.fecha ?? 0))));
  }, [repo, usuario.uid]);
  if (!estados) return <Cargando />;
  if (!estados.length) return <Vacio titulo="Sin récords todavía" linea="Tus mejores marcas por ejercicio aparecen después de entrenar." />;
  return (
    <ul className="flex flex-col gap-3">
      {estados.map((s) => {
        const ej = buscarEjercicio(s.ejercicioId, propios);
        return (
          <li key={s.ejercicioId}>
            <Link to={`/progreso/ejercicio/${s.ejercicioId}`} className="tarjeta flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-goldbg text-gold"><Icono n="medalla" /></span>
              <span className="flex-1">
                <span className="etiqueta">{ej?.musculo}</span>
                <span className="block font-semibold mt-0.5">{ej?.nombre ?? s.ejercicioId}</span>
              </span>
              <span className="text-right">
                <span className="num block text-[20px] text-gold">{formatoPeso(s.mejorPeso, perfil.unidad)}</span>
                <span className="text-[12px] text-mu">{s.puntos.length} sesiones</span>
              </span>
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

function Cuerpo() {
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
    <>
      <div className="tarjeta">
        <div className="etiqueta">Peso corporal</div>
        <div className="num text-[40px] mt-1">{val('peso') ? formatoPeso(val('peso')!, u) : '—'}</div>
        <div className="mt-3">
          <GraficoLinea puntos={pesos} etiqueta="Peso corporal en el tiempo" formato={(n) => `${formatoNumero(redondear(n))} ${u}`} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {MEDIDAS.slice(1).map((m) => (
          <div key={m.k} className="tarjeta">
            <div className="etiqueta">{m.t}</div>
            <div className="num text-[24px] mt-1">{val(m.k) ? `${formatoNumero(redondear(val(m.k)!))} cm` : '—'}</div>
          </div>
        ))}
      </div>
      <button className="btn w-full mt-5" onClick={() => setForm(true)}>Registrar medidas de hoy</button>

      <Hoja abierta={form} alCerrar={() => setForm(false)} etiqueta="Cuerpo" titulo="Medidas de hoy">
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
    </>
  );
}
