import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { leerBorrador } from '../lib/borrador';
import { fraseDelDia } from '../lib/frases';
import { rachaSemanas, rango, romano, rutinaDeHoy, semanaActual } from '../lib/logica';
import type { Rutina } from '../lib/tipos';
import { estatuas, foco } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando } from '../ui/piezas';
import { useEmpezar } from './empezar';
import { AvisoHoy } from '../pro/AvisoHoy';
import { ProgramaEnCurso } from './Programas';

export function minutosEstimados(r: Rutina): number {
  return Math.max(10, Math.round(r.ejercicios.reduce((t, e) => t + e.series * (e.descanso + 40), 0) / 60 / 5) * 5);
}

export default function Hoy() {
  const { repo, usuario, perfil } = useSesion();
  const nav = useNavigate();
  const empezar = useEmpezar();
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const ahora = Date.now();
  const frase = fraseDelDia(ahora);
  const enCurso = !!leerBorrador(usuario.uid);

  useEffect(() => { repo.leerRutinas(usuario.uid).then(setRutinas); }, [repo, usuario.uid]);

  const dias = perfil.resumen.dias;
  const racha = rachaSemanas(dias, ahora);
  const semana = semanaActual(dias, ahora);
  const r = rango(perfil.resumen.total);
  const deHoy = rutinas ? rutinaDeHoy(rutinas, ahora) : undefined;
  const idx = deHoy && rutinas ? [...rutinas].sort((a, b) => a.orden - b.orden).indexOf(deHoy) + 1 : 0;
  const proxima = rutinas && !deHoy
    ? [1, 2, 3, 4, 5, 6].map((k) => ({ k, r: rutinaDeHoy(rutinas, ahora + k * 86_400_000) })).find((x) => x.r)
    : undefined;
  const proximaTexto = proxima?.r ? `Lo próximo: ${proxima.r.nombre}, ${proxima.k === 1 ? 'mañana' : `en ${proxima.k} días`}.` : 'Hoy no hay rutina asignada.';
  const fecha = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' }).format(ahora).replace('.', '');

  const encabezado = 'flex h-[52px] items-center justify-between';
  const titulo = 'flex items-center gap-2 font-display text-[21px] font-semibold';
  return (
    <div className="pt-6">
      <div className="entrar flex items-center justify-between">
        <div className="flex items-center gap-[15px]">
          <img src={estatuas(perfil.figura).avatar} alt="" className="h-[65px] w-[65px] rounded-full border-2 border-gold object-cover" />
          <div>
            <h1 className="font-display text-[20px] font-semibold">Hola, {perfil.nombre.split(' ')[0]}</h1>
            <p className="oro mt-1 text-[14px]" data-testid="rango">{r.nombre} · Nivel {r.nivel}</p>
          </div>
        </div>
        <Link to="/perfil" aria-label="Ir a mi perfil" className="toque flex items-center justify-center oro"><Icono n="corona" size={24} /></Link>
      </div>

      <div className="divisor my-[17px]" />

      <AvisoHoy />
      <ProgramaEnCurso />

      {/* Celular: una columna. PC: dos columnas con filas alineadas (encabezado, tarjeta, título, contenido) */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-3">
        <div className={`${encabezado} lg:col-start-1 lg:row-start-1`}>
          <h2 className={titulo}><Icono n="calendario" size={20} className="oro" />Hoy, {fecha}</h2>
          <div className="flex items-center gap-2 text-[13px] text-mu">
            <Icono n="fuego" size={16} className="oro" />
            {racha ? <><strong className="num oro text-[20px]" data-testid="racha">{romano(racha)}</strong>{racha === 1 ? 'semana' : 'semanas'}</>
              : <span data-testid="racha">Sin racha aún</span>}
          </div>
        </div>

        <figure className="hero m-0 flex flex-col justify-center lg:col-start-1 lg:row-start-2 lg:h-full">
          <blockquote className="font-display text-[18px] italic leading-snug text-tx lg:text-[20px]">“{frase.texto}”</blockquote>
          <figcaption className="oro mt-2 text-[14px]">— {frase.autor}</figcaption>
        </figure>

        <div className={`${encabezado} mt-3 lg:col-start-1 lg:row-start-3 lg:mt-4`}>
          <h2 className={titulo}>Entrenamiento de hoy</h2>
        </div>

        <div className="lg:col-start-1 lg:row-start-4">
          {!rutinas ? <Cargando /> : (
            <div className="tarjeta flex h-full min-h-[165px] items-stretch gap-3 overflow-hidden p-0 lg:min-h-[232px]">
              <img src={estatuas(perfil.figura).espalda} alt="" style={{ objectPosition: foco(perfil.figura, 'espalda') }} className="w-[40%] object-cover" />
              <div className="flex flex-1 flex-col justify-center py-4 pr-4">
                {deHoy ? <>
                  <div className="etiqueta oro">Día {romano(idx)} · {perfil.resumen.total ? `Sesión ${perfil.resumen.total + 1}` : 'Primera sesión'}</div>
                  <h3 className="mt-1 font-display text-[21px] font-semibold leading-tight">{deHoy.nombre}</h3>
                  <p className="mt-1 text-[14px] text-mu">{deHoy.ejercicios.length} ejercicios</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[14px]"><Icono n="reloj" size={16} className="oro" />{minutosEstimados(deHoy)} min</span>
                    <button className="btn-redondo" aria-label={`Empezar ${deHoy.nombre}`} disabled={enCurso}
                      onClick={() => empezar.rutina(deHoy)}><Icono n="play" size={20} /></button>
                  </div>
                </> : <>
                  <div className="etiqueta oro">{rutinas.length ? 'Día libre' : 'Primer paso'}</div>
                  <h3 className="mt-1 font-display text-[21px] font-semibold leading-tight">{rutinas.length ? 'Descanso o libre' : 'Armá tu rutina'}</h3>
                  <p className="mt-1 text-[14px] text-mu">{rutinas.length ? proximaTexto : 'Elegí ejercicios y días.'}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link to={rutinas.length ? '/entreno' : '/rutinas/nueva'} className="text-[14px] oro font-semibold">{rutinas.length ? 'Ver rutinas' : 'Crear rutina'}</Link>
                    <button className="btn-redondo" aria-label="Empezar entrenamiento libre" disabled={enCurso}
                      onClick={() => empezar.libre()}><Icono n="play" size={20} /></button>
                  </div>
                </>}
              </div>
            </div>
          )}
        </div>

        <div className={`${encabezado} hidden lg:col-start-2 lg:row-start-1 lg:flex`}>
          <h2 className={titulo}>Tu semana</h2>
          <span className="text-[13px] text-mu">{semana.filter((d) => d.hecho).length} de 7 días</span>
        </div>

        <div className="tarjeta flex items-center justify-between px-3 py-3 lg:col-start-2 lg:row-start-2 lg:h-full lg:px-5">
          {semana.map((d) => (
            <div key={d.fecha} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-bold ${d.hoy ? 'oro' : 'text-mu2'}`}>{d.letra}</span>
              <span aria-label={d.hecho ? 'Entrenado' : 'Sin entrenar'}
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] lg:h-9 lg:w-9 ${d.hecho ? 'border-goldh' : d.hoy ? 'border-gold oro' : 'border-ln2 text-mu2'}`}
                style={d.hecho ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>
                {d.hecho ? <Icono n="check" size={15} /> : new Date(d.fecha).getDate()}
              </span>
            </div>
          ))}
        </div>

        <div className={`${encabezado} hidden lg:col-start-2 lg:row-start-3 lg:mt-4 lg:flex`}>
          <h2 className={titulo}>Accesos</h2>
        </div>

        <div className="mt-1 flex flex-col gap-[9px] lg:col-start-2 lg:row-start-4 lg:mt-0">
          <div className="grid flex-1 grid-cols-2 gap-[9px]">
            {[
              { a: '/entreno', i: 'entreno', t: 'Rutinas', s: `${rutinas?.length ?? 0} planificadas` },
              { a: '/progreso', i: 'progreso', t: 'Progreso', s: 'Tu evolución' },
              { a: '/progreso?v=records', i: 'trofeo', t: 'Récords', s: 'Tus mejores marcas' },
              { a: '/progreso?v=medidas', i: 'cuerpo', t: 'Medidas', s: 'Peso y cuerpo' },
            ].map((x) => (
              <button key={x.t} onClick={() => nav(x.a)} className="tarjeta flex min-h-[86px] items-center gap-3 text-left transition-colors hover:border-gold">
                <Icono n={x.i} size={28} className="oro shrink-0" />
                <span><strong className="block font-display text-[17px]">{x.t}</strong><span className="text-[13px] text-mu">{x.s}</span></span>
              </button>
            ))}
          </div>
          {usuario.invitado && (
            <Link to="/perfil" className="tarjeta flex items-center gap-3 border-gold2 py-3">
              <Icono n="info" className="oro shrink-0" />
              <span className="flex-1 text-[14px]">Estás como invitado. <b className="oro">Creá tu cuenta</b> para no perder tu progreso.</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
