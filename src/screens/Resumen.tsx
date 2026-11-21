import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { rutinaDesdeEntreno } from '../lib/entreno';
import { contarSeries, duracion, formatoPeso, mejorSerie, rachaSemanas, rango, romano } from '../lib/logica';
import type { Ejercicio, Entrenamiento, Record as Rec } from '../lib/tipos';
import { estatuas, foco } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Celebracion } from '../ui/piezas';

export function textoRecord(r: Rec, u: 'kg' | 'lb') {
  return r.tipo === 'peso' ? `Peso máximo · ${formatoPeso(r.valor, u)}` : r.tipo === '1rm' ? `1RM estimado · ${formatoPeso(r.valor, u)}` : `Volumen · ${formatoPeso(r.valor, u, 0)}`;
}

export default function Resumen() {
  const loc = useLocation();
  const nav = useNavigate();
  const { repo, usuario, perfil, aviso } = useSesion();
  const e = (loc.state as { entreno?: Entrenamiento } | null)?.entreno;
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const [festejo, setFestejo] = useState(!!e?.records.length);
  const [guardada, setGuardada] = useState(false);
  const cerrar = useCallback(() => setFestejo(false), []);

  useEffect(() => { repo.leerPropios(usuario.uid).then(setPropios); }, [repo, usuario.uid]);
  if (!e) return <Navigate to="/" replace />;

  const u = perfil.unidad;
  const racha = rachaSemanas(perfil.resumen.dias);
  const r = rango(perfil.resumen.total);
  const r0 = e.records[0];

  async function guardarRutina() {
    const rs = await repo.leerRutinas(usuario.uid);
    await repo.guardarRutina(usuario.uid, rutinaDesdeEntreno(e!, rs.length));
    setGuardada(true);
    aviso('Rutina guardada');
  }

  return (
    <div className="pt-4">
      <div className="relative -mx-[17px] h-[190px] overflow-hidden lg:mx-0 lg:h-[240px] lg:rounded-[14px] lg:border lg:border-ln">
        <img src={estatuas(perfil.figura).capa} alt="" style={{ objectPosition: foco(perfil.figura, 'capa') }} className="mascara-izq absolute right-0 top-0 h-full w-[52%] object-cover lg:w-[40%]" />
        <div className="absolute bottom-3 left-[18px] max-w-[62%]" style={{ textShadow: 'var(--sombra-texto)' }}>
          <Icono n="corona" size={34} className="oro rebote" />
          <div className="etiqueta oro mt-1">Entrenamiento N.º {romano(e.numero ?? perfil.resumen.total)}</div>
          <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight">¡Bien hecho, {perfil.nombre.split(' ')[0]}!</h1>
        </div>
      </div>
      <p className="mt-2 text-mu">{e.nombre} · Hoy elegiste el esfuerzo.</p>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div>
      <div className="tarjeta mt-4 grid grid-cols-3 py-3 text-center">
        <div><div className="etiqueta">Duración</div><div className="num mt-1 text-[18px]">{duracion(e.fin - e.inicio)}</div></div>
        <div><div className="etiqueta">Volumen</div><div className="num mt-1 text-[18px]">{formatoPeso(e.volumen, u, 0)}</div></div>
        <div><div className="etiqueta">Series</div><div className="num mt-1 text-[18px]">{contarSeries(e.ejercicios)}</div></div>
      </div>

      <div className="tarjeta mt-3 flex items-center justify-between">
        <div>
          <div className="etiqueta">Racha · {r.nombre} nivel {r.nivel}</div>
          <div className="mt-1 text-[14px] text-mu">{racha} {racha === 1 ? 'semana' : 'semanas'} sin aflojar{r.siguiente ? ` · faltan ${r.faltan} para ${r.siguiente}` : ''}</div>
        </div>
        <div className="num oro text-[38px]">{romano(racha)}</div>
      </div>

      {e.records.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-[20px] font-semibold">Récords nuevos</h2>
          <ul className="tarjeta py-1">
            {e.records.map((x) => (
              <li key={x.ejercicioId + x.tipo} className="fila last:border-0">
                <Icono n="medalla" className="oro" />
                <span className="flex-1">
                  <span className="block font-semibold">{buscarEjercicio(x.ejercicioId, propios)?.nombre}</span>
                  <span className="text-[13px] oro">{textoRecord(x, u)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      </div>
      <div>
      <section className="mt-6 lg:mt-4">
        <h2 className="mb-3 font-display text-[20px] font-semibold">Ejercicios</h2>
        <ul className="tarjeta py-1">
          {e.ejercicios.map((x) => {
            const m = mejorSerie(x);
            return (
              <li key={x.ejercicioId} className="fila last:border-0">
                <span className="flex-1">
                  <span className="block font-semibold">{x.series.length} × {buscarEjercicio(x.ejercicioId, propios)?.nombre}</span>
                  {m && <span className="text-[13px] text-mu">Mejor serie: {formatoPeso(m.peso, u)} × {m.reps}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-7 flex flex-col gap-3">
        {!e.rutinaId && !guardada && (
          <button className="btn-sec h-[52px]" onClick={guardarRutina}><Icono n="guardar" size={18} />Guardar como rutina</button>
        )}
        <button className="btn w-full" onClick={() => nav('/', { replace: true })}>Volver al inicio</button>
      </div>
      </div>
      </div>

      <Celebracion visible={festejo} alCerrar={cerrar} icono="medalla"
        titulo={r0 ? buscarEjercicio(r0.ejercicioId, propios)?.nombre ?? 'Récord' : ''}
        linea={r0 ? textoRecord(r0, u) : ''} />
    </div>
  );
}
