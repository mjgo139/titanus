import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { borrarBorrador, guardarBorrador, leerBorrador, type Borrador } from '../lib/borrador';
import { DESCANSO_POR_DEFECTO, anteriorPara, aplicarSugerencia, cerrarEntrenamiento, ejercicioNuevo } from '../lib/entreno';
import { aKg, aUnidad, formatoNumero, redondear, reloj, romano, seriesHechas } from '../lib/logica';
import { avisoFinDescanso, prepararAudio } from '../lib/sonido';
import type { Ejercicio, EstadoEjercicio, Sensacion, TipoSerie } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Hoja } from '../ui/piezas';
import { Biblioteca } from './Biblioteca';
import { Animacion, Miniatura } from './Miniatura';
import { Foco, siguientePendiente, type Posicion } from './Foco';
import { AccionesEjercicio, TarjetaEjercicio, textoDescanso } from './TarjetaEjercicio';
import { deIdSesion, marcarEnLista, programasActivos } from '../lib/programas';
import { anotarHoy } from '../lib/logica';
import { OrdenEntreno } from './OrdenEntreno';
export { textoDescanso };

const TIPOS: { v: TipoSerie; t: string; l: string; c: string }[] = [
  { v: 'calentamiento', t: 'Calentamiento', l: 'C', c: '#e0b04a' },
  { v: 'normal', t: 'Normal', l: '', c: 'var(--tx)' },
  { v: 'fallo', t: 'Al fallo', l: 'F', c: '#d9826f' },
  { v: 'drop', t: 'Drop set', l: 'D', c: '#8fb3d9' },
];
const SENSACIONES: { v: Sensacion; t: string }[] = [{ v: 2, t: 'Fácil' }, { v: 3, t: 'Justa' }, { v: 5, t: 'Al límite' }];
const DESCANSOS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

/** "Última vez": lo que hizo en este ejercicio la sesión anterior */
function UltimaVez({ ultima, u }: { ultima?: EstadoEjercicio['ultima']; u: 'kg' | 'lb' }) {
  if (!ultima?.series.length) {
    return <p className="mt-1 text-[13px] text-mu2" data-testid="ultima-vez">Primera vez con este ejercicio: elegí un peso cómodo.</p>;
  }
  const pesos = [...new Set(ultima.series.map((x) => x.peso))];
  const reps = ultima.series.map((x) => `${x.reps}${x.tipo === 'fallo' ? ' (F)' : x.tipo === 'calentamiento' ? ' (C)' : ''}`).join(' · ');
  return (
    <p className="mt-1 rounded-[8px] bg-goldbg/60 px-2 py-1 text-[13px]" data-testid="ultima-vez">
      <span className="oro font-semibold">Última vez</span>
      <span className="text-mu"> · {new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' }).format(ultima.fecha).replace('.', '')}: </span>
      <span className="text-tx2">{pesos.length === 1 ? `${formatoNumero(redondear(aUnidad(pesos[0], u)))} ${u} × ${reps}` : ultima.series.map((x) => `${formatoNumero(redondear(aUnidad(x.peso, u)))}×${x.reps}`).join(' · ') + ` ${u}`}</span>
    </p>
  );
}

/** Entrenamiento en vivo, al estilo Hevy */
export default function Entrenar() {
  const { repo, usuario, perfil, cambiarPerfil, aviso } = useSesion();
  const nav = useNavigate();
  const [b, setB] = useState<Borrador | null>(null);
  const [estados, setEstados] = useState<Map<string, EstadoEjercicio>>(new Map());
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [descanso, setDescanso] = useState<{ fin: number; total: number } | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [terminar, setTerminar] = useState(false);
  const [biblio, setBiblio] = useState(false);
  const [menuSerie, setMenuSerie] = useState<{ i: number; j: number } | null>(null);
  const [menuEj, setMenuEj] = useState<number | null>(null);
  const [descartar, setDescartar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const sono = useRef(false);
  const [vista, setVista] = useState<'foco' | 'lista'>(() => {
    try { return (localStorage.getItem('titanus-vista') as 'foco' | 'lista') || 'foco'; } catch { return 'foco'; }
  });
  const [pos, setPos] = useState<Posicion | null>(null);
  const [elegidos, setElegidos] = useState<Record<number, boolean>>({});
  const [eliminarEj, setEliminarEj] = useState<number | null>(null);
  const [notaAbierta, setNotaAbierta] = useState<Record<number, boolean>>({});
  /** Valor elegido por el usuario en la hoja de sobrecarga (kg o reps, según el caso) */
  const [valores, setValores] = useState<Record<number, number>>({});
  const cambiarVista = (v: 'foco' | 'lista') => { setVista(v); try { localStorage.setItem('titanus-vista', v); } catch { /* nada */ } };
  const u = perfil.unidad;

  useEffect(() => {
    const previo = leerBorrador(usuario.uid);
    if (!previo) { nav('/entreno', { replace: true }); return; }
    setB(previo);
    setPos(siguientePendiente(previo) ?? null);
    if (previo.preparando && !previo.ejercicios.length) setBiblio(true);
    repo.leerPropios(usuario.uid).then(setPropios);
    repo.leerEstados(usuario.uid, previo.ejercicios.map((e) => e.ejercicioId)).then(setEstados);
  }, [repo, usuario.uid, nav]);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (descanso && ahora >= descanso.fin && !sono.current) {
      sono.current = true;
      avisoFinDescanso();
      setTimeout(() => setDescanso(null), 1500);
    }
  }, [ahora, descanso]);

  const cambiar = useCallback((f: (x: Borrador) => Borrador | void) => {
    setB((x) => {
      if (!x) return x;
      const c = structuredClone(x);
      const n = f(c) ?? c;
      guardarBorrador(usuario.uid, n);
      return n;
    });
  }, [usuario.uid]);

  if (!b) return <Cargando forma="pagina" />;

  function marcar(i: number, j: number) {
    prepararAudio();
    const s = b!.ejercicios[i].series[j];
    const hecha = !s.hecha;
    cambiar((x) => {
      const t = x.ejercicios[i].series[j];
      t.hecha = hecha;
      // Si no cargó nada, toma lo de la vez anterior
      const ant = anteriorPara(estados.get(x.ejercicios[i].ejercicioId)?.ultima?.series, x.ejercicios[i].series, j);
      if (hecha && !t.reps && ant) { t.reps = ant.reps; if (!t.peso) t.peso = ant.peso; }
    });
    const seg = b!.ejercicios[i].descanso ?? DESCANSO_POR_DEFECTO;
    if (hecha && seg > 0) {
      sono.current = false;
      setDescanso({ fin: Date.now() + seg * 1000, total: seg });
    }
    // En la vista de foco, al marcar pasa sola a la próxima serie pendiente
    if (hecha && vista === 'foco') {
      const copia = structuredClone(b!);
      copia.ejercicios[i].series[j].hecha = true;
      const sig = siguientePendiente(copia, { i, j });
      if (sig && !copia.ejercicios[sig.i].series[sig.j].hecha) setPos(sig);
    }
  }

  async function agregarEjercicio(e: Ejercicio) {
    setBiblio(false);
    let est = estados.get(e.id);
    if (!est) {
      const m = await repo.leerEstados(usuario.uid, [e.id]);
      est = m.get(e.id);
      if (est) setEstados((x) => new Map(x).set(e.id, est!));
    }
    const nuevo = ejercicioNuevo(e.id, est, 3, 10, e.musculo === 'Cardio' ? 60 : DESCANSO_POR_DEFECTO);
    cambiar((x) => { x.ejercicios.push(nuevo); });
    setPos({ i: b!.ejercicios.length, j: 0 });
  }

  async function finalizar() {
    if (!b) return;
    setGuardando(true);
    const c = cerrarEntrenamiento(b, estados, perfil.resumen);
    if (!c.entreno.ejercicios.length) {
      setGuardando(false);
      setTerminar(false);
      aviso('Marcá al menos una serie como hecha');
      return;
    }
    await repo.guardarEntrenamiento(usuario.uid, c.entreno, c.estados, c.resumen);
    // Si era una sesión de un programa, queda marcada (en la misma escritura del perfil)
    // y si era una rutina, queda anotada como hecha hoy (para mostrar la siguiente del día)
    const ses = deIdSesion(b.rutinaId);
    const activos = programasActivos(perfil);
    const prog = ses && activos.some((a) => a.id === ses.programaId)
      ? { programas: marcarEnLista(activos, ses.programaId, ses.clave), programa: null } : {};
    const hoy = b.rutinaId ? { hoy: anotarHoy(perfil, b.rutinaId) } : {};
    await cambiarPerfil({ resumen: c.resumen, ...prog, ...hoy });
    borrarBorrador(usuario.uid);
    nav('/resumen', { replace: true, state: { entreno: c.entreno } });
  }

  const posActual = pos && b.ejercicios[pos.i]?.series[pos.j] ? pos : siguientePendiente(b) ?? null;
  function moverEjercicio(i: number, d: -1 | 1) {
    cambiar((x) => { const l = x.ejercicios; const j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; });
  }
  // Sobrecarga manual: se pregunta una sola vez, al empezar
  const pendientesSobrecarga = b.sobrecargaRevisada || b.preparando ? [] : b.ejercicios
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.sugerencia && e.sugerencia.accion !== 'mantener' && !e.sugerencia.aplicada && !e.series.some((x) => x.hecha));
  function cerrarSobrecarga(aplicar: boolean) {
    cambiar((x) => {
      if (aplicar) {
        for (const { i } of pendientesSobrecarga) {
          if (elegidos[i] === false) continue;
          const ex = x.ejercicios[i];
          const sug = ex.sugerencia!;
          const v = valores[i];
          const final = v === undefined ? sug : sug.accion === 'reps' ? { ...sug, reps: v } : { ...sug, peso: v };
          ex.series = aplicarSugerencia(ex.series, final);
          ex.sugerencia = { ...final, aplicada: true };
        }
      }
      x.sobrecargaRevisada = true;
    });
  }
  const hechas = b.ejercicios.flatMap((e) => seriesHechas(e));
  const volumen = hechas.reduce((t, s) => t + s.peso * s.reps, 0);
  const pendientes = b.ejercicios.reduce((t, e) => t + e.series.filter((s) => !s.hecha).length, 0);
  const restante = descanso ? Math.max(0, (descanso.fin - ahora) / 1000) : 0;
  const ms = menuSerie ? b.ejercicios[menuSerie.i]?.series[menuSerie.j] : undefined;

  return (
    <div className="pb-28">
      {b.preparando ? (
        <div className="lg:mx-auto lg:max-w-[760px]" data-testid="armado">
          <header className="sticky top-0 z-30 -mx-[17px] flex items-center gap-2 border-b border-ln2 px-[17px] py-2 backdrop-blur"
            style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}>
            <button aria-label="Minimizar" className="toque -ml-3 flex items-center justify-center oro" onClick={() => nav('/entreno')}>
              <Icono n="abajo" />
            </button>
            <span className="flex-1 font-display text-[17px] font-semibold">{b.rutinaId ? 'Prepará tu rutina' : 'Armá tu entrenamiento'}</span>
          </header>
          <div className="etiqueta oro mt-4">{b.rutinaId ? 'Primera vez con esta rutina' : 'Entrenamiento libre'}</div>
          <input aria-label="Nombre del entrenamiento" value={b.nombre}
            onChange={(e) => { const v = e.target.value; cambiar((x) => { x.nombre = v; }); }}
            className="mt-1 w-full bg-transparent font-display text-[26px] font-semibold outline-none" />
          <p className="text-[14px] text-mu">{b.rutinaId ? 'Cargá el peso y las reps de cada serie. Desde la próxima vez se completan solos con lo que hiciste.' : 'Elegí los ejercicios, las series, el peso y las reps.'} El reloj arranca recién cuando tocás <b className="oro">Empezar</b>.</p>

          <ol className="mt-4 flex flex-col gap-3">
            {b.ejercicios.map((e, i) => (
              <TarjetaEjercicio key={e.ejercicioId + i} i={i} total={b.ejercicios.length} ejercicioId={e.ejercicioId} propios={propios}
                subtitulo={e.objetivo} series={e.series} unidad={u} descanso={textoDescanso(e.descanso ?? DESCANSO_POR_DEFECTO)}
                alSeries={(ss) => cambiar((x) => { x.ejercicios[i].series = ss; })}
                nueva={(ul) => ({ peso: ul?.peso ?? 0, reps: ul?.reps || 10, tipo: 'normal' as const, hecha: false })}
                alDescanso={() => setMenuEj(i)} alMover={(d) => moverEjercicio(i, d)}
                alEliminar={() => cambiar((x) => { x.ejercicios.splice(i, 1); })} />
            ))}
          </ol>
          {!b.ejercicios.length && (
            <div className="tarjeta mt-4 py-8 text-center">
              <Icono n="entreno" size={36} className="oro mx-auto" />
              <h3 className="titulo-tarjeta mt-3">Todavía no agregaste ejercicios</h3>
              <p className="mt-1 text-[14px] text-mu">Buscalos en la biblioteca o creá uno propio.</p>
            </div>
          )}
          <button className="btn-sec mt-4 h-12 w-full" onClick={() => setBiblio(true)}><Icono n="mas" size={18} />Agregar ejercicio</button>
          <button className="btn mt-4 h-14 w-full text-[17px]" disabled={!b.ejercicios.length}
            onClick={() => { cambiar((x) => { x.preparando = false; x.inicio = Date.now(); }); setPos({ i: 0, j: 0 }); window.scrollTo({ top: 0 }); }}>
            <Icono n="play" size={18} />Empezar entrenamiento
          </button>
          <button className="mt-4 w-full p-2 text-[14px] font-semibold text-miss" onClick={() => setDescartar(true)}>Descartar</button>
        </div>
      ) : (<>
      <header className="barra-entreno sticky top-0 z-30 -mx-[17px] flex items-center gap-2 px-[17px] py-2 backdrop-blur"
        style={{ background: 'color-mix(in srgb, var(--bg) 90%, transparent)' }}>
        <button aria-label="Minimizar" title="Minimizar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold2 oro" onClick={() => nav('/entreno')}>
          <Icono n="abajo" size={18} />
        </button>
        {/* Foco | Lista: las dos vistas del mismo entrenamiento */}
        <div role="group" aria-label="Vista" className="flex shrink-0 rounded-full border border-ln2 p-[3px]">
          {([['foco', 'Modo foco', 'Foco', 'play'], ['lista', 'Ver todo', 'Lista', 'rutinas']] as const).map(([v, etiqueta, texto, ic]) => (
            <button key={v} aria-label={etiqueta} aria-pressed={vista === v} onClick={() => vista !== v && cambiarVista(v)}
              className={`flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-semibold transition-colors ${vista === v ? '' : 'text-mu hover:text-tx'}`}
              style={vista === v ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>
              <Icono n={ic} size={13} className="hidden sm:block" />{texto}
            </button>
          ))}
        </div>
        {/* El único reloj del entrenamiento */}
        <span className="num ml-auto flex shrink-0 items-center gap-1 text-[17px] oro" data-testid="reloj-entreno" aria-label="Tiempo de entrenamiento">
          <Icono n="reloj" size={15} />{reloj((ahora - b.inicio) / 1000)}
        </span>
        <button className="btn h-9 shrink-0 px-3.5 text-[14px]" onClick={() => setTerminar(true)}>Terminar</button>
      </header>

      {/* Cabecera de la lista: una sola franja con el avance, el nombre y las cifras */}
      {!(vista === 'foco' && b.ejercicios.length) && (() => {
        const total = b.ejercicios.reduce((t, e) => t + e.series.length, 0) || 1;
        const avance = Math.min(1, hechas.length / total);
        const R = 30, C = 2 * Math.PI * R;
        const conEj = b.ejercicios.filter((e) => e.series.some((x) => x.hecha)).length;
        const cifras: [ReactNode, ReactNode][] = [
          [<>Carga<span className="hidden lg:inline"> levantada</span></>, <>{formatoNumero(redondear(aUnidad(volumen, u), 0))} <span className="text-[14px] text-mu">{u}</span></>],
          ['Series', <>{hechas.length}<span className="text-[14px] text-mu"> / {total}</span></>],
          ['Ejercicios', <>{conEj}<span className="text-[14px] text-mu"> / {b.ejercicios.length}</span></>],
        ];
        return (
          <section className="hero mt-4 flex flex-wrap text-left items-center gap-x-6 gap-y-3 px-4 py-3 lg:flex-nowrap lg:px-6 lg:py-4" data-testid="metricas">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="relative h-[72px] w-[72px] shrink-0" role="img" aria-label={`${hechas.length} de ${total} series hechas`}>
                <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
                  <circle cx="36" cy="36" r={R} fill="none" stroke="var(--ln2)" strokeWidth="4" />
                  <circle cx="36" cy="36" r={R} fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C * (1 - avance)} style={{ transition: 'stroke-dashoffset .5s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="num text-[20px] oro">{hechas.length ? romano(hechas.length) : '0'}</span>
                  <span className="mt-1 text-[9px] uppercase tracking-[.12em] text-mu">de {romano(total)}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="etiqueta">Entrenamiento en curso</div>
                <input aria-label="Nombre del entrenamiento" value={b.nombre}
                  onChange={(e) => { const v = e.target.value; cambiar((x) => { x.nombre = v; }); }}
                  className="w-full truncate border-b border-transparent bg-transparent font-display text-[24px] font-semibold leading-tight outline-none hover:border-ln2 focus:border-gold lg:text-[30px]" />
              </div>
            </div>
            <dl className="grid w-full grid-cols-3 border-t border-ln2 pt-3 lg:flex lg:w-auto lg:shrink-0 lg:border-t-0 lg:pt-0">
              {cifras.map(([t, v], k) => (
                <div key={k} className={`min-w-0 px-2 first:pl-0 lg:px-6 lg:first:pl-6 ${k ? 'border-l border-ln2' : 'lg:border-l lg:border-ln2'}`}>
                  <dt className="etiqueta truncate">{t}</dt>
                  <dd className="num mt-1 text-[22px] leading-none oro lg:text-[26px]">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })()}

      {b.ejercicios.length === 0 && (
        <div className="tarjeta mt-4 py-8 text-center">
          <Icono n="entreno" size={36} className="oro mx-auto" />
          <h3 className="titulo-tarjeta mt-3">Empezá agregando un ejercicio</h3>
          <p className="mt-1 text-[14px] text-mu">Buscá en la biblioteca o creá uno propio.</p>
        </div>
      )}

      {vista === 'foco' && posActual && b.ejercicios.length > 0 && (
        <Foco b={b} pos={posActual} setPos={setPos} estados={estados} propios={propios} u={u} ahora={ahora}
          orden={<OrdenEntreno b={b} propios={propios} actual={posActual.i} className="h-full overflow-y-auto"
            alElegir={(i) => { const j = b.ejercicios[i].series.findIndex((x) => !x.hecha); setPos({ i, j: j < 0 ? 0 : j }); }} />}
          descanso={descanso} setDescanso={setDescanso} marcar={marcar} cambiar={cambiar} />
      )}

      {vista === 'lista' && b.ejercicios.length > 0 && <div className="lg:mt-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <OrdenEntreno b={b} propios={propios} className="sticky top-[64px] hidden lg:block"
        actual={Math.max(0, b.ejercicios.findIndex((e) => e.series.some((x) => !x.hecha)))}
        alElegir={(i) => document.getElementById(`ejercicio-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <ol className="mt-4 flex flex-col gap-4 lg:mt-0">
        {b.ejercicios.map((e, i) => {
          const ej = buscarEjercicio(e.ejercicioId, propios);
          const ant = estados.get(e.ejercicioId)?.ultima?.series ?? [];
          let n = 0;
          return (
            <li key={e.ejercicioId + i} id={`ejercicio-${i}`} className="tarjeta flex scroll-mt-[72px] flex-col px-3 lg:px-5" data-testid="ejercicio">
              <div className="flex items-center gap-3">
                <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold2 text-[13px] oro" data-testid="numero-ejercicio"
                  aria-label={`Ejercicio ${i + 1} de ${b.ejercicios.length}`}>{romano(i + 1)}</span>
                <Miniatura musculo={ej?.musculo} id={e.ejercicioId} tam={48} />
                <button className="flex-1 text-left font-display text-[18px] font-semibold oro leading-tight" onClick={() => setMenuEj(i)}>{ej?.nombre ?? 'Ejercicio'}</button>
                <button className="chip h-8 shrink-0 gap-1 px-2.5 text-[12px]" aria-label={`Entrenar ${ej?.nombre} en modo foco`}
                  onClick={() => { const j = e.series.findIndex((x) => !x.hecha); setPos({ i, j: j < 0 ? 0 : j }); cambiarVista('foco'); window.scrollTo({ top: 0 }); }}>
                  <Icono n="play" size={12} />Foco
                </button>
              </div>
              <div className="lg:mt-2 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
              <div className="min-w-0">
              {e.objetivo && <p className="mt-1 text-[13px] text-mu" data-testid="objetivo">Objetivo: <span className="text-tx2">{e.objetivo}</span></p>}
              <UltimaVez ultima={estados.get(e.ejercicioId)?.ultima} u={u} />
              {e.sugerencia?.aplicada && (
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-mu" data-testid="sugerencia-lista">
                  <Icono n="progreso" size={14} className="oro shrink-0" />Sobrecarga aplicada: {formatoNumero(redondear(aUnidad(e.sugerencia.peso, u)))} {u}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button className="chip h-8 gap-1.5 px-3 text-[13px]" onClick={() => setMenuEj(i)} aria-label={`Descanso de ${ej?.nombre}`}>
                  <Icono n="reloj" size={15} className="oro" />Descanso: {textoDescanso(e.descanso ?? DESCANSO_POR_DEFECTO)}
                </button>
                <button className={`chip h-8 gap-1.5 px-3 text-[13px] ${e.nota || notaAbierta[i] ? 'chip-on' : ''}`} aria-label={`Nota de ${ej?.nombre}`}
                  onClick={() => setNotaAbierta((x) => ({ ...x, [i]: !x[i] }))}>
                  <Icono n="editar" size={14} />Nota
                </button>
              </div>
              {(e.nota || notaAbierta[i]) && (
                <input aria-label={`Notas de ${ej?.nombre}`} placeholder="Agregar notas aquí…" value={e.nota ?? ''} autoFocus={!e.nota}
                  onChange={(ev) => { const v = ev.target.value; cambiar((x) => { x.ejercicios[i].nota = v; }); }}
                  className="mt-2 w-full rounded-[8px] border border-ln2 bg-transparent px-3 py-2 text-[14px] text-tx2 outline-none placeholder:text-mu2 focus:border-gold" />
              )}
              <AccionesEjercicio i={i} total={b.ejercicios.length} nombre={ej?.nombre ?? 'ejercicio'}
                alMover={(d) => moverEjercicio(i, d)} alEliminar={() => setEliminarEj(i)} />
              </div>
              <div className="flex min-w-0 flex-col">

              <div className="mt-3 grid grid-cols-[34px_minmax(0,1fr)_60px_50px_36px_26px] lg:grid-cols-[40px_minmax(0,1fr)_120px_100px_44px_32px] gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-mu2">
                <span className="text-center">Serie</span><span>Anterior</span><span className="text-center">{u}</span><span className="text-center">Reps</span><span className="text-center">✓</span><span />
              </div>
              {e.series.map((s, j) => {
                const tipo = TIPOS.find((t) => t.v === (s.tipo ?? 'normal'))!;
                if (tipo.v !== 'calentamiento') n++;
                const a = anteriorPara(ant, e.series, j);
                return (
                  <div key={j} data-testid="serie"
                    className={`mt-1.5 grid grid-cols-[34px_minmax(0,1fr)_60px_50px_36px_26px] lg:grid-cols-[40px_minmax(0,1fr)_120px_100px_44px_32px] items-center gap-1.5 rounded-[8px] px-0.5 py-1 transition-colors ${s.hecha ? 'serie-hecha' : ''}`}>
                    <button aria-label={`Tipo de la serie ${j + 1}`} onClick={() => setMenuSerie({ i, j })}
                      className="h-9 rounded-[8px] text-center num text-[15px] font-bold" style={{ color: tipo.c }}>
                      {tipo.l || n}
                    </button>
                    <button className="truncate text-left text-[13px] text-mu" aria-label={`Copiar serie anterior ${j + 1}`}
                      onClick={() => a && cambiar((x) => { x.ejercicios[i].series[j].peso = a.peso; x.ejercicios[i].series[j].reps = a.reps; })}>
                      {a ? `${formatoNumero(redondear(aUnidad(a.peso, u)))} ${u} × ${a.reps}` : '—'}
                    </button>
                    <input aria-label={`Peso serie ${j + 1}`} type="number" inputMode="decimal" step="0.5" min={0}
                      className="h-9 w-full rounded-[8px] border border-ln2 bg-transparent text-center num text-[15px] outline-none focus:border-gold"
                      value={s.peso ? redondear(aUnidad(s.peso, u)) : ''} placeholder={a ? String(redondear(aUnidad(a.peso, u))) : '0'}
                      onChange={(ev) => { const v = aKg(Number(ev.target.value) || 0, u); cambiar((x) => { x.ejercicios[i].series[j].peso = v; }); }} />
                    <input aria-label={`Repeticiones serie ${j + 1}`} type="number" inputMode="numeric" min={0}
                      className="h-9 w-full rounded-[8px] border border-ln2 bg-transparent text-center num text-[15px] outline-none focus:border-gold"
                      value={s.reps || ''} placeholder={a ? String(a.reps) : '0'}
                      onChange={(ev) => { const v = Math.max(0, Math.round(Number(ev.target.value) || 0)); cambiar((x) => { x.ejercicios[i].series[j].reps = v; }); }} />
                    <button aria-label={s.hecha ? `Desmarcar serie ${j + 1}` : `Marcar serie ${j + 1} como hecha`} aria-pressed={s.hecha}
                      onClick={() => marcar(i, j)}
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-[8px] border ${s.hecha ? 'rebote' : 'border-ln3 text-mu'}`}
                      style={s.hecha ? { background: 'var(--verde)', borderColor: 'var(--verde)', color: '#0b0a08' } : undefined}>
                      <Icono n="check" size={17} />
                    </button>
                    <button aria-label={`Eliminar serie ${j + 1} de ${ej?.nombre}`} title="Eliminar serie"
                      onClick={() => cambiar((x) => { x.ejercicios[i].series.splice(j, 1); })}
                      className="mx-auto flex h-8 w-6 items-center justify-center rounded-[6px] text-mu2 hover:text-miss">
                      <Icono n="basura" size={15} />
                    </button>
                  </div>
                );
              })}
              <div className="flex-1" />
              <button className="btn-sec mt-3 h-10 w-full text-[14px]"
                onClick={() => cambiar((x) => {
                  const ss = x.ejercicios[i].series;
                  const ul = ss[ss.length - 1];
                  ss.push({ peso: ul?.peso ?? 0, reps: ul?.reps ?? 10, tipo: 'normal', hecha: false });
                })}>
                <Icono n="mas" size={16} />Agregar serie
              </button>
              </div>
              </div>
            </li>
          );
        })}
      </ol>
      </div>}

      <div className="lg:mx-auto lg:mt-2 lg:flex lg:max-w-[640px] lg:items-center lg:gap-4">
        <button className={`${vista === 'foco' && b.ejercicios.length ? 'btn-sec h-11' : 'btn'} mt-5 w-full lg:flex-1`} onClick={() => setBiblio(true)}><Icono n="mas" size={18} />Agregar ejercicio</button>
        <button className="mt-4 w-full p-2 text-[14px] font-semibold text-miss lg:mt-5 lg:w-auto" onClick={() => setDescartar(true)}>Descartar entrenamiento</button>
      </div>

      {descanso && vista === 'lista' && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:pl-[248px]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-[480px] px-3 pb-3">
            <div role="timer" aria-label="Descanso" className="entrar overflow-hidden rounded-[14px] border border-gold2 bg-sf" style={{ boxShadow: 'var(--sombra)' }}>
              <div className="h-1 bg-ln2"><div className="h-full" style={{ width: `${(restante / descanso.total) * 100}%`, background: 'var(--oro-grad)' }} /></div>
              <div className="flex items-center gap-2 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="etiqueta truncate">{restante > 0 ? 'Descanso' : '¡A la siguiente serie!'}</div>
                  <div className="num oro mt-0.5 text-[30px] leading-none">{reloj(restante)}</div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button className="chip px-2.5" onClick={() => setDescanso((d) => d && { ...d, fin: Math.max(Date.now(), d.fin - 15_000) })}>−15</button>
                  <button className="chip px-2.5" onClick={() => setDescanso((d) => d && { fin: d.fin + 15_000, total: d.total + 15 })}>+15</button>
                  <button className="chip chip-on px-3" onClick={() => setDescanso(null)}>Saltar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </>)}

      <Biblioteca abierta={biblio} alCerrar={() => setBiblio(false)} propios={propios}
        elegidos={b.ejercicios.map((e) => e.ejercicioId)} alElegir={agregarEjercicio}
        alCrear={async (e) => { await repo.guardarPropio(usuario.uid, e); setPropios((p) => [...p, e]); }} />

      <Hoja abierta={!!menuSerie && !!ms} alCerrar={() => setMenuSerie(null)} etiqueta="Serie" titulo="Tipo de serie">
        {menuSerie && ms && (
          <div className="flex flex-col gap-2">
            {TIPOS.map((t) => (
              <button key={t.v} className={`fila w-full text-left ${ (ms.tipo ?? 'normal') === t.v ? 'oro font-semibold' : ''}`}
                onClick={() => { cambiar((x) => { x.ejercicios[menuSerie.i].series[menuSerie.j].tipo = t.v; }); setMenuSerie(null); }}>
                <span className="num w-6 text-center font-bold" style={{ color: t.c }}>{t.l || '1'}</span>{t.t}
              </button>
            ))}
            <div className="etiqueta mt-3">Sensación</div>
            <div className="flex gap-2" role="radiogroup" aria-label="Sensación">
              {SENSACIONES.map((o) => (
                <button key={o.v} role="radio" aria-checked={ms.sensacion === o.v} className={`chip flex-1 ${ms.sensacion === o.v ? 'chip-on' : ''}`}
                  onClick={() => cambiar((x) => { x.ejercicios[menuSerie.i].series[menuSerie.j].sensacion = o.v; })}>{o.t}</button>
              ))}
            </div>
            <button className="mt-4 p-2 font-semibold text-miss"
              onClick={() => { cambiar((x) => { x.ejercicios[menuSerie.i].series.splice(menuSerie.j, 1); }); setMenuSerie(null); }}>
              Eliminar serie
            </button>
          </div>
        )}
      </Hoja>

      <Hoja abierta={menuEj !== null} alCerrar={() => setMenuEj(null)} etiqueta="Ejercicio"
        titulo={menuEj !== null ? buscarEjercicio(b.ejercicios[menuEj]?.ejercicioId ?? '', propios)?.nombre ?? '' : ''}>
        {menuEj !== null && b.ejercicios[menuEj] && (
          <div>
            <Animacion id={b.ejercicios[menuEj].ejercicioId} nombre={buscarEjercicio(b.ejercicios[menuEj].ejercicioId, propios)?.nombre}
              className="mb-4 aspect-[3/2] w-full rounded-[12px] border border-ln" />
            <div className="etiqueta">Descanso entre series</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {DESCANSOS.map((d) => (
                <button key={d} className={`chip ${(b.ejercicios[menuEj].descanso ?? DESCANSO_POR_DEFECTO) === d ? 'chip-on' : ''}`}
                  onClick={() => cambiar((x) => { x.ejercicios[menuEj].descanso = d; })}>{textoDescanso(d)}</button>
              ))}
            </div>
            <div className="mt-5 flex flex-col">
              <button className="fila text-left" disabled={menuEj === 0}
                onClick={() => { cambiar((x) => { const l = x.ejercicios; [l[menuEj - 1], l[menuEj]] = [l[menuEj], l[menuEj - 1]]; }); setMenuEj(null); }}>
                <Icono n="arriba" className="oro" />Subir
              </button>
              <button className="fila text-left" disabled={menuEj === b.ejercicios.length - 1}
                onClick={() => { cambiar((x) => { const l = x.ejercicios; [l[menuEj + 1], l[menuEj]] = [l[menuEj], l[menuEj + 1]]; }); setMenuEj(null); }}>
                <Icono n="abajo" className="oro" />Bajar
              </button>
              <button className="fila text-left text-miss border-0"
                onClick={() => { cambiar((x) => { x.ejercicios.splice(menuEj, 1); }); setMenuEj(null); }}>
                <Icono n="basura" />Quitar ejercicio
              </button>
            </div>
          </div>
        )}
      </Hoja>

      <Hoja abierta={!!pendientesSobrecarga.length} alCerrar={() => cerrarSobrecarga(false)} etiqueta="Antes de empezar" titulo="Sobrecarga progresiva">
        <p className="text-[14px] text-mu">La vez pasada cumpliste todas las repeticiones en estos ejercicios. Elegí en cuáles subir hoy y cuánto (con − y +):</p>
        <ul className="mt-3 flex flex-col gap-2" data-testid="hoja-sobrecarga">
          {pendientesSobrecarga.map(({ e, i }) => {
            const ej = buscarEjercicio(e.ejercicioId, propios);
            const sug = e.sugerencia!;
            const desde = estados.get(e.ejercicioId)?.ultima?.series.find((x) => !x.tipo)?.peso ?? 0;
            const on = elegidos[i] ?? true;
            const porReps = sug.accion === 'reps';
            const valor = valores[i] ?? (porReps ? sug.reps : sug.peso);
            const paso = porReps ? 1 : u === 'kg' ? 1.25 : aKg(2.5, 'lb');
            const mostrado = porReps ? valor : redondear(aUnidad(valor, u), 2);
            const dif = porReps ? valor - (sug.reps - 1) : aUnidad(valor - desde, u);
            const cambiarValor = (d: number) => setValores((x) => ({ ...x, [i]: Math.max(porReps ? 1 : 0, redondear(valor + d * paso, 3)) }));
            const btn = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ln3 text-[18px] oro disabled:opacity-30';
            return (
              <li key={i} className={`tarjeta flex items-center gap-3 px-3 py-2.5 ${on ? 'border-gold' : 'opacity-70'}`}>
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-[#e6b84e]" checked={on} aria-label={`Subir ${ej?.nombre}`}
                  onChange={(ev) => setElegidos((x) => ({ ...x, [i]: ev.target.checked }))} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{ej?.nombre}</span>
                  <span className="text-[12px] text-mu">
                    {porReps ? `Antes ${sug.reps - 1} reps` : `Antes ${formatoNumero(redondear(aUnidad(desde, u), 2))} ${u}`}
                    {' · '}<span className={dif > 0 ? 'oro' : dif < 0 ? 'text-miss' : ''}>{dif > 0 ? '+' : ''}{formatoNumero(redondear(dif, 2))} {porReps ? 'reps' : u}</span>
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-1" aria-label={`Nuevo valor de ${ej?.nombre}`}>
                  <button className={btn} disabled={!on} aria-label={`Bajar ${ej?.nombre}`} onClick={() => cambiarValor(-1)}>−</button>
                  <span className="w-[62px] text-center leading-tight" data-testid={`sobrecarga-valor-${e.ejercicioId}`}>
                    <b className="num block text-[19px] oro">{formatoNumero(mostrado)}</b>
                    <span className="text-[11px] text-mu">{porReps ? 'reps' : u}</span>
                  </span>
                  <button className={btn} disabled={!on} aria-label={`Subir más ${ej?.nombre}`} onClick={() => cambiarValor(1)}>+</button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" onClick={() => cerrarSobrecarga(true)}>Aplicar y empezar</button>
          <button className="btn-sec" onClick={() => cerrarSobrecarga(false)}>Empezar sin cambios</button>
        </div>
      </Hoja>

      <Hoja abierta={eliminarEj !== null} alCerrar={() => setEliminarEj(null)} etiqueta="Eliminar"
        titulo={eliminarEj !== null ? `¿Quitar ${buscarEjercicio(b.ejercicios[eliminarEj]?.ejercicioId ?? '', propios)?.nombre ?? 'este ejercicio'}?` : ''}>
        <p className="text-mu">Se quitan sus series de este entrenamiento. Tu rutina guardada no cambia.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" style={{ background: 'var(--miss)', borderColor: 'var(--miss)', color: '#fff' }}
            onClick={() => { const i = eliminarEj!; cambiar((x) => { x.ejercicios.splice(i, 1); }); setEliminarEj(null); setPos(null); }}>Sí, quitar</button>
          <button className="btn-sec" onClick={() => setEliminarEj(null)}>Cancelar</button>
        </div>
      </Hoja>

      <Hoja abierta={terminar} alCerrar={() => setTerminar(false)} etiqueta="Terminar" titulo="Guardar entrenamiento">
        <input className="campo" aria-label="Título" value={b.nombre} onChange={(e) => { const v = e.target.value; cambiar((x) => { x.nombre = v; }); }} />
        <textarea className="campo mt-3 h-24 py-2" placeholder="¿Cómo te fue? (opcional)" aria-label="Descripción"
          value={b.nota ?? ''} onChange={(e) => { const v = e.target.value; cambiar((x) => { x.nota = v; }); }} />
        <div className="mt-3 grid grid-cols-3 text-center">
          <div><div className="etiqueta">Duración</div><div className="num mt-1">{reloj((ahora - b.inicio) / 1000)}</div></div>
          <div><div className="etiqueta">Volumen</div><div className="num mt-1">{formatoNumero(redondear(aUnidad(volumen, u), 0))} {u}</div></div>
          <div><div className="etiqueta">Series</div><div className="num mt-1">{hechas.length}</div></div>
        </div>
        {pendientes > 0 && <p className="mt-3 text-[13px] text-mu">Hay {pendientes} {pendientes === 1 ? 'serie sin marcar' : 'series sin marcar'}: no se guardan.</p>}
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" onClick={finalizar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar y terminar'}</button>
          <button className="btn-sec" onClick={() => setTerminar(false)}>Seguir entrenando</button>
        </div>
      </Hoja>

      <Hoja abierta={descartar} alCerrar={() => setDescartar(false)} etiqueta="Descartar" titulo="¿Descartar este entrenamiento?">
        <p className="text-mu">Se pierden las series de esta sesión.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" style={{ background: 'var(--miss)', borderColor: 'var(--miss)', color: '#fff' }}
            onClick={() => { borrarBorrador(usuario.uid); nav('/entreno', { replace: true }); }}>Sí, descartar</button>
          <button className="btn-sec" onClick={() => setDescartar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
