import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buscarEjercicio } from '../lib/biblioteca';
import { leerBorrador } from '../lib/borrador';
import { fraseDelDia } from '../lib/frases';
import { NOMBRES_DIA, fechaLarga, rachaSemanas, romano, rutinaDeHoy, saludo, semanaActual } from '../lib/logica';
import type { Ejercicio, Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando, Seccion, Vacio } from '../ui/piezas';

export default function Hoy() {
  const { repo, usuario, perfil } = useSesion();
  const nav = useNavigate();
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [propios, setPropios] = useState<Ejercicio[]>([]);
  const ahora = Date.now();
  const frase = fraseDelDia(ahora);
  const borrador = leerBorrador(usuario.uid);

  useEffect(() => {
    repo.leerRutinas(usuario.uid).then(setRutinas);
    repo.leerPropios(usuario.uid).then(setPropios);
  }, [repo, usuario.uid]);

  const dias = perfil.resumen.dias;
  const racha = rachaSemanas(dias, ahora);
  const semana = semanaActual(dias, ahora);
  const hechosSemana = semana.filter((d) => d.hecho).length;
  const deHoy = rutinas ? rutinaDeHoy(rutinas, ahora) : undefined;
  const entrenoHoy = semana.find((d) => d.hoy)?.hecho;
  const proxima = rutinas && !deHoy
    ? [1, 2, 3, 4, 5, 6].map((i) => ({ i, r: rutinaDeHoy(rutinas, ahora + i * 86_400_000) })).find((x) => x.r)
    : undefined;

  return (
    <div>
      <header className="entrar pt-6 pb-5">
        <div className="etiqueta">Panel del día · {fechaLarga(ahora)}</div>
        <h1 className="titulo mt-2">{saludo(new Date(ahora).getHours())}, {perfil.nombre.split(' ')[0]}</h1>
        <p className="mt-2 text-mu font-medium">Una serie por vez, con toda la atención.</p>
      </header>

      <figure className="hero entrar">
        <Icono n="laurel" size={140} className="absolute -right-6 -bottom-6 text-gold opacity-[.13]" />
        <div className="etiqueta">Frase del día</div>
        <blockquote className="mt-3 font-display font-semibold text-[18px] leading-snug text-tx2">“{frase.texto}”</blockquote>
        <figcaption className="etiqueta mt-3">{frase.autor}</figcaption>
      </figure>

      {borrador && (
        <button onClick={() => nav('/entrenar/continuar')} className="tarjeta mt-4 w-full text-left flex items-center gap-4 border-gold">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-on"><Icono n="play" size={18} /></span>
          <span className="flex-1">
            <span className="etiqueta text-gold">En curso</span>
            <span className="block titulo-tarjeta">{borrador.nombre}</span>
          </span>
          <span className="text-gold font-bold text-[13px] uppercase tracking-[.1em]">Seguir</span>
        </button>
      )}

      <Seccion titulo="Entrenamiento de hoy">
        {!rutinas ? <Cargando /> : deHoy ? (
          <div className="tarjeta">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="etiqueta">{deHoy.dias.map((d) => NOMBRES_DIA[d]).join(' · ')}</div>
                <h3 className="titulo-tarjeta mt-1">{deHoy.nombre}</h3>
              </div>
              {entrenoHoy && <span className="chip border-ok text-ok bg-okbg">Hecho</span>}
            </div>
            <ul className="mt-3 text-[14px] text-mu">
              {deHoy.ejercicios.slice(0, 5).map((e) => (
                <li key={e.ejercicioId} className="flex justify-between py-1">
                  <span>{buscarEjercicio(e.ejercicioId, propios)?.nombre ?? 'Ejercicio'}</span>
                  <span className="num text-tx2">{e.series}×{e.reps}</span>
                </li>
              ))}
            </ul>
            {!borrador && (
              <button className="btn w-full mt-4" onClick={() => nav(`/entrenar/${deHoy.id}`)}>
                {entrenoHoy ? 'Entrenar de nuevo' : 'Empezar entrenamiento'}
              </button>
            )}
          </div>
        ) : rutinas.length === 0 ? (
          <Vacio titulo="Todavía no tenés rutinas" linea="Armá tu primera rutina y asignala a los días que vas al gimnasio.">
            <Link to="/rutinas/nueva" className="btn">Crear rutina</Link>
          </Vacio>
        ) : (
          <div className="tarjeta">
            <h3 className="titulo-tarjeta">Día de descanso</h3>
            <p className="mt-2 text-mu">
              {proxima?.r ? <>Lo próximo: <b className="text-tx2">{proxima.r.nombre}</b> {proxima.i === 1 ? 'mañana' : `en ${proxima.i} días`}.</> : 'El descanso también es parte del entrenamiento.'}
            </p>
            {!borrador && (
              <button className="btn-sec mt-4" onClick={() => nav('/rutinas')}>Entrenar igual</button>
            )}
          </div>
        )}
      </Seccion>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <div className="tarjeta">
          <div className="etiqueta">Racha</div>
          <div className="num text-[44px] leading-none mt-2 text-gold" data-testid="racha">{racha ? romano(racha) : '—'}</div>
          <div className="mt-2 text-[13px] text-mu">{racha === 1 ? 'semana entrenada' : `${racha} semanas seguidas`}</div>
        </div>
        <div className="tarjeta">
          <div className="etiqueta">Esta semana</div>
          <div className="num text-[44px] leading-none mt-2">{hechosSemana}</div>
          <div className="mt-2 text-[13px] text-mu">{hechosSemana === 1 ? 'entrenamiento' : 'entrenamientos'}</div>
        </div>
      </div>

      <Seccion titulo="Semana">
        <div className="tarjeta flex justify-between px-3">
          {semana.map((d) => (
            <div key={d.fecha} className="flex flex-col items-center gap-2">
              <span className={`text-[11px] font-bold ${d.hoy ? 'text-gold' : 'text-mu2'}`}>{d.letra}</span>
              <span aria-label={d.hecho ? 'Entrenado' : d.futuro ? 'Próximo' : 'Sin entrenar'}
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${d.hecho ? 'bg-ok border-ok text-on' : d.hoy ? 'border-gold text-gold' : 'border-ln text-mu2'}`}>
                {d.hecho ? <Icono n="check" size={16} /> : <span className="num text-[13px]">{new Date(d.fecha).getDate()}</span>}
              </span>
            </div>
          ))}
        </div>
      </Seccion>
    </div>
  );
}
