import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { leerBorrador } from '../lib/borrador';
import { NOMBRES_DIA } from '../lib/logica';
import type { Ejercicio, Rutina } from '../lib/tipos';
import { estatuas, foco } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { CabeceraPagina, Grupo } from '../ui/familia';
import { Icono } from '../ui/Icono';
import { Cargando, Hoja, Vacio } from '../ui/piezas';
import { PLANTILLAS, rutinasDePlantilla, textoObjetivo, type Plantilla } from '../lib/plantillas';
import { useEmpezar } from './empezar';
import { NavEntreno } from './Programas';
import { minutosEstimados } from './Hoy';

export default function Entreno() {
  const { repo, usuario, perfil, aviso } = useSesion();
  const [plantilla, setPlantilla] = useState<Plantilla | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cargarPlantilla(p: Plantilla) {
    setCargando(true);
    const nuevas = rutinasDePlantilla(p, rutinas?.length ?? 0);
    for (const r of nuevas) await repo.guardarRutina(usuario.uid, r);
    setRutinas((l) => [...(l ?? []), ...nuevas]);
    setCargando(false);
    setPlantilla(null);
    aviso(`${p.nombre}: ${nuevas.length} rutinas cargadas`);
  }
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
      <CabeceraPagina etiqueta="Tu entrenamiento" titulo="Entrenamiento" linea="Rutinas, plantillas y entrenamiento libre." />
      <NavEntreno />

      <div className="relative -mx-[17px] mt-3 mb-3 h-[200px] overflow-hidden lg:mx-0 lg:h-[260px] lg:rounded-[14px] lg:border lg:border-ln">
        <img src={estatuas(perfil.figura).legionario} alt="" style={{ objectPosition: foco(perfil.figura, 'legionario') }} className="mascara-izq absolute right-0 top-0 h-full w-[58%] object-cover lg:w-[45%]" />
        <div className="absolute bottom-4 left-[18px] max-w-[55%] lg:bottom-8 lg:left-8 lg:max-w-[50%]" style={{ textShadow: 'var(--sombra-texto)' }}>
          <div className="etiqueta oro">Forjá tu fuerza</div>
          <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight lg:text-[40px]">Cada serie cuenta</h2>
          <div className="mt-4 hidden lg:block">
            {enCurso ? (
              <button className="btn" onClick={() => nav('/entrenar')}><Icono n="play" size={20} />Volver al entrenamiento en curso</button>
            ) : (
              <button className="btn" onClick={() => empezar.libre()}><Icono n="mas" size={20} />Empezar entrenamiento libre</button>
            )}
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        {enCurso ? (
          <button className="btn w-full" onClick={() => nav('/entrenar')}><Icono n="play" size={20} />Volver al entrenamiento en curso</button>
        ) : (
          <button className="btn w-full" onClick={() => empezar.libre()}><Icono n="mas" size={20} />Empezar entrenamiento libre</button>
        )}
      </div>

      <Grupo n={1} className="mt-7 mb-3" extra={<Link to="/rutinas/nueva" className="btn-sec h-9 px-3 text-[13.5px]"><Icono n="mas" size={16} />Nueva</Link>}>Mis rutinas</Grupo>

      {!rutinas ? <Cargando /> : rutinas.length === 0 ? (
        <Vacio titulo="Sin rutinas todavía" linea="Por ejemplo: «Pecho y tríceps» los lunes y jueves.">
          <Link to="/rutinas/nueva" className="btn">Crear rutina</Link>
        </Vacio>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {rutinas.map((r) => (
            <li key={r.id} className="tarjeta entrar flex flex-col">
              <div className="flex flex-1 items-start justify-between gap-3">
                <Link to={`/rutinas/${r.id}/ver`} className="flex-1" aria-label={`Abrir ${r.nombre}`}>
                  <h3 className="titulo-tarjeta">{r.nombre}</h3>
                  {r.asignadaPor && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.1em] oro" data-testid="de-tu-entrenador"><Icono n="escudo" size={16} />De tu entrenador{r.nombreAsignador ? ` · ${r.nombreAsignador}` : ''}</span>}
                  <p className="mt-1 text-[13.5px] oro">{r.dias.length ? r.dias.map((d) => NOMBRES_DIA[d]).join(' · ') : 'Sin día fijo'} · ≈ {minutosEstimados(r)} min</p>
                  <p className="mt-1 text-[13.5px] text-mu line-clamp-2">
                    {r.ejercicios.map((e) => buscarEjercicio(e.ejercicioId, propios)?.nombre).filter(Boolean).join(', ') || 'Sin ejercicios'}
                  </p>
                </Link>
                <Link to={`/rutinas/${r.id}`} aria-label={r.asignadaPor ? `Ver ${r.nombre}` : `Editar ${r.nombre}`} className="toque -mr-2 flex items-center justify-center text-mu">
                  <Icono n={r.asignadaPor ? 'escudo' : 'editar'} size={20} />
                </Link>
              </div>
              <button className="btn mt-4 h-11 w-full text-[15px]" disabled={enCurso || !r.ejercicios.length}
                onClick={() => empezar.rutina(r)}>
                <Icono n="play" size={16} /> Empezar rutina
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 mb-3">
        <Grupo n={2}>Plantillas</Grupo>
        <p className="mt-2 text-[13.5px] text-mu">Rutinas armadas para cargar con un toque.</p>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {PLANTILLAS.map((p) => (
          <li key={p.id} className="hero text-left">
            <div className="etiqueta oro">{p.nivel}</div>
            <h3 className="titulo-tarjeta mt-1">{p.nombre}</h3>
            <p className="mt-1 text-[13.5px] text-mu">{p.descripcion}</p>
            <button className="btn-sec mt-4 w-full" onClick={() => setPlantilla(p)}>Ver y cargar</button>
          </li>
        ))}
      </ul>

      <Hoja abierta={!!plantilla} alCerrar={() => setPlantilla(null)} etiqueta={plantilla?.nivel} titulo={plantilla?.nombre ?? ''}>
        {plantilla && (
          <>
            {plantilla.rutinas.map((r) => (
              <div key={r.nombre} className="mb-4">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-display text-[18px] font-semibold oro">{r.nombre}</h4>
                  <span className="text-[12.5px] text-mu">{r.dias.map((d) => NOMBRES_DIA[d]).join(' · ')}</span>
                </div>
                <ul className="mt-1 text-[15px]">
                  {r.ejercicios.map((e, i) => (
                    <li key={i} className="flex justify-between gap-2 border-b border-ln2 py-1.5 last:border-0">
                      <span>{buscarEjercicio(e.ejercicioId)?.nombre}{e.nota && <span className="text-mu"> · {e.nota}</span>}</span>
                      <span className="num shrink-0 text-tx2">{textoObjetivo(e)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button className="btn w-full" disabled={cargando} onClick={() => cargarPlantilla(plantilla)}>
              {cargando ? 'Cargando…' : `Cargar las ${plantilla.rutinas.length} rutinas`}
            </button>
          </>
        )}
      </Hoja>
    </div>
  );
}
