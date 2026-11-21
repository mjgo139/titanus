import { useEffect, useMemo, useState } from 'react';
import { BIBLIOTECA, CON_IMAGEN, MUSCULOS, normalizar } from '../lib/biblioteca';
import { formatoPeso, nuevoId } from '../lib/logica';
import type { Ejercicio, EstadoEjercicio, Musculo } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Hoja } from '../ui/piezas';
import { Animacion, Miniatura } from './Miniatura';

/** Equipos de la biblioteca, en el orden en que se muestran */
const EQUIPOS = ['Barra', 'Mancuernas', 'Polea', 'Máquina', 'Peso corporal'];

// Lo que el usuario hizo en cada ejercicio: se lee una vez por sesión (sirve para "Tus más usados" y la info)
let estadosCache: { uid: string; p: Promise<Map<string, EstadoEjercicio>> } | null = null;

export function Biblioteca({ abierta, alCerrar, propios, elegidos, alElegir, alCrear }: {
  abierta: boolean;
  alCerrar: () => void;
  propios: Ejercicio[];
  elegidos: string[];
  alElegir: (e: Ejercicio) => void;
  alCrear: (e: Ejercicio) => Promise<void>;
}) {
  const [texto, setTexto] = useState('');
  const [musculo, setMusculo] = useState<Musculo | 'Todos'>('Todos');
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [mNuevo, setMNuevo] = useState<Musculo>('Pecho');
  const [equipo, setEquipo] = useState<string>('Todos');
  const [info, setInfo] = useState<Ejercicio | null>(null);
  const [estados, setEstados] = useState<Map<string, EstadoEjercicio>>(new Map());
  const { repo, usuario, perfil } = useSesion();

  useEffect(() => {
    if (!abierta) return;
    if (!estadosCache || estadosCache.uid !== usuario.uid) estadosCache = { uid: usuario.uid, p: repo.leerEstados(usuario.uid).catch(() => new Map()) };
    estadosCache.p.then(setEstados);
  }, [abierta, repo, usuario.uid]);

  const lista = useMemo(() => {
    const t = normalizar(texto.trim());
    return [...propios, ...BIBLIOTECA].filter((e) =>
      (musculo === 'Todos' || e.musculo === musculo) && (equipo === 'Todos' || e.equipo === equipo) && (!t || normalizar(e.nombre).includes(t)));
  }, [texto, musculo, equipo, propios]);

  // Tus más usados: los ejercicios con más sesiones registradas (solo sin filtros ni búsqueda)
  const usados = useMemo(() => {
    if (texto.trim() || musculo !== 'Todos' || equipo !== 'Todos') return [];
    const todos = [...propios, ...BIBLIOTECA];
    return [...estados.values()].filter((x) => x.puntos.length).sort((a, b) => b.puntos.length - a.puntos.length).slice(0, 6)
      .map((x) => todos.find((e) => e.id === x.ejercicioId)).filter(Boolean) as Ejercicio[];
  }, [estados, propios, texto, musculo, equipo]);

  const grupos = [
    ...(usados.length ? [{ m: 'Tus más usados', items: usados }] : []),
    ...MUSCULOS.map((m) => ({ m: m as string, items: lista.filter((e) => e.musculo === m) })).filter((g) => g.items.length),
  ];

  async function crear() {
    if (!nombre.trim()) return;
    const e: Ejercicio = { id: 'p-' + nuevoId(), nombre: nombre.trim(), musculo: mNuevo, propio: true };
    await alCrear(e);
    alElegir(e);
    setNombre(''); setCreando(false);
  }

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} etiqueta="Ejercicios" titulo="Elegí qué entrenar">
      {info ? (
        <div data-testid="info-ejercicio">
          <button className="mb-3 flex items-center gap-1 text-[15px] font-semibold oro" onClick={() => setInfo(null)}><Icono n="atras" size={16} />Volver a la lista</button>
          {CON_IMAGEN.has(info.id) ? (
            <div className="relative h-[220px] overflow-hidden rounded-[14px] border border-ln bg-sf">
              <Animacion id={info.id} nombre={info.nombre} completa className="h-full w-full" />
            </div>
          ) : <div className="flex h-[120px] items-center justify-center rounded-[14px] border border-ln"><Miniatura musculo={info.musculo} id={info.id} tam={72} /></div>}
          <h3 className="mt-3 font-display text-[20px] font-semibold">{info.nombre}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="chip h-7 px-3 text-[12.5px]">{info.musculo}</span>
            {info.equipo && <span className="chip h-7 px-3 text-[12.5px]">{info.equipo}</span>}
          </div>
          {(() => {
            const x = estados.get(info.id);
            if (!x?.ultima) return <p className="mt-4 text-[13.5px] text-mu">Todavía no lo hiciste. Empezá con un peso cómodo y buena técnica.</p>;
            return (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="tarjeta py-2"><div className="etiqueta">Mejor</div><div className="num oro text-[18px]">{formatoPeso(x.mejorPeso, perfil.unidad)}</div></div>
                <div className="tarjeta py-2"><div className="etiqueta">1RM</div><div className="num oro text-[18px]">{x.mejor1RM ? formatoPeso(x.mejor1RM, perfil.unidad, 0) : '—'}</div></div>
                <div className="tarjeta py-2"><div className="etiqueta">Sesiones</div><div className="num oro text-[18px]">{x.puntos.length}</div></div>
              </div>
            );
          })()}
          <button className="btn mt-5 w-full" disabled={elegidos.includes(info.id)} onClick={() => { alElegir(info); setInfo(null); }}>
            <Icono n="mas" size={16} />{elegidos.includes(info.id) ? 'Ya está agregado' : 'Agregar ejercicio'}
          </button>
        </div>
      ) : creando ? (
        <div className="flex flex-col gap-4">
          <label>
            <span className="etiqueta">Nombre del ejercicio</span>
            <input className="campo mt-2" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Ej.: Remo en T" />
          </label>
          <div>
            <span className="etiqueta">Músculo</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {MUSCULOS.map((m) => (
                <button key={m} onClick={() => setMNuevo(m)} className={`chip ${mNuevo === m ? 'chip-on' : ''}`}>{m}</button>
              ))}
            </div>
          </div>
          <button className="btn" onClick={crear} disabled={!nombre.trim()}>Guardar ejercicio</button>
          <button className="btn-sec" onClick={() => setCreando(false)}>Volver a la lista</button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Icono n="buscar" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-mu" />
            <input className="campo pl-10" placeholder="Buscar ejercicio" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar ejercicio" />
          </div>
          <div className="mt-3 -mx-5 px-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por músculo">
            {(['Todos', ...MUSCULOS] as const).map((m) => (
              <button key={m} onClick={() => setMusculo(m)} className={`chip shrink-0 ${musculo === m ? 'chip-on' : ''}`}>{m === 'Todos' ? 'Todos los músculos' : m}</button>
            ))}
          </div>
          <div className="mt-2 -mx-5 px-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por equipo">
            {['Todos', ...EQUIPOS].map((q) => (
              <button key={q} onClick={() => setEquipo(q)} className={`chip shrink-0 h-8 text-[12.5px] ${equipo === q ? 'chip-on' : ''}`}>{q === 'Todos' ? 'Todo el equipo' : q}</button>
            ))}
          </div>
          <button onClick={() => setCreando(true)} className="btn-sec w-full mt-4"><Icono n="mas" size={16} />Crear ejercicio propio</button>
          <div className="mt-2">
            {grupos.map((g) => (
              <div key={g.m} className="mt-4">
                <div className="etiqueta mb-1">{g.m}</div>
                {g.items.map((e) => {
                  const ya = elegidos.includes(e.id);
                  return (
                    <div key={g.m + e.id} className="flex items-center gap-1">
                      <button disabled={ya} onClick={() => alElegir(e)} className="fila min-w-0 flex-1 text-left disabled:opacity-50">
                        <Miniatura musculo={e.musculo} id={e.id} tam={42} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-tx">{e.nombre}</span>
                          <span className="text-[12.5px] text-mu">{e.propio ? 'Propio' : `${e.musculo} · ${e.equipo}`}</span>
                        </span>
                        <span className="oro">{ya ? <Icono n="check" size={20} /> : <Icono n="mas" size={20} />}</span>
                      </button>
                      <button aria-label={`Información de ${e.nombre}`} onClick={() => setInfo(e)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ln2 font-display text-[16px] italic text-mu hover:border-gold hover:text-tx">i</button>
                    </div>
                  );
                })}
              </div>
            ))}
            {!grupos.length && <p className="py-8 text-center text-mu">No encontramos ese ejercicio. Podés crearlo como propio.</p>}
          </div>
        </>
      )}
    </Hoja>
  );
}
