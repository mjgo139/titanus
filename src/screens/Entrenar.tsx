import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { borrarBorrador, guardarBorrador, leerBorrador, type Borrador } from '../lib/borrador';
import { cerrarEntrenamiento, iniciarDesdeRutina } from '../lib/entreno';
import { aKg, aUnidad, formatoPeso, redondear, reloj } from '../lib/logica';
import { avisoFinDescanso, prepararAudio } from '../lib/sonido';
import type { Ejercicio, EstadoEjercicio, Rutina, Sensacion } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Hoja } from '../ui/piezas';

const SENSACIONES: { v: Sensacion; t: string }[] = [
  { v: 2, t: 'Fácil' }, { v: 3, t: 'Justa' }, { v: 5, t: 'Al límite' },
];

export default function Entrenar() {
  const { rutinaId = '' } = useParams();
  const { repo, usuario, perfil, cambiarPerfil, aviso } = useSesion();
  const nav = useNavigate();
  const [b, setB] = useState<Borrador | null>(null);
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [estados, setEstados] = useState<Map<string, EstadoEjercicio>>(new Map());
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [descanso, setDescanso] = useState<{ fin: number; total: number } | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const [terminar, setTerminar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const sonó = useRef(false);
  const u = perfil.unidad;

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [rs, ps] = await Promise.all([repo.leerRutinas(usuario.uid), repo.leerPropios(usuario.uid)]);
      if (!vivo) return;
      setPropios(ps);
      const previo = leerBorrador(usuario.uid);
      const r = rs.find((x) => x.id === (rutinaId === 'continuar' ? previo?.rutinaId : rutinaId)) ?? null;
      setRutina(r);
      const ids = (previo?.ejercicios.map((e) => e.ejercicioId) ?? r?.ejercicios.map((e) => e.ejercicioId) ?? []);
      const est = await repo.leerEstados(usuario.uid, ids);
      if (!vivo) return;
      setEstados(est);
      if (previo) setB(previo);
      else if (r) {
        const n = iniciarDesdeRutina(r, est);
        guardarBorrador(usuario.uid, n);
        setB(n);
      } else nav('/rutinas', { replace: true });
    })();
    return () => { vivo = false; };
  }, [repo, usuario.uid, rutinaId, nav]);

  // Reloj del entrenamiento y del descanso
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (descanso && ahora >= descanso.fin && !sonó.current) {
      sonó.current = true;
      avisoFinDescanso();
      setTimeout(() => setDescanso(null), 1200);
    }
  }, [ahora, descanso]);

  const cambiar = useCallback((f: (x: Borrador) => Borrador) => {
    setB((x) => {
      if (!x) return x;
      const n = f(structuredClone(x));
      guardarBorrador(usuario.uid, n);
      return n;
    });
  }, [usuario.uid]);

  if (!b) return <Cargando />;

  const descansoDe = (ejId: string) => rutina?.ejercicios.find((e) => e.ejercicioId === ejId)?.descanso ?? 90;

  function marcar(i: number, j: number) {
    prepararAudio();
    const hecha = !b!.ejercicios[i].series[j].hecha;
    cambiar((x) => {
      const s = x.ejercicios[i].series[j];
      s.hecha = hecha;
      if (s.hecha && !s.sensacion) s.sensacion = 3;
      return x;
    });
    if (hecha) {
      const seg = descansoDe(b!.ejercicios[i].ejercicioId);
      sonó.current = false;
      setDescanso({ fin: Date.now() + seg * 1000, total: seg });
    }
  }

  async function finalizar() {
    if (!b) return;
    setGuardando(true);
    const c = cerrarEntrenamiento(b, estados, perfil.resumen);
    if (!c.entreno.ejercicios.length) {
      setGuardando(false);
      aviso('Marcá al menos una serie como hecha');
      setTerminar(false);
      return;
    }
    await repo.guardarEntrenamiento(usuario.uid, c.entreno, c.estados, c.resumen);
    await cambiarPerfil({ resumen: c.resumen });
    borrarBorrador(usuario.uid);
    nav('/resumen', { replace: true, state: { entreno: c.entreno } });
  }

  function descartar() {
    borrarBorrador(usuario.uid);
    nav('/', { replace: true });
  }

  const hechas = b.ejercicios.reduce((t, e) => t + e.series.filter((s) => s.hecha).length, 0);
  const totales = b.ejercicios.reduce((t, e) => t + e.series.length, 0);
  const restante = descanso ? Math.max(0, (descanso.fin - ahora) / 1000) : 0;

  return (
    <div className="pb-24">
      <header className="pt-6 pb-4 flex items-start justify-between">
        <div>
          <div className="etiqueta text-gold">En curso · {reloj((ahora - b.inicio) / 1000)}</div>
          <h1 className="titulo mt-2">{b.nombre}</h1>
          <p className="mt-2 text-mu font-medium">{hechas} de {totales} series hechas</p>
        </div>
        <button aria-label="Salir" className="toque flex items-center justify-center text-mu -mr-2" onClick={() => nav('/')}>
          <Icono n="cerrar" />
        </button>
      </header>

      <div className="h-1 rounded-full bg-ln2 overflow-hidden" aria-hidden>
        <div className="h-full bg-gold transition-all" style={{ width: `${totales ? (hechas / totales) * 100 : 0}%` }} />
      </div>

      <ol className="mt-5 flex flex-col gap-4">
        {b.ejercicios.map((e, i) => {
          const ej = buscarEjercicio(e.ejercicioId, propios);
          const ult = estados.get(e.ejercicioId)?.ultima;
          return (
            <li key={e.ejercicioId} className="tarjeta" data-testid="ejercicio">
              <div className="etiqueta">{ej?.musculo ?? 'Ejercicio'}</div>
              <h2 className="titulo-tarjeta mt-1">{ej?.nombre ?? 'Ejercicio'}</h2>
              <p className="mt-1 text-[13px] text-mu">
                {ult ? <>La última vez: {ult.series.map((s) => `${redondear(aUnidad(s.peso, u))}×${s.reps}`).join(' · ')} {u}</> : 'Primera vez: elegí un peso cómodo.'}
              </p>

              <div className="mt-3 grid grid-cols-[28px_1fr_1fr_48px] gap-2 text-[11px] font-bold uppercase tracking-[.1em] text-mu2">
                <span>#</span><span>Peso ({u})</span><span>Reps</span><span />
              </div>
              {e.series.map((s, j) => (
                <div key={j} className={`mt-2 grid grid-cols-[28px_1fr_1fr_48px] gap-2 items-center ${s.hecha ? 'opacity-90' : ''}`}>
                  <span className="num text-mu">{j + 1}</span>
                  <input aria-label={`Peso serie ${j + 1}`} className={`campo h-11 text-center num ${s.hecha ? 'bg-okbg border-ok/40' : ''}`}
                    type="number" inputMode="decimal" step="0.5" min={0}
                    value={s.peso ? redondear(aUnidad(s.peso, u)) : ''} placeholder="0"
                    onChange={(ev) => cambiar((x) => { x.ejercicios[i].series[j].peso = aKg(Number(ev.target.value) || 0, u); return x; })} />
                  <input aria-label={`Repeticiones serie ${j + 1}`} className={`campo h-11 text-center num ${s.hecha ? 'bg-okbg border-ok/40' : ''}`}
                    type="number" inputMode="numeric" min={0}
                    value={s.reps || ''} placeholder="0"
                    onChange={(ev) => cambiar((x) => { x.ejercicios[i].series[j].reps = Math.max(0, Math.round(Number(ev.target.value) || 0)); return x; })} />
                  <button aria-label={s.hecha ? `Desmarcar serie ${j + 1}` : `Marcar serie ${j + 1} como hecha`} aria-pressed={s.hecha}
                    onClick={() => marcar(i, j)}
                    className={`h-11 w-12 rounded-xl border flex items-center justify-center transition-colors ${s.hecha ? 'bg-ok border-ok text-on rebote' : 'border-ln3 text-mu'}`}>
                    <Icono n="check" size={20} />
                  </button>
                  {s.hecha && (
                    <div className="col-span-4 flex gap-2 pl-[36px]" role="radiogroup" aria-label="Sensación">
                      {SENSACIONES.map((o) => (
                        <button key={o.v} role="radio" aria-checked={s.sensacion === o.v}
                          onClick={() => cambiar((x) => { x.ejercicios[i].series[j].sensacion = o.v; return x; })}
                          className={`chip h-7 text-[12px] ${s.sensacion === o.v ? 'chip-on' : ''}`}>{o.t}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button className="mt-3 text-[13px] font-bold uppercase tracking-[.1em] text-gold"
                onClick={() => cambiar((x) => {
                  const ss = x.ejercicios[i].series;
                  const ul = ss[ss.length - 1];
                  ss.push({ peso: ul?.peso ?? 0, reps: ul?.reps ?? 10, hecha: false });
                  return x;
                })}>
                + Agregar serie
              </button>
            </li>
          );
        })}
      </ol>

      <button className="btn w-full mt-6" onClick={() => setTerminar(true)}>Terminar entrenamiento</button>

      {descanso && (
        <div className="fixed inset-x-0 bottom-0 z-40 lg:pl-[248px]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-[480px] px-4 pb-4">
            <div role="timer" aria-label="Descanso" className="entrar rounded-2xl border border-ln bg-sf px-5 py-3 flex items-center gap-4" style={{ boxShadow: 'var(--sombra)' }}>
              <Icono n="reloj" className="text-gold" />
              <div className="flex-1">
                <div className="etiqueta">{restante > 0 ? 'Descanso' : 'A la siguiente serie'}</div>
                <div className="num text-[28px] leading-none mt-1">{reloj(restante)}</div>
              </div>
              <button className="chip" onClick={() => setDescanso((d) => d && { ...d, fin: d.fin + 15_000 })}>+15 s</button>
              <button className="chip" onClick={() => setDescanso(null)}>Saltar</button>
            </div>
          </div>
        </div>
      )}

      <Hoja abierta={terminar} alCerrar={() => setTerminar(false)} etiqueta="Terminar" titulo="¿Terminaste por hoy?">
        <p className="text-mu">Hiciste {hechas} de {totales} series. Solo se guardan las series marcadas.</p>
        <p className="mt-1 text-mu">Volumen: {formatoPeso(b.ejercicios.reduce((t, e) => t + e.series.filter((s) => s.hecha).reduce((a, s) => a + s.peso * s.reps, 0), 0), u, 0)}</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" onClick={finalizar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar y terminar'}</button>
          <button className="btn-sec" onClick={() => setTerminar(false)}>Seguir entrenando</button>
          <button className="text-[13px] font-semibold text-miss mt-2" onClick={descartar}>Descartar este entrenamiento</button>
        </div>
      </Hoja>
    </div>
  );
}
