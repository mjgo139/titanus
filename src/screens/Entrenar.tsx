import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { borrarBorrador, guardarBorrador, leerBorrador, type Borrador } from '../lib/borrador';
import { DESCANSO_POR_DEFECTO, anteriorPara, cerrarEntrenamiento, ejercicioNuevo } from '../lib/entreno';
import { aKg, aUnidad, formatoNumero, redondear, reloj, seriesHechas } from '../lib/logica';
import { avisoFinDescanso, prepararAudio } from '../lib/sonido';
import type { Ejercicio, EstadoEjercicio, Sensacion, TipoSerie } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Hoja } from '../ui/piezas';
import { Biblioteca } from './Biblioteca';
import { Animacion, Miniatura } from './Miniatura';

const TIPOS: { v: TipoSerie; t: string; l: string; c: string }[] = [
  { v: 'calentamiento', t: 'Calentamiento', l: 'C', c: '#e0b04a' },
  { v: 'normal', t: 'Normal', l: '', c: 'var(--tx)' },
  { v: 'fallo', t: 'Al fallo', l: 'F', c: '#d9826f' },
  { v: 'drop', t: 'Drop set', l: 'D', c: '#8fb3d9' },
];
const SENSACIONES: { v: Sensacion; t: string }[] = [{ v: 2, t: 'Fácil' }, { v: 3, t: 'Justa' }, { v: 5, t: 'Al límite' }];
const DESCANSOS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

export function textoDescanso(s: number) {
  if (!s) return 'Apagado';
  const m = Math.floor(s / 60), r = s % 60;
  return m ? `${m} min${r ? ` ${r} s` : ''}` : `${r} s`;
}

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
  const u = perfil.unidad;

  useEffect(() => {
    const previo = leerBorrador(usuario.uid);
    if (!previo) { nav('/entreno', { replace: true }); return; }
    setB(previo);
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

  if (!b) return <Cargando />;

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
    await cambiarPerfil({ resumen: c.resumen });
    borrarBorrador(usuario.uid);
    nav('/resumen', { replace: true, state: { entreno: c.entreno } });
  }

  const hechas = b.ejercicios.flatMap((e) => seriesHechas(e));
  const volumen = hechas.reduce((t, s) => t + s.peso * s.reps, 0);
  const pendientes = b.ejercicios.reduce((t, e) => t + e.series.filter((s) => !s.hecha).length, 0);
  const restante = descanso ? Math.max(0, (descanso.fin - ahora) / 1000) : 0;
  const ms = menuSerie ? b.ejercicios[menuSerie.i]?.series[menuSerie.j] : undefined;

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 -mx-[17px] flex items-center gap-2 border-b border-ln2 px-[17px] py-2 backdrop-blur"
        style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}>
        <button aria-label="Minimizar" className="toque -ml-3 flex items-center justify-center oro" onClick={() => nav('/entreno')}>
          <Icono n="abajo" />
        </button>
        <span className="flex-1 font-display text-[17px] font-semibold">Entrenamiento</span>
        <span className="flex items-center gap-1 text-[13px] text-mu"><Icono n="reloj" size={16} />{reloj((ahora - b.inicio) / 1000)}</span>
        <button className="btn h-9 px-4 text-[14px]" onClick={() => setTerminar(true)}>Terminar</button>
      </header>

      <div className="lg:mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-6">
      <input aria-label="Nombre del entrenamiento" value={b.nombre}
        onChange={(e) => { const v = e.target.value; cambiar((x) => { x.nombre = v; }); }}
        className="mt-4 w-full bg-transparent font-display text-[26px] font-semibold outline-none lg:mt-0 lg:text-[32px]" />

      <div className="tarjeta mt-3 grid grid-cols-3 py-3 text-center lg:mt-0" data-testid="metricas">
        <div><div className="etiqueta">Duración</div><div className="num oro mt-1 text-[18px]">{reloj((ahora - b.inicio) / 1000)}</div></div>
        <div><div className="etiqueta">Volumen</div><div className="num mt-1 text-[18px]">{formatoNumero(redondear(aUnidad(volumen, u), 0))} {u}</div></div>
        <div><div className="etiqueta">Series</div><div className="num mt-1 text-[18px]">{hechas.length}</div></div>
      </div>
      </div>

      {b.ejercicios.length === 0 && (
        <div className="tarjeta mt-4 py-8 text-center">
          <Icono n="entreno" size={36} className="oro mx-auto" />
          <h3 className="titulo-tarjeta mt-3">Empezá agregando un ejercicio</h3>
          <p className="mt-1 text-[14px] text-mu">Buscá en la biblioteca o creá uno propio.</p>
        </div>
      )}

      <ol className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-stretch">
        {b.ejercicios.map((e, i) => {
          const ej = buscarEjercicio(e.ejercicioId, propios);
          const ant = estados.get(e.ejercicioId)?.ultima?.series ?? [];
          let n = 0;
          return (
            <li key={e.ejercicioId + i} className="tarjeta flex flex-col px-3 lg:px-4" data-testid="ejercicio">
              <div className="flex items-center gap-3">
                <Miniatura musculo={ej?.musculo} id={e.ejercicioId} tam={48} />
                <button className="flex-1 text-left font-display text-[18px] font-semibold oro leading-tight" onClick={() => setMenuEj(i)}>{ej?.nombre ?? 'Ejercicio'}</button>
                <button aria-label={`Opciones de ${ej?.nombre}`} className="toque -mr-2 flex items-center justify-center text-mu" onClick={() => setMenuEj(i)}>
                  <Icono n="puntos" />
                </button>
              </div>
              {e.objetivo && <p className="mt-1 text-[13px] text-mu" data-testid="objetivo">Objetivo: <span className="text-tx2">{e.objetivo}</span></p>}
              <UltimaVez ultima={estados.get(e.ejercicioId)?.ultima} u={u} />
              <input aria-label={`Notas de ${ej?.nombre}`} placeholder="Agregar notas aquí…" value={e.nota ?? ''}
                onChange={(ev) => { const v = ev.target.value; cambiar((x) => { x.ejercicios[i].nota = v; }); }}
                className="mt-2 w-full bg-transparent text-[14px] text-tx2 outline-none placeholder:text-mu2" />
              <button className="mt-1 flex items-center gap-1 text-[13px] font-semibold oro" onClick={() => setMenuEj(i)}>
                <Icono n="reloj" size={15} />Descanso: {textoDescanso(e.descanso ?? DESCANSO_POR_DEFECTO)}
              </button>

              <div className="mt-3 grid grid-cols-[38px_minmax(0,1fr)_64px_56px_40px] lg:grid-cols-[40px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_44px] gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-mu2">
                <span className="text-center">Serie</span><span>Anterior</span><span className="text-center">{u}</span><span className="text-center">Reps</span><span className="text-center">✓</span>
              </div>
              {e.series.map((s, j) => {
                const tipo = TIPOS.find((t) => t.v === (s.tipo ?? 'normal'))!;
                if (tipo.v !== 'calentamiento') n++;
                const a = anteriorPara(ant, e.series, j);
                return (
                  <div key={j} data-testid="serie"
                    className={`mt-1.5 grid grid-cols-[38px_minmax(0,1fr)_64px_56px_40px] lg:grid-cols-[40px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-1.5 rounded-[8px] px-0.5 py-1 ${s.hecha ? 'bg-okbg' : ''}`}>
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
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-[8px] border ${s.hecha ? 'border-goldh rebote' : 'border-ln3 text-mu'}`}
                      style={s.hecha ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>
                      <Icono n="check" size={17} />
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
            </li>
          );
        })}
      </ol>

      <div className="lg:mx-auto lg:mt-2 lg:flex lg:max-w-[640px] lg:items-center lg:gap-4">
        <button className="btn mt-5 w-full lg:flex-1" onClick={() => setBiblio(true)}><Icono n="mas" size={18} />Agregar ejercicio</button>
        <button className="mt-4 w-full p-2 text-[14px] font-semibold text-miss lg:mt-5 lg:w-auto" onClick={() => setDescartar(true)}>Descartar entrenamiento</button>
      </div>

      {descanso && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:pl-[248px]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-[480px] px-3 pb-3">
            <div role="timer" aria-label="Descanso" className="entrar overflow-hidden rounded-[14px] border border-gold2 bg-sf" style={{ boxShadow: 'var(--sombra)' }}>
              <div className="h-1 bg-ln2"><div className="h-full" style={{ width: `${(restante / descanso.total) * 100}%`, background: 'var(--oro-grad)' }} /></div>
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex-1">
                  <div className="etiqueta">{restante > 0 ? 'Descanso' : '¡A la siguiente serie!'}</div>
                  <div className="num oro mt-0.5 text-[30px] leading-none">{reloj(restante)}</div>
                </div>
                <button className="chip" onClick={() => setDescanso((d) => d && { ...d, fin: Math.max(Date.now(), d.fin - 15_000) })}>−15</button>
                <button className="chip" onClick={() => setDescanso((d) => d && { fin: d.fin + 15_000, total: d.total + 15 })}>+15</button>
                <button className="chip chip-on" onClick={() => setDescanso(null)}>Saltar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
