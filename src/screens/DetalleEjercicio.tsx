import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { aUnidad, fechaCorta, formatoNumero, formatoPeso, redondear } from '../lib/logica';
import type { Ejercicio, EstadoEjercicio } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Cargando, Encabezado, GraficoLinea, Seccion, Selector, Vacio } from '../ui/piezas';
import { Animacion } from './Miniatura';

export default function DetalleEjercicio() {
  const { id = '' } = useParams();
  const { repo, usuario, perfil } = useSesion();
  const [est, setEst] = useState<EstadoEjercicio | null | undefined>(undefined);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [medida, setMedida] = useState<'peso' | 'e1rm' | 'volumen' | 'reps'>('peso');
  const u = perfil.unidad;

  useEffect(() => {
    repo.leerPropios(usuario.uid).then(setPropios);
    repo.leerEstados(usuario.uid, [id]).then((m) => setEst(m.get(id) ?? null));
  }, [repo, usuario.uid, id]);

  const ej = buscarEjercicio(id, propios);
  if (est === undefined) return <Cargando forma="pagina" />;

  return (
    <div>
      <Encabezado atras="/progreso?v=records" etiqueta={ej?.musculo ?? 'Ejercicio'} titulo={ej?.nombre ?? 'Ejercicio'}
        linea="Cómo evolucionó tu fuerza en cada sesión." />
      <Animacion id={id} nombre={ej?.nombre} className="mb-4 aspect-[3/2] w-full rounded-[14px] border border-ln lg:max-w-[520px]" />
      {!est ? <Vacio titulo="Sin datos" linea="Todavía no registraste este ejercicio." /> : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="tarjeta px-3">
              <div className="etiqueta">Peso máx.</div>
              <div className="num mt-1 text-[20px] oro">{formatoPeso(est.mejorPeso, u)}</div>
            </div>
            <div className="tarjeta px-3">
              <div className="etiqueta">1RM est.</div>
              <div className="num mt-1 text-[20px]">{est.mejor1RM ? formatoPeso(est.mejor1RM, u) : '—'}</div>
            </div>
            <div className="tarjeta px-3">
              <div className="etiqueta">Volumen</div>
              <div className="num mt-1 text-[20px]">{formatoPeso(est.mejorVolumen, u, 0)}</div>
            </div>
          </div>
          <p className="mt-2 text-[12.5px] text-mu">1RM: el peso que podrías levantar una sola vez, estimado con tus series.</p>
          <div className="lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <Seccion n={1} titulo="Gráfico">
            <div className="tarjeta">
              <Selector nombre="Medida" valor={medida} alCambiar={setMedida}
                opciones={[{ v: 'peso', t: 'Peso' }, { v: 'e1rm', t: '1RM' }, { v: 'volumen', t: 'Volumen' }, { v: 'reps', t: 'Reps' }]} />
              <div className="mt-4">
                <GraficoLinea etiqueta={{ peso: 'Peso máximo por sesión', e1rm: '1RM estimado por sesión', volumen: 'Volumen por sesión', reps: 'Repeticiones por sesión' }[medida]}
                  puntos={est.puntos.filter((p) => medida === 'peso' || medida === 'volumen' || p[medida] !== undefined)
                    .map((p) => ({ x: p.fecha, y: medida === 'reps' ? p.reps ?? 0 : aUnidad(medida === 'peso' ? p.pesoMax : medida === 'e1rm' ? p.e1rm ?? 0 : p.volumen, u) }))}
                  formato={(n) => (medida === 'reps' ? `${n} reps` : `${formatoNumero(redondear(n, medida === 'volumen' ? 0 : 1))} ${u}`)} />
              </div>
            </div>
          </Seccion>
          <Seccion n={2} titulo="Últimas sesiones">
            <ul className="tarjeta py-1">
              {[...est.puntos].reverse().slice(0, 10).map((p) => (
                <li key={p.fecha} className="fila last:border-0">
                  <span className="flex-1 text-mu">{fechaCorta(p.fecha)}</span>
                  <span className="num oro">{formatoPeso(p.pesoMax, u)}</span>
                  <span className="num w-24 text-right text-mu">{formatoNumero(redondear(aUnidad(p.volumen, u), 0))} vol.</span>
                </li>
              ))}
            </ul>
          </Seccion>
          </div>
        </>
      )}
    </div>
  );
}
