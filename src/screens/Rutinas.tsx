import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { leerBorrador } from '../lib/borrador';
import { NOMBRES_DIA } from '../lib/logica';
import type { Ejercicio, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Encabezado, Vacio } from '../ui/piezas';

export default function Rutinas() {
  const { repo, usuario } = useSesion();
  const nav = useNavigate();
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const enCurso = !!leerBorrador(usuario.uid);

  useEffect(() => {
    repo.leerRutinas(usuario.uid).then(setRutinas);
    repo.leerPropios(usuario.uid).then(setPropios);
  }, [repo, usuario.uid]);

  return (
    <div>
      <Encabezado etiqueta="Rutinas" titulo="Tu plan semanal" linea="Una rutina por día de entrenamiento."
        accion={<Link to="/rutinas/nueva" className="btn-sec h-9 px-4"><Icono n="mas" size={16} />Nueva</Link>} />
      {!rutinas ? <Cargando /> : rutinas.length === 0 ? (
        <Vacio titulo="Sin rutinas todavía" linea="Por ejemplo: «Pecho y tríceps» los lunes y jueves.">
          <Link to="/rutinas/nueva" className="btn">Crear rutina</Link>
        </Vacio>
      ) : (
        <ul className="flex flex-col gap-3">
          {rutinas.map((r) => (
            <li key={r.id} className="tarjeta entrar">
              <div className="flex items-start justify-between gap-3">
                <Link to={`/rutinas/${r.id}`} className="flex-1">
                  <div className="etiqueta">{r.dias.length ? r.dias.map((d) => NOMBRES_DIA[d]).join(' · ') : 'Sin día fijo'}</div>
                  <h3 className="titulo-tarjeta mt-1">{r.nombre}</h3>
                  <p className="mt-1 text-[14px] text-mu line-clamp-2">
                    {r.ejercicios.map((e) => buscarEjercicio(e.ejercicioId, propios)?.nombre).filter(Boolean).join(' · ') || 'Sin ejercicios'}
                  </p>
                </Link>
                <Link to={`/rutinas/${r.id}`} aria-label={`Editar ${r.nombre}`} className="toque flex items-center justify-center text-mu -mr-2">
                  <Icono n="editar" size={20} />
                </Link>
              </div>
              <button className="btn-sec mt-4 w-full" disabled={enCurso || !r.ejercicios.length}
                onClick={() => nav(`/entrenar/${r.id}`)}>
                <Icono n="play" size={14} /> Entrenar
              </button>
            </li>
          ))}
        </ul>
      )}
      {enCurso && <p className="mt-4 text-center text-[13px] text-mu">Tenés un entrenamiento en curso. Terminalo desde Hoy.</p>}
    </div>
  );
}
