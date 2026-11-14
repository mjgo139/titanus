import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { aUnidad, fechaCorta, formatoNumero, formatoPeso, redondear } from '../lib/logica';
import type { Ejercicio, EstadoEjercicio } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Cargando, Encabezado, GraficoLinea, Seccion, Selector, Vacio } from '../ui/piezas';

export default function DetalleEjercicio() {
  const { id = '' } = useParams();
  const { repo, usuario, perfil } = useSesion();
  const [est, setEst] = useState<EstadoEjercicio | null | undefined>(undefined);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [medida, setMedida] = useState<'peso' | 'volumen'>('peso');
  const u = perfil.unidad;

  useEffect(() => {
    repo.leerPropios(usuario.uid).then(setPropios);
    repo.leerEstados(usuario.uid, [id]).then((m) => setEst(m.get(id) ?? null));
  }, [repo, usuario.uid, id]);

  const ej = buscarEjercicio(id, propios);
  if (est === undefined) return <Cargando />;

  return (
    <div>
      <Encabezado atras="/progreso?v=records" etiqueta={ej?.musculo ?? 'Ejercicio'} titulo={ej?.nombre ?? 'Ejercicio'}
        linea="Cómo evolucionó tu fuerza en cada sesión." />
      {!est ? <Vacio titulo="Sin datos" linea="Todavía no registraste este ejercicio." /> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="tarjeta">
              <div className="etiqueta">Peso máximo</div>
              <div className="num text-[28px] mt-1 text-gold">{formatoPeso(est.mejorPeso, u)}</div>
            </div>
            <div className="tarjeta">
              <div className="etiqueta">Mejor volumen</div>
              <div className="num text-[28px] mt-1">{formatoPeso(est.mejorVolumen, u, 0)}</div>
            </div>
          </div>
          <Seccion titulo="Gráfico">
            <div className="tarjeta">
              <Selector nombre="Medida" valor={medida} alCambiar={setMedida}
                opciones={[{ v: 'peso', t: 'Peso máximo' }, { v: 'volumen', t: 'Volumen' }]} />
              <div className="mt-4">
                <GraficoLinea etiqueta={medida === 'peso' ? 'Peso máximo por sesión' : 'Volumen por sesión'}
                  puntos={est.puntos.map((p) => ({ x: p.fecha, y: aUnidad(medida === 'peso' ? p.pesoMax : p.volumen, u) }))}
                  formato={(n) => `${formatoNumero(redondear(n, medida === 'peso' ? 1 : 0))} ${u}`} />
              </div>
            </div>
          </Seccion>
          <Seccion titulo="Últimas sesiones">
            <ul className="tarjeta py-1">
              {[...est.puntos].reverse().slice(0, 10).map((p) => (
                <li key={p.fecha} className="fila last:border-0">
                  <span className="flex-1 text-mu">{fechaCorta(p.fecha)}</span>
                  <span className="num">{formatoPeso(p.pesoMax, u)}</span>
                  <span className="num w-24 text-right text-mu">{formatoNumero(redondear(aUnidad(p.volumen, u), 0))} vol.</span>
                </li>
              ))}
            </ul>
          </Seccion>
        </>
      )}
    </div>
  );
}
