import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BIBLIOTECA, buscarEjercicio } from '../../lib/biblioteca';
import {
  NOMBRES_DIA, aKg, aUnidad, contarSeries, formatoNumero, formatoPeso, nuevoId, rachaSemanas, redondear, semanaActual,
} from '../../lib/logica';
import { PLANTILLAS, rutinasDePlantilla, textoObjetivo } from '../../lib/plantillas';
import type { Ejercicio, Entrenamiento, EstadoEjercicio, RegistroCuerpo, Rutina, Unidad } from '../../lib/tipos';
import type { Repo } from '../../data/repo';
import { useSesion } from '../../ui/contexto';
import { Icono } from '../../ui/Icono';
import { Cargando, GraficoLinea, Hoja, Selector } from '../../ui/piezas';
import { Miniatura } from '../../screens/Miniatura';
import type { CtxFicha, Seccion } from '../FichaCliente';
import { diasSinActividad, vecesEstaSemana } from '../logica';
import { Dato, HiloComentarios, ListaObjetivos, fechaHora, fechaPro } from '../piezas';
import type { Objetivo } from '../tipos';
import { MEDIDAS, medirObjetivo, ultimaMedida } from './medir';
import { textoUltimo } from '../PanelClientes';

// ── Datos del cliente (se leen una vez y se comparten entre pestañas) ──
interface Datos { historial: Entrenamiento[]; estados: Map<string, EstadoEjercicio>; cuerpo: RegistroCuerpo[]; rutinas: Rutina[]; propios: Ejercicio[] }
const cache = new Map<string, { t: number; p: Promise<Datos> }>();
export function olvidarDatos(clienteId: string) { cache.delete(clienteId); }

function cargar(repo: Repo, clienteId: string): Promise<Datos> {
  const c = cache.get(clienteId);
  if (c && Date.now() - c.t < 60_000) return c.p;
  const p = (async () => {
    const [historial, estados, cuerpo, rutinas, propios] = await Promise.all([
      repo.leerHistorial(clienteId, 40), repo.leerEstados(clienteId), repo.leerCuerpo(clienteId),
      repo.leerRutinas(clienteId), repo.leerPropios(clienteId),
    ]);
    return { historial, estados, cuerpo, rutinas, propios };
  })();
  cache.set(clienteId, { t: Date.now(), p });
  p.catch(() => cache.delete(clienteId));
  return p;
}

function useDatos(clienteId: string) {
  const { repo } = useSesion();
  const [d, setD] = useState<Datos | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => { cargar(repo, clienteId).then(setD); }, [repo, clienteId, n]);
  return { d, recargar: () => { olvidarDatos(clienteId); setN((x) => x + 1); } };
}

const duracion = (e: Entrenamiento) => `${Math.round((e.fin - e.inicio) / 60_000)} min`;
const titEntreno = (e: Entrenamiento) => `${e.nombre} · ${fechaPro(e.inicio)}`;

// ── Resumen ──
function Resumen(c: CtxFicha) {
  const { perfil: yo } = useSesion();
  const { d } = useDatos(c.vinculo.clienteId);
  const u = yo.unidad;
  const ahora = Date.now();
  const dias = c.perfil.resumen.dias;
  const sin = diasSinActividad(dias, ahora);
  const sinLeer = c.comentarios.filter((k) => k.autorId === c.vinculo.clienteId && k.fecha > (c.comentarios.find((x) => x.autorId === c.yo.uid)?.fecha ?? 0));
  if (!d) return <Cargando />;
  const peso = ultimaMedida(d.cuerpo, 'peso');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Dato etiqueta="Entrenos" valor={c.perfil.resumen.total} />
        <Dato etiqueta="Racha" valor={`${rachaSemanas(dias, ahora)} sem`} />
        <Dato etiqueta="Esta semana" valor={vecesEstaSemana(dias, ahora)} />
        <Dato etiqueta="Peso" valor={peso ? `${formatoNumero(redondear(peso, 1))} kg` : '—'} />
      </div>

      {(sin === undefined || sin >= 4) && (
        <div className="tarjeta flex items-start gap-3 border-gold2" role="alert">
          <Icono n="alerta" size={22} className={sin !== undefined && sin > 7 ? 'shrink-0 text-miss' : 'shrink-0 oro'} />
          <div>
            <div className="font-semibold">{textoUltimo(sin)}</div>
            <p className="text-[14px] text-mu">{sin === undefined ? 'Asignale una rutina para que arranque.' : 'Un mensaje a tiempo ayuda a que no abandone.'}</p>
            <button className="mt-2 text-[14px] font-semibold oro" onClick={() => c.irA('mensajes')}>Escribirle →</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="tarjeta min-w-0">
          <div className="etiqueta">Esta semana</div>
          <div className="mt-3 flex justify-between">
            {semanaActual(dias, ahora).map((x, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-bold ${x.hecho ? 'border-goldh' : x.hoy ? 'border-gold oro' : 'border-ln2 text-mu2'}`}
                  style={x.hecho ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>{x.hecho ? <Icono n="check" size={15} /> : x.letra}</span>
              </div>
            ))}
          </div>
          <div className="etiqueta mt-5">Últimos entrenamientos</div>
          <ul className="mt-2">
            {d.historial.slice(0, 3).map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-2 border-b border-ln2 py-2 text-[14px] last:border-0">
                <span className="truncate">{e.nombre}</span>
                <span className="shrink-0 text-mu">{fechaPro(e.inicio)} · {formatoPeso(e.volumen, u, 0)}</span>
              </li>
            ))}
            {!d.historial.length && <li className="py-2 text-[14px] text-mu">Sin entrenamientos todavía.</li>}
          </ul>
          {d.historial.length > 0 && <button className="mt-2 text-[14px] font-semibold oro" onClick={() => c.irA('entrenos')}>Ver todos →</button>}
        </section>

        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="etiqueta">Objetivos</span>
            <button className="text-[13px] font-semibold oro" onClick={() => c.irA('objetivos')}>Administrar →</button>
          </div>
          <ListaObjetivos objetivos={c.objetivos} medir={(o) => medirObjetivo(o, { perfil: c.perfil, estados: d.estados, cuerpo: d.cuerpo }, ahora, u)} />
          {sinLeer.length > 0 && (
            <button className="tarjeta mt-3 flex w-full items-center gap-3 text-left" onClick={() => c.irA('mensajes')}>
              <Icono n="mensaje" className="oro shrink-0" />
              <span className="flex-1 text-[14px]"><b>{c.perfil.nombre.split(' ')[0]}</b> te respondió: “{sinLeer[0].texto.slice(0, 80)}”</span>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Entrenamientos con comentarios ──
function Entrenos(c: CtxFicha) {
  const { repo, perfil: yo } = useSesion();
  const { d } = useDatos(c.vinculo.clienteId);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [cuantos, setCuantos] = useState(10);
  const u = yo.unidad;
  if (!d) return <Cargando />;
  if (!d.historial.length) return <p className="tarjeta py-8 text-center text-mu">{c.perfil.nombre} todavía no registró entrenamientos.</p>;
  return (
    <>
    <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
      {d.historial.slice(0, cuantos).map((e) => {
        const ks = c.comentarios.filter((k) => k.sobre?.tipo === 'entrenamiento' && k.sobre.id === e.id);
        const ab = abierto === e.id;
        return (
          <li key={e.id} className="tarjeta" data-testid="entreno-cliente">
            <button className="flex w-full items-start gap-3 text-left" onClick={() => setAbierto(ab ? null : e.id)} aria-expanded={ab}>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[17px] font-semibold">{e.nombre}</div>
                <div className="text-[13px] text-mu first-letter:uppercase">{fechaHora(e.inicio)} · {duracion(e)} · {contarSeries(e.ejercicios)} series · {formatoPeso(e.volumen, u, 0)}</div>
                {e.records.length > 0 && <div className="mt-1 flex items-center gap-1 text-[13px] oro"><Icono n="medalla" size={14} />{e.records.length} récord{e.records.length > 1 ? 's' : ''}</div>}
              </div>
              {ks.length > 0 && <span className="chip h-7 shrink-0 gap-1 px-2 text-[12px]"><Icono n="mensaje" size={13} />{ks.length}</span>}
              <Icono n={ab ? 'arriba' : 'abajo'} size={18} className="shrink-0 text-mu" />
            </button>
            {ab && (
              <div className="mt-3 border-t border-ln2 pt-3">
                <ul className="flex flex-col gap-2 text-[14px]">
                  {e.ejercicios.map((x, i) => (
                    <li key={i}>
                      <div className="font-semibold oro">{buscarEjercicio(x.ejercicioId, d.propios)?.nombre ?? 'Ejercicio'}</div>
                      <div className="text-mu">
                        {x.series.filter((s) => s.hecha).map((s) => `${formatoNumero(redondear(aUnidad(s.peso, u)))}×${s.reps}${s.tipo === 'fallo' ? 'F' : ''}`).join(' · ') || '—'}
                      </div>
                      {x.nota && <div className="text-[13px] italic text-mu2">“{x.nota}”</div>}
                    </li>
                  ))}
                </ul>
                {e.nota && <p className="mt-2 text-[14px] italic text-mu">Nota del cliente: “{e.nota}”</p>}
                <div className="etiqueta mt-4">Comentarios</div>
                <HiloComentarios comentarios={ks} yo={c.yo} sobre={{ tipo: 'entrenamiento', id: e.id, titulo: titEntreno(e) }} compacto
                  placeholder={`Comentario para ${c.perfil.nombre.split(' ')[0]}…`}
                  alEnviar={async (k) => { await repo.guardarComentario(c.vinculo.clienteId, k); await c.recargarComentarios(); }} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
    {d.historial.length > cuantos && (
      <button className="btn-sec mt-3 w-full" onClick={() => setCuantos((n) => n + 10)}>Ver más entrenamientos</button>
    )}
    </>
  );
}

// ── Rutinas: ver las del cliente y asignarle ──
function Rutinas(c: CtxFicha) {
  const { repo, usuario, perfil: yo, aviso } = useSesion();
  const { d, recargar } = useDatos(c.vinculo.clienteId);
  const [copiar, setCopiar] = useState(false);
  const [mias, setMias] = useState<Rutina[]>([]);
  const [borrar, setBorrar] = useState<Rutina | null>(null);
  useEffect(() => { repo.leerRutinas(usuario.uid).then(setMias); }, [repo, usuario.uid]);
  if (!d) return <Cargando />;
  const cid = c.vinculo.clienteId;
  const asignar = (r: Rutina, orden: number): Rutina => ({
    ...r, id: nuevoId(), orden, creado: Date.now(), asignadaPor: usuario.uid, nombreAsignador: yo.nombre,
  });
  async function asignarVarias(rs: Rutina[], texto: string) {
    let o = d!.rutinas.length;
    for (const r of rs) await repo.guardarRutina(cid, asignar(r, o++));
    setCopiar(false);
    recargar();
    aviso(texto);
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Link to={`/clientes/${cid}/rutinas/nueva`} className="btn h-11 flex-1 text-[14px]"><Icono n="mas" size={16} />Nueva rutina</Link>
        <button className="btn-sec h-11 flex-1 text-[14px]" onClick={() => setCopiar(true)}><Icono n="copiar" size={16} />Copiar una existente</button>
      </div>
      {!d.rutinas.length ? <p className="tarjeta py-8 text-center text-mu">{c.perfil.nombre} no tiene rutinas todavía.</p> : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {d.rutinas.map((r) => {
            const mia = r.asignadaPor === usuario.uid;
            return (
              <li key={r.id} className="tarjeta" data-testid="rutina-cliente">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[17px] font-semibold">{r.nombre}</div>
                    <div className="text-[13px] oro">{r.dias.length ? r.dias.map((x) => NOMBRES_DIA[x]).join(' · ') : 'Sin día fijo'}</div>
                  </div>
                  <span className={`chip h-7 shrink-0 px-2 text-[11px] ${mia ? 'chip-on' : ''}`}>{mia ? 'Asignada por vos' : 'Del cliente'}</span>
                </div>
                <ul className="mt-2 text-[13px] text-mu">
                  {r.ejercicios.map((e, i) => (
                    <li key={i} className="flex justify-between gap-2 border-b border-ln2 py-1 last:border-0">
                      <span className="truncate">{buscarEjercicio(e.ejercicioId, d.propios)?.nombre ?? 'Ejercicio'}</span><span className="num shrink-0 text-tx2">{textoObjetivo(e)}{e.peso ? ` · ${formatoPeso(e.peso, yo.unidad)}` : ''}</span>
                    </li>
                  ))}
                </ul>
                {mia && (
                  <div className="mt-3 flex gap-2">
                    <Link to={`/clientes/${cid}/rutinas/${r.id}`} className="btn-sec h-9 flex-1 text-[13px]"><Icono n="editar" size={15} />Editar</Link>
                    <button className="btn-sec h-9 px-3 text-[13px] text-miss" aria-label={`Quitar ${r.nombre}`} onClick={() => setBorrar(r)}><Icono n="basura" size={15} /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Hoja abierta={copiar} alCerrar={() => setCopiar(false)} etiqueta="Asignar" titulo={`Copiar a ${c.perfil.nombre.split(' ')[0]}`}>
        <p className="text-[14px] text-mu">Se le crea una copia: si después la cambiás acá, la tuya no cambia.</p>
        {mias.length > 0 && <div className="etiqueta mt-4">Tus rutinas</div>}
        <ul className="mt-2 flex flex-col gap-2">
          {mias.map((r) => (
            <li key={r.id}><button className="fila w-full text-left" onClick={() => asignarVarias([r], `Rutina "${r.nombre}" asignada`)}>
              <span className="flex-1"><b>{r.nombre}</b><span className="block text-[12px] text-mu">{r.ejercicios.length} ejercicios</span></span><Icono n="mas" size={18} className="oro" />
            </button></li>
          ))}
        </ul>
        <div className="etiqueta mt-4">Plantillas</div>
        <ul className="mt-2 flex flex-col gap-2">
          {PLANTILLAS.map((p) => (
            <li key={p.id}><button className="fila w-full text-left" onClick={() => asignarVarias(rutinasDePlantilla(p, 0), `${p.rutinas.length} rutinas asignadas`)}>
              <span className="flex-1"><b>{p.nombre}</b><span className="block text-[12px] text-mu">{p.rutinas.length} rutinas · {p.nivel}</span></span><Icono n="mas" size={18} className="oro" />
            </button></li>
          ))}
        </ul>
      </Hoja>

      <Hoja abierta={!!borrar} alCerrar={() => setBorrar(null)} etiqueta="Confirmar" titulo={`¿Quitar "${borrar?.nombre ?? ''}"?`}>
        <p className="text-mu">Deja de aparecerle. Los entrenamientos que ya hizo con ella quedan guardados.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn btn-peligro"
            onClick={async () => { await repo.borrarRutina(cid, borrar!.id); setBorrar(null); recargar(); aviso('Rutina quitada'); }}>Sí, quitar</button>
          <button className="btn-sec" onClick={() => setBorrar(null)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}

// ── Progreso: ejercicios y cuerpo ──
function Progreso(c: CtxFicha) {
  const { perfil: yo } = useSesion();
  const { d } = useDatos(c.vinculo.clienteId);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [medida, setMedida] = useState<string>('peso');
  const u: Unidad = yo.unidad;
  const ejercicios = useMemo(() => d ? [...d.estados.values()].filter((e) => e.puntos.length)
    .sort((a, b) => (b.ultima?.fecha ?? 0) - (a.ultima?.fecha ?? 0)) : [], [d]);
  if (!d) return <Cargando />;
  const puntosCuerpo = d.cuerpo.filter((r) => typeof (r as unknown as Record<string, unknown>)[medida] === 'number')
    .map((r) => ({ x: r.fecha, y: (r as unknown as Record<string, number>)[medida] }));
  const m = MEDIDAS.find((x) => x.v === medida)!;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
      <section className="min-w-0">
        <div className="etiqueta mb-2">Ejercicios · {ejercicios.length}</div>
        {!ejercicios.length && <p className="tarjeta py-6 text-center text-mu">Sin registros todavía.</p>}
        <ul className="flex flex-col gap-2">
          {ejercicios.map((e) => {
            const ej = buscarEjercicio(e.ejercicioId, d.propios);
            const ab = abierto === e.ejercicioId;
            return (
              <li key={e.ejercicioId} className="tarjeta py-3" data-testid="progreso-ejercicio">
                <button className="flex w-full items-center gap-3 text-left" onClick={() => setAbierto(ab ? null : e.ejercicioId)} aria-expanded={ab}>
                  <Miniatura id={e.ejercicioId} musculo={ej?.musculo} tam={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{ej?.nombre ?? 'Ejercicio'}</span>
                    <span className="text-[12px] text-mu">Última vez {e.ultima ? fechaPro(e.ultima.fecha) : '—'}</span>
                  </span>
                  <span className="text-right">
                    <span className="num block text-[17px] oro">{formatoPeso(e.mejorPeso, u)}</span>
                    {e.mejor1RM ? <span className="text-[11px] text-mu">1RM {formatoPeso(e.mejor1RM, u, 1)}</span> : null}
                  </span>
                </button>
                {ab && <div className="mt-3"><GraficoLinea etiqueta="Peso máximo por sesión" puntos={e.puntos.map((p) => ({ x: p.fecha, y: aUnidad(p.pesoMax, u) }))}
                  formato={(n) => `${formatoNumero(redondear(n, 1))} ${u}`} /></div>}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="tarjeta min-w-0">
        <div className="etiqueta">Cuerpo</div>
        <div className="mt-3 max-w-full overflow-x-auto"><Selector nombre="Medida" valor={medida} alCambiar={setMedida} opciones={MEDIDAS.map((x) => ({ v: x.v, t: x.t.replace(' corporal', '') }))} /></div>
        <div className="mt-3">
          {puntosCuerpo.length ? <GraficoLinea etiqueta={m.t} puntos={puntosCuerpo} formato={(n) => `${formatoNumero(redondear(n, 1))} ${m.u}`} />
            : <p className="py-6 text-center text-[14px] text-mu">Sin registros de {m.t.toLowerCase()}.</p>}
        </div>
      </section>
    </div>
  );
}

// ── Objetivos ──
function Objetivos(c: CtxFicha) {
  const { repo, usuario, perfil: yo, aviso } = useSesion();
  const { d } = useDatos(c.vinculo.clienteId);
  const [nuevo, setNuevo] = useState(false);
  const [tipo, setTipo] = useState<Objetivo['tipo']>('frecuencia');
  const [meta, setMeta] = useState('3');
  const [ref, setRef] = useState('sentadilla');
  const [medida, setMedida] = useState('peso');
  const [texto, setTexto] = useState('');
  const [hasta, setHasta] = useState('');
  const u = yo.unidad;
  if (!d) return <Cargando />;
  const ahora = Date.now();
  const cid = c.vinculo.clienteId;
  const conDatos = [...d.estados.keys()];
  const opcionesEj = [...conDatos.map((id) => buscarEjercicio(id, d.propios)).filter(Boolean) as Ejercicio[],
    ...BIBLIOTECA.filter((e) => !conDatos.includes(e.id))];

  function cambiarTipo(t: Objetivo['tipo']) {
    setTipo(t);
    if (t === 'frecuencia') setMeta('3');
    if (t === 'marca') setMeta(String(redondear(aUnidad((d!.estados.get(ref)?.mejorPeso ?? 40) + 10, u), 0)));
    if (t === 'corporal') setMeta(String(redondear(ultimaMedida(d!.cuerpo, medida) ?? 75, 0)));
  }

  async function guardar() {
    const n = Number(meta.replace(',', '.')) || 0;
    const base = { id: nuevoId(), creadoPor: usuario.uid, fecha: Date.now(), ...(hasta ? { hasta: new Date(hasta + 'T23:59').getTime() } : {}) };
    let o: Objetivo;
    if (tipo === 'frecuencia') o = { ...base, tipo, titulo: `Entrenar ${n} ${n === 1 ? 'vez' : 'veces'} por semana`, meta: n, unidad: 'veces' };
    else if (tipo === 'marca') {
      const ej = buscarEjercicio(ref, d!.propios);
      o = { ...base, tipo, titulo: `${ej?.nombre ?? 'Ejercicio'} ${formatoNumero(n)} ${u}`, meta: aKg(n, u), unidad: 'kg', referencia: ref };
    } else if (tipo === 'corporal') {
      const m = MEDIDAS.find((x) => x.v === medida)!;
      const actual = ultimaMedida(d!.cuerpo, medida);
      const bajar = actual !== undefined && n < actual;
      o = { ...base, tipo, titulo: `${m.t}: ${bajar ? 'bajar' : 'llegar'} a ${formatoNumero(n)} ${m.u}`, meta: n, unidad: m.u, referencia: medida, bajar, ...(actual !== undefined ? { inicio: actual } : {}) };
    } else o = { ...base, tipo, titulo: texto.trim() || 'Objetivo', meta: 1 };
    await repo.guardarObjetivo(cid, o);
    await c.recargarObjetivos();
    setNuevo(false); setTexto(''); setHasta('');
    aviso('Objetivo guardado');
  }

  return (
    <div>
      <button className="btn mb-3 w-full lg:w-auto lg:px-6" onClick={() => setNuevo(true)}><Icono n="mas" size={16} />Nuevo objetivo</button>
      <ListaObjetivos objetivos={c.objetivos} medir={(o) => medirObjetivo(o, { perfil: c.perfil, estados: d.estados, cuerpo: d.cuerpo }, ahora, u)}
        alBorrar={async (o) => { await repo.borrarObjetivo(cid, o.id); await c.recargarObjetivos(); aviso('Objetivo quitado'); }}
        alCumplir={async (o) => { await repo.guardarObjetivo(cid, { ...o, cumplido: !o.cumplido }); await c.recargarObjetivos(); }} />

      <Hoja abierta={nuevo} alCerrar={() => setNuevo(false)} etiqueta="Objetivo" titulo={`Nuevo objetivo para ${c.perfil.nombre.split(' ')[0]}`}>
        <div className="overflow-x-auto">
          <Selector nombre="Tipo de objetivo" valor={tipo} alCambiar={cambiarTipo}
            opciones={[{ v: 'frecuencia', t: 'Constancia' }, { v: 'marca', t: 'Marca' }, { v: 'corporal', t: 'Cuerpo' }, { v: 'libre', t: 'Libre' }]} />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {tipo === 'marca' && (
            <label className="block"><span className="etiqueta">Ejercicio</span>
              <select className="campo mt-2" value={ref} onChange={(e) => setRef(e.target.value)} aria-label="Ejercicio del objetivo">
                {opcionesEj.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              {d.estados.get(ref) && <span className="mt-1 block text-[13px] text-mu">Hoy levanta {formatoPeso(d.estados.get(ref)!.mejorPeso, u)}</span>}
            </label>
          )}
          {tipo === 'corporal' && (
            <label className="block"><span className="etiqueta">Medida</span>
              <select className="campo mt-2" value={medida} onChange={(e) => setMedida(e.target.value)} aria-label="Medida del objetivo">
                {MEDIDAS.map((m) => <option key={m.v} value={m.v}>{m.t}</option>)}
              </select>
              {ultimaMedida(d.cuerpo, medida) !== undefined && <span className="mt-1 block text-[13px] text-mu">Ahora: {formatoNumero(redondear(ultimaMedida(d.cuerpo, medida)!, 1))} {MEDIDAS.find((m) => m.v === medida)!.u}</span>}
            </label>
          )}
          {tipo === 'libre' ? (
            <label className="block"><span className="etiqueta">Objetivo</span>
              <input className="campo mt-2" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={120} placeholder="Ej.: Hacer 5 dominadas seguidas" aria-label="Texto del objetivo" />
            </label>
          ) : (
            <label className="block"><span className="etiqueta">{tipo === 'frecuencia' ? 'Veces por semana' : `Meta (${tipo === 'marca' ? u : MEDIDAS.find((m) => m.v === medida)!.u})`}</span>
              <input className="campo mt-2" inputMode="decimal" value={meta} onChange={(e) => setMeta(e.target.value)} aria-label="Meta" />
            </label>
          )}
          <label className="block"><span className="etiqueta">Fecha límite (opcional)</span>
            <input type="date" className="campo mt-2" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Fecha límite" />
          </label>
          <button className="btn mt-2" onClick={guardar}>Guardar objetivo</button>
        </div>
      </Hoja>
    </div>
  );
}

// ── Mensajes generales (no atados a un entrenamiento) ──
function Mensajes(c: CtxFicha) {
  const { repo } = useSesion();
  return (
    <div className="lg:max-w-[720px]">
      <p className="mb-3 text-[14px] text-mu">Todo lo que le escribiste a {c.perfil.nombre.split(' ')[0]}, incluidos los comentarios en sus entrenamientos.</p>
      <div className="flex flex-col gap-2">
        {[...c.comentarios].sort((a, b) => a.fecha - b.fecha).filter((k) => k.sobre).length > 0 && (
          <div className="etiqueta">Sobre entrenamientos</div>
        )}
        {[...c.comentarios].filter((k) => k.sobre).sort((a, b) => b.fecha - a.fecha).slice(0, 6).map((k) => (
          <div key={k.id} className="rounded-[12px] border border-ln2 px-3 py-2 text-[14px]">
            <div className="text-[11px] text-mu"><b className={k.autorId === c.yo.uid ? 'oro' : 'text-tx2'}>{k.autorId === c.yo.uid ? 'Vos' : k.autorNombre}</b> · {k.sobre?.titulo} · {fechaHora(k.fecha)}</div>
            <p>{k.texto}</p>
          </div>
        ))}
        <div className="etiqueta mt-3">Conversación</div>
        <HiloComentarios comentarios={c.comentarios.filter((k) => !k.sobre)} yo={c.yo} placeholder={`Mensaje para ${c.perfil.nombre.split(' ')[0]}…`}
          alEnviar={async (k) => { await repo.guardarComentario(c.vinculo.clienteId, k); await c.recargarComentarios(); }} />
      </div>
    </div>
  );
}

export const SECCIONES_ENTRENADOR: Seccion[] = [
  { id: 'resumen', titulo: 'Resumen', Componente: Resumen },
  { id: 'entrenos', titulo: 'Entrenos', Componente: Entrenos },
  { id: 'rutinas', titulo: 'Rutinas', Componente: Rutinas },
  { id: 'progreso', titulo: 'Progreso', Componente: Progreso },
  { id: 'objetivos', titulo: 'Objetivos', Componente: Objetivos },
  { id: 'mensajes', titulo: 'Mensajes', Componente: Mensajes },
];
