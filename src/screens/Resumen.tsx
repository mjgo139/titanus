import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { contarSeries, duracion, formatoPeso, rachaSemanas, romano, volumenEjercicio } from '../lib/logica';
import type { Ejercicio, Entrenamiento } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Celebracion, Seccion } from '../ui/piezas';

export default function Resumen() {
  const loc = useLocation();
  const nav = useNavigate();
  const { repo, usuario, perfil } = useSesion();
  const e = (loc.state as { entreno?: Entrenamiento } | null)?.entreno;
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [festejo, setFestejo] = useState(!!e?.records.length);
  const cerrar = useCallback(() => setFestejo(false), []);

  useEffect(() => { repo.leerPropios(usuario.uid).then(setPropios); }, [repo, usuario.uid]);
  if (!e) return <Navigate to="/" replace />;

  const u = perfil.unidad;
  const racha = rachaSemanas(perfil.resumen.dias);
  const r0 = e.records[0];
  const nombreRec = r0 ? buscarEjercicio(r0.ejercicioId, propios)?.nombre ?? 'Ejercicio' : '';

  return (
    <div>
      <header className="entrar pt-8 pb-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-goldbg text-gold rebote">
          <Icono n="laurel" size={34} />
        </div>
        <div className="etiqueta mt-4">Hecho · {e.nombre}</div>
        <h1 className="titulo mt-2">Entrenamiento terminado</h1>
        <p className="mt-2 text-mu font-medium">Hoy elegiste el esfuerzo. Eso es lo que construye.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Duración', duracion(e.fin - e.inicio)],
          ['Series', String(contarSeries(e.ejercicios))],
          ['Volumen', formatoPeso(e.volumen, u, 0)],
        ].map(([t, v]) => (
          <div key={t} className="tarjeta px-3 text-center">
            <div className="etiqueta">{t}</div>
            <div className="num text-[20px] mt-2">{v}</div>
          </div>
        ))}
      </div>

      <div className="tarjeta mt-3 flex items-center justify-between">
        <div>
          <div className="etiqueta">Racha de semanas</div>
          <div className="mt-1 text-mu text-[14px]">{racha} {racha === 1 ? 'semana' : 'semanas'} sin aflojar</div>
        </div>
        <div className="num text-[40px] text-gold">{romano(racha)}</div>
      </div>

      {e.records.length > 0 && (
        <Seccion titulo="Récords nuevos">
          <ul className="tarjeta py-1">
            {e.records.map((r) => (
              <li key={r.ejercicioId + r.tipo} className="fila last:border-0">
                <Icono n="medalla" className="text-gold" />
                <span className="flex-1 font-semibold">{buscarEjercicio(r.ejercicioId, propios)?.nombre}</span>
                <span className="num text-gold">{r.tipo === 'peso' ? formatoPeso(r.valor, u) : `${formatoPeso(r.valor, u, 0)} vol.`}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="Ejercicios">
        <ul className="tarjeta py-1">
          {e.ejercicios.map((x) => (
            <li key={x.ejercicioId} className="fila last:border-0">
              <span className="flex-1">
                <span className="block font-semibold">{buscarEjercicio(x.ejercicioId, propios)?.nombre}</span>
                <span className="text-[13px] text-mu">{x.series.length} series</span>
              </span>
              <span className="num text-tx2">{formatoPeso(volumenEjercicio(x), u, 0)}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      <button className="btn w-full mt-8" onClick={() => nav('/', { replace: true })}>Volver a Hoy</button>

      <Celebracion visible={festejo} alCerrar={cerrar} icono="medalla" titulo={nombreRec}
        linea={r0 ? (r0.tipo === 'peso' ? `Nuevo máximo: ${formatoPeso(r0.valor, u)}` : 'Tu mayor volumen hasta hoy') : ''} />
    </div>
  );
}
