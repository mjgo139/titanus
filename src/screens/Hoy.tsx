import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import avatar from '../assets/avatar.webp';
import espalda from '../assets/espalda.webp';
import { leerBorrador } from '../lib/borrador';
import { fraseDelDia } from '../lib/frases';
import { rachaSemanas, rango, romano, rutinaDeHoy, semanaActual } from '../lib/logica';
import type { Rutina } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando } from '../ui/piezas';
import { useEmpezar } from './empezar';

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
  const fecha = new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' }).format(ahora).replace('.', '');

  return (
    <div className="pt-6">
      <div className="entrar flex items-center justify-between">
        <div className="flex items-center gap-[15px]">
          <img src={avatar} alt="" className="h-[65px] w-[65px] rounded-full border-2 border-gold object-cover" />
          <div>
            <h1 className="font-display text-[20px] font-semibold">Hola, {perfil.nombre.split(' ')[0]}</h1>
            <p className="oro mt-1 text-[14px]" data-testid="rango">{r.nombre} · Nivel {r.nivel}</p>
          </div>
        </div>
        <Link to="/perfil" aria-label="Ir a mi perfil" className="toque flex items-center justify-center oro"><Icono n="corona" size={24} /></Link>
      </div>

      <div className="divisor my-[17px]" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
      <div>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-[19px] font-semibold"><Icono n="calendario" size={20} className="oro" />Hoy, {fecha}</h2>
        <div className="text-right">
          <div className="text-[12px] text-mu flex items-center gap-1 justify-end"><Icono n="fuego" size={14} className="oro" />Racha</div>
          <strong className="num oro text-[20px]" data-testid="racha">{racha ? romano(racha) : '—'}</strong>
          <span className="text-[12px] text-mu"> {racha === 1 ? 'semana' : 'semanas'}</span>
        </div>
      </div>

      <figure className="hero mt-4 lg:py-7">
        <blockquote className="font-display text-[18px] italic leading-snug text-tx lg:text-[21px]">“{frase.texto}”</blockquote>
        <figcaption className="oro mt-2 text-[14px]">— {frase.autor}</figcaption>
      </figure>

      <h2 className="mt-6 mb-3 font-display text-[23px] font-semibold">Entrenamiento de hoy</h2>
      {!rutinas ? <Cargando /> : (
        <div className="tarjeta flex min-h-[165px] items-center gap-3 overflow-hidden p-0 lg:min-h-[240px]">
          <img src={espalda} alt="" className="h-[165px] w-[40%] object-cover lg:h-[240px]" />
          <div className="flex-1 py-3 pr-4">
            {deHoy ? <>
              <div className="etiqueta oro">Día {romano(idx)} · {perfil.resumen.total ? `Sesión ${perfil.resumen.total + 1}` : "Primera sesión"}</div>
              <h3 className="mt-1 font-display text-[21px] font-semibold leading-tight">{deHoy.nombre}</h3>
              <p className="mt-1 text-[14px] text-mu">{deHoy.ejercicios.length} ejercicios</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[14px]"><span className="oro">◷</span> {minutosEstimados(deHoy)} min</span>
                <button className="btn-redondo" aria-label={`Empezar ${deHoy.nombre}`} disabled={enCurso}
                  onClick={() => empezar.rutina(deHoy)}><Icono n="play" size={20} /></button>
              </div>
            </> : <>
              <div className="etiqueta oro">{rutinas.length ? 'Día libre' : 'Primer paso'}</div>
              <h3 className="mt-1 font-display text-[21px] font-semibold leading-tight">{rutinas.length ? 'Descanso o libre' : 'Armá tu rutina'}</h3>
              <p className="mt-1 text-[14px] text-mu">{rutinas.length ? 'Hoy no hay rutina asignada.' : 'Elegí ejercicios y días.'}</p>
              <div className="mt-3 flex items-center justify-between">
                <Link to={rutinas.length ? '/entreno' : '/rutinas/nueva'} className="text-[14px] oro font-semibold">{rutinas.length ? 'Ver rutinas' : 'Crear rutina'}</Link>
                <button className="btn-redondo" aria-label="Empezar entrenamiento libre" disabled={enCurso}
                  onClick={() => empezar.libre()}><Icono n="play" size={20} /></button>
              </div>
            </>}
          </div>
        </div>
      )}

      </div>
      <div className="lg:pt-1">
      <h2 className="mb-3 hidden font-display text-[23px] font-semibold lg:block">Tu semana</h2>
      <div className="tarjeta mt-3 flex justify-between px-3 py-3 lg:mt-0 lg:px-5 lg:py-4">
        {semana.map((d) => (
          <div key={d.fecha} className="flex flex-col items-center gap-1.5">
            <span className={`text-[11px] font-bold ${d.hoy ? 'oro' : 'text-mu2'}`}>{d.letra}</span>
            <span aria-label={d.hecho ? 'Entrenado' : 'Sin entrenar'}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] ${d.hecho ? 'border-goldh' : d.hoy ? 'border-gold oro' : 'border-ln2 text-mu2'}`}
              style={d.hecho ? { background: 'var(--oro-grad)', color: 'var(--on)' } : undefined}>
              {d.hecho ? <Icono n="check" size={15} /> : new Date(d.fecha).getDate()}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-[9px]">
        {[
          { a: '/entreno', i: 'entreno', t: 'Rutinas', s: `${rutinas?.length ?? 0} planificadas` },
          { a: '/progreso', i: 'progreso', t: 'Progreso', s: 'Tu evolución' },
          { a: '/progreso?v=records', i: 'trofeo', t: 'Récords', s: 'Tus mejores marcas' },
          { a: '/progreso?v=medidas', i: 'cuerpo', t: 'Medidas', s: 'Peso y cuerpo' },
        ].map((x) => (
          <button key={x.t} onClick={() => nav(x.a)} className="tarjeta flex min-h-[86px] items-center gap-3 text-left transition-colors hover:border-gold lg:min-h-[104px]">
            <Icono n={x.i} size={28} className="oro" />
            <span><strong className="block text-[17px] font-display">{x.t}</strong><span className="text-[13px] text-mu">{x.s}</span></span>
          </button>
        ))}
      </div>

      {usuario.invitado && (
        <Link to="/perfil" className="tarjeta mt-4 flex items-center gap-3 border-gold2">
          <Icono n="info" className="oro" />
          <span className="flex-1 text-[14px]">Estás como invitado. <b className="oro">Creá tu cuenta</b> para no perder tu progreso.</span>
        </Link>
      )}
      </div>
      </div>
    </div>
  );
}
