import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leerBorrador } from '../lib/borrador';
import { rachaSemanas, rango, romano, rutinaDeHoy, semanaActual } from '../lib/logica';
import type { Rutina } from '../lib/tipos';
import { estatuas, foco } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando } from '../ui/piezas';
import { useEmpezar } from './empezar';
import { AvisoHoy } from '../pro/AvisoHoy';
import { ProgramaEnCurso } from './Programas';
import { Ficha, Grupo, Laurel } from '../ui/familia';

export function minutosEstimados(r: Rutina): number {
  return Math.max(10, Math.round(r.ejercicios.reduce((t, e) => t + e.series * (e.descanso + 40), 0) / 60 / 5) * 5);
}

export default function Hoy() {
  const { repo, usuario, perfil } = useSesion();
  const empezar = useEmpezar();
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const ahora = Date.now();
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

  const fechaLarga = new Intl.DateTimeFormat('es-PY', { weekday: 'long', day: 'numeric', month: 'long' }).format(ahora);
  const hora = new Date(ahora).getHours();
  const saludo = hora < 12 ? 'Buen día' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const hechos = semana.filter((d) => d.hecho).length;
  const diaCorto = (f: string | number) => new Intl.DateTimeFormat('es-PY', { weekday: 'short' }).format(new Date(f)).replace('.', '').slice(0, 3);
  return (
    <div className="flex flex-col gap-4 pt-6 lg:gap-5">
      {/* Panel del día: igual que en Stoica (laurel de fondo, saludo y fichas), con la estatua de TITANUS */}
      <section className="panel-dia entrar" data-testid="panel-dia">
        <Laurel fondo size={300} />
        <div className="relative flex items-start gap-4">
          <img src={estatuas(perfil.figura).avatar} alt="" className="h-[64px] w-[64px] shrink-0 rounded-full border-2 border-gold object-cover lg:h-[84px] lg:w-[84px]" />
          <div className="min-w-0 flex-1">
            <div className="grupo">Panel del día</div>
            <h1 className="mt-1 font-display text-[26px] font-bold leading-tight lg:mt-2 lg:text-[40px] lg:leading-[44px]">{saludo}, {perfil.nombre.split(' ')[0]}</h1>
            <p className="oro mt-1 text-[14px] font-semibold" data-testid="rango">{r.nombre} · Nivel {r.nivel}</p>
          </div>
          <Link to="/perfil" aria-label="Ir a mi perfil" className="toque flex items-center justify-center oro"><Icono n="corona" size={24} /></Link>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 lg:mt-5">
          <Ficha><Icono n="calendario" size={15} className="oro" /><span className="first-letter:uppercase">{fechaLarga}</span></Ficha>
          <Link to="/progreso" className="ficha">
            <Icono n="fuego" size={15} className="oro" />
            {racha ? <>Racha · <strong className="num oro text-[15px]" data-testid="racha">{romano(racha)}</strong> {racha === 1 ? 'semana' : 'semanas'}</>
              : <span data-testid="racha">Sin racha aún</span>}
            <span aria-hidden className="text-mu">›</span>
          </Link>
          <Link to="/progreso" className="ficha"><Icono n="medalla" size={15} className="oro" />{perfil.resumen.total} entrenamientos <span aria-hidden className="text-mu">›</span></Link>
        </div>
      </section>

      <AvisoHoy />
      <ProgramaEnCurso />

      {/* Celular: una columna. PC: dos columnas con filas alineadas (título, contenido) */}
      <div className="mt-2 flex flex-col gap-3 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-x-6 lg:gap-y-3">
        <Grupo n={1} className="mt-4 lg:col-start-1 lg:row-start-1 lg:mt-0">Entrenamiento de hoy</Grupo>

        <div className="lg:col-start-1 lg:row-start-2">
          {!rutinas ? <Cargando forma="tarjeta" /> : (
            <div className="tarjeta flex h-full min-h-[165px] items-stretch gap-3 overflow-hidden p-0 lg:h-[212px]">
              <img src={estatuas(perfil.figura).espalda} alt="" style={{ objectPosition: foco(perfil.figura, 'espalda') }} className="h-full w-[40%] object-cover" />
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

        <Grupo n={2} className="mt-4 lg:col-start-2 lg:row-start-1 lg:mt-0">Tu semana</Grupo>

        {/* Semana igual que en Stoica: día, número en Playfair, hoy subrayado en oro y la cuenta abajo */}
        <div className="tarjeta flex flex-col px-3 py-4 lg:col-start-2 lg:row-start-2" data-testid="tu-semana">
          <div className="grid grid-cols-7 border-b border-ln2">
            {semana.map((d) => (
              <div key={d.fecha} className={`relative flex flex-col items-center gap-1 pb-3 ${d.hoy ? 'oro' : ''}`}
                aria-label={`${d.letra} ${new Date(d.fecha).getDate()}: ${d.hecho ? 'entrenado' : 'sin entrenar'}`}>
                <span className={`text-[11px] font-bold uppercase tracking-[.1em] ${d.hoy ? 'oro' : 'text-mu2'}`}>{diaCorto(d.fecha)}</span>
                <span className={`num text-[22px] leading-none ${d.hoy ? 'oro' : d.hecho ? '' : 'text-mu2'}`}>{new Date(d.fecha).getDate()}</span>
                <span className={`mt-0.5 flex h-4 items-center ${d.hecho ? '' : 'invisible'}`} style={{ color: 'var(--verde)' }}><Icono n="check" size={14} /></span>
                {d.hoy && <span className="absolute -bottom-px left-1/2 h-[2px] w-10 -translate-x-1/2 rounded-full" style={{ background: 'var(--gold)' }} />}
              </div>
            ))}
          </div>
          <div className="pt-4">
            <div className="flex items-baseline gap-2">
              <span className="num text-[34px] leading-none">{hechos}</span><span className="num text-[18px] text-mu">/7</span>
              <span className="ml-1 text-[14px] font-semibold text-mu">días entrenados</span>
            </div>
            <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-ln2">
              <div className="h-full rounded-full" style={{ width: `${(hechos / 7) * 100}%`, background: 'var(--oro-grad)', transition: 'width .5s var(--ease, ease)' }} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
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
