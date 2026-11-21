import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { NOMBRES_DIA, aUnidad, formatoNumero, formatoPeso, redondear, seriesHechas } from '../lib/logica';
import { filasDeRutina, textoObjetivo } from '../lib/plantillas';
import type { Ejercicio, Entrenamiento, EstadoEjercicio, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, GraficoBarras, Selector } from '../ui/piezas';
import { useEmpezar } from './empezar';
import { minutosEstimados } from './Hoy';
import { Miniatura } from './Miniatura';

type Medida = 'volumen' | 'reps' | 'duracion';

/**
 * Ficha de una rutina (como en Hevy, con la estética de StoaGym): quién la creó, "Comenzar rutina",
 * cómo viene cada sesión (volumen, repeticiones o duración) y sus ejercicios serie por serie.
 * Lee solo las últimas 12 sesiones de esta rutina (índice rutinaId + inicio).
 */
export default function VerRutina() {
  const { id = '' } = useParams();
  const { repo, usuario, perfil } = useSesion();
  const empezar = useEmpezar();
  const [r, setR] = useState<Rutina | null | undefined>();
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [sesiones, setSesiones] = useState<Entrenamiento[] | null>(null);
  const [estados, setEstados] = useState<Map<string, EstadoEjercicio>>(new Map());
  const [medida, setMedida] = useState<Medida>('volumen');
  const u = perfil.unidad;

  useEffect(() => {
    (async () => {
      const [rs, ps] = await Promise.all([repo.leerRutinas(usuario.uid), repo.leerPropios(usuario.uid)]);
      const x = rs.find((y) => y.id === id) ?? null;
      setR(x);
      setPropios(ps);
      if (!x) return;
      const [h, es] = await Promise.all([
        repo.leerSesionesDeRutina(usuario.uid, id, 12).catch(() => [] as Entrenamiento[]),
        repo.leerEstados(usuario.uid, x.ejercicios.map((e) => e.ejercicioId)),
      ]);
      setSesiones(h.reverse());
      setEstados(es);
    })();
  }, [repo, usuario.uid, id]);

  if (r === null) return <Navigate to="/entreno" replace />;
  if (!r) return <Cargando forma="pagina" />;

  const valor = (w: Entrenamiento) => medida === 'volumen' ? aUnidad(w.volumen, u)
    : medida === 'reps' ? w.ejercicios.reduce((a, e) => a + seriesHechas(e).reduce((b, s) => b + s.reps, 0), 0)
      : Math.round((w.fin - w.inicio) / 60_000);
  const formato = (n: number) => medida === 'volumen' ? `${formatoNumero(Math.round(n))} ${u}` : medida === 'reps' ? `${n} reps` : `${n} min`;
  const corto = (n: number) => medida === 'volumen' ? (n >= 1000 ? `${formatoNumero(redondear(n / 1000, 1))}k` : `${Math.round(n)}`) : `${n}`;

  return (
    <div>
      <Encabezado atras="/entreno" etiqueta={r.asignadaPor ? `De tu entrenador · ${r.nombreAsignador ?? ''}` : 'Rutina · creada por vos'} titulo={r.nombre}
        linea={`${r.dias.length ? r.dias.map((d) => NOMBRES_DIA[d]).join(' · ') : 'Sin día fijo'} · ${r.ejercicios.length} ejercicios · ≈ ${minutosEstimados(r)} min`} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <section>
          <button className="btn h-14 w-full text-[18px]" disabled={!r.ejercicios.length} onClick={() => empezar.rutina(r)}>
            <Icono n="play" size={16} />Comenzar rutina
          </button>
          <div className="tarjeta mt-4" data-testid="grafico-rutina">
            <div className="etiqueta mb-2">{medida === 'volumen' ? 'Volumen por sesión' : medida === 'reps' ? 'Repeticiones por sesión' : 'Duración por sesión'}</div>
            {!sesiones ? <Cargando forma="tarjeta" /> : sesiones.length ? (
              <GraficoBarras mejor="Mejor sesión" etiqueta={medida === 'volumen' ? 'Volumen por sesión' : medida === 'reps' ? 'Repeticiones por sesión' : 'Duración por sesión'}
                datos={sesiones.map((w) => ({ fecha: w.inicio, y: valor(w) }))} formato={formato} formatoCorto={corto} />
            ) : (
              <div className="flex flex-col items-center py-8 text-mu">
                <Icono n="progreso" size={44} className="text-mu2" />
                <p className="mt-2">Aún no hay datos: hacé la rutina y acá ves tu evolución.</p>
              </div>
            )}
            <div className="mt-3">
              <Selector<Medida> nombre="Qué mostrar" valor={medida} alCambiar={setMedida}
                opciones={[{ v: 'volumen', t: 'Volumen' }, { v: 'reps', t: 'Repeticiones' }, { v: 'duracion', t: 'Duración' }]} />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[20px] font-semibold">Ejercicios</h2>
            {!r.asignadaPor && <Link to={`/rutinas/${r.id}`} className="flex items-center gap-1 text-[15px] font-semibold oro"><Icono n="editar" size={16} />Editar rutina</Link>}
          </div>
          <ul className="flex flex-col gap-3">
            {r.ejercicios.map((e, i) => {
              const ej = buscarEjercicio(e.ejercicioId, propios);
              const ult = estados.get(e.ejercicioId)?.ultima?.series ?? [];
              let n = 0;
              return (
                <li key={e.ejercicioId + i} className="tarjeta" data-testid="ejercicio-rutina">
                  <Link to={`/progreso/ejercicio/${e.ejercicioId}`} className="flex items-center gap-3">
                    <Miniatura id={e.ejercicioId} musculo={ej?.musculo} tam={44} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold oro">{ej?.nombre ?? 'Ejercicio'}</span>
                      <span className="text-[12.5px] text-mu">{textoObjetivo(e)}{e.nota ? ` · ${e.nota}` : ''}</span>
                    </span>
                  </Link>
                  <div className="mt-3 grid grid-cols-[48px_1fr_1fr] text-[11px] font-bold uppercase tracking-[.08em] text-mu2">
                    <span>Serie</span><span className="text-center">{u}</span><span className="text-center">Reps</span>
                  </div>
                  {filasDeRutina(e).map((f, j) => {
                    if (f.tipo === 'normal') n++;
                    // Peso: el de la última vez en esa serie; si no hay, el planificado
                    const kg = ult[j]?.peso ?? f.peso;
                    return (
                      <div key={j} className="grid grid-cols-[48px_1fr_1fr] border-t border-ln2 py-1.5 text-[15px]">
                        <span className={`num font-bold ${f.tipo === 'fallo' ? 'text-miss' : f.tipo === 'calentamiento' ? 'text-mu' : 'oro'}`}>
                          {f.tipo === 'fallo' ? 'F' : f.tipo === 'calentamiento' ? 'C' : n}
                        </span>
                        <span className="num text-center">{kg ? formatoPeso(kg, u).replace(` ${u}`, '') : '–'}</span>
                        <span className="num text-center">{f.tipo === 'fallo' && !f.reps ? 'máx' : f.reps || '–'}</span>
                      </div>
                    );
                  })}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
