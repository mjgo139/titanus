import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import legionario from '../assets/legionario.webp';
import { buscarEjercicio } from '../lib/biblioteca';
import { leerBorrador } from '../lib/borrador';
import { NOMBRES_DIA } from '../lib/logica';
import type { Ejercicio, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Vacio } from '../ui/piezas';
import { useEmpezar } from './empezar';
import { minutosEstimados } from './Hoy';

export default function Entreno() {
  const { repo, usuario } = useSesion();
  const nav = useNavigate();
  const empezar = useEmpezar();
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const enCurso = !!leerBorrador(usuario.uid);

  useEffect(() => {
    repo.leerRutinas(usuario.uid).then(setRutinas);
    repo.leerPropios(usuario.uid).then(setPropios);
  }, [repo, usuario.uid]);

  return (
    <div className="pt-6">
      <h1 className="titulo text-center">Entrenamiento</h1>

      <div className="relative -mx-[17px] mt-3 mb-3 h-[200px] overflow-hidden">
        <img src={legionario} alt="" className="mascara-izq absolute right-0 top-0 h-full w-[58%] object-cover" />
        <div className="absolute bottom-4 left-[18px] max-w-[60%]" style={{ textShadow: '0 2px 6px #000' }}>
          <div className="etiqueta oro">Forjá tu fuerza</div>
          <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight">Cada serie cuenta</h2>
        </div>
      </div>

      {enCurso ? (
        <button className="btn w-full" onClick={() => nav('/entrenar')}><Icono n="play" size={18} />Volver al entrenamiento en curso</button>
      ) : (
        <button className="btn w-full" onClick={() => empezar.libre()}><Icono n="mas" size={18} />Empezar entrenamiento libre</button>
      )}

      <div className="mt-7 mb-3 flex items-center justify-between">
        <h2 className="font-display text-[22px] font-semibold">Rutinas</h2>
        <Link to="/rutinas/nueva" className="btn-sec h-9 px-3 text-[13px]"><Icono n="mas" size={16} />Nueva</Link>
      </div>

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
                  <h3 className="titulo-tarjeta">{r.nombre}</h3>
                  <p className="mt-1 text-[13px] oro">{r.dias.length ? r.dias.map((d) => NOMBRES_DIA[d]).join(' · ') : 'Sin día fijo'} · ≈ {minutosEstimados(r)} min</p>
                  <p className="mt-1 text-[14px] text-mu line-clamp-2">
                    {r.ejercicios.map((e) => buscarEjercicio(e.ejercicioId, propios)?.nombre).filter(Boolean).join(', ') || 'Sin ejercicios'}
                  </p>
                </Link>
                <Link to={`/rutinas/${r.id}`} aria-label={`Editar ${r.nombre}`} className="toque -mr-2 flex items-center justify-center text-mu">
                  <Icono n="editar" size={20} />
                </Link>
              </div>
              <button className="btn mt-4 h-11 w-full text-[15px]" disabled={enCurso || !r.ejercicios.length}
                onClick={() => empezar.rutina(r)}>
                <Icono n="play" size={14} /> Empezar rutina
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
