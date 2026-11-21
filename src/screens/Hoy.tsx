import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { actualizarWidgets, fechaCorta } from '../lib/widget';
import { buscarPrograma, programasActivos, proximaSesion, totalSesiones } from '../lib/programas';
import { leerBorrador } from '../lib/borrador';
import { hechasHoy, rachaSemanas, rango, romano, rutinaDeHoy, rutinasDeHoy, semanaActual, fechaLocal } from '../lib/logica';
import type { Rutina } from '../lib/tipos';
import { estatuas, foco } from '../ui/estatuas';
import { useSesion } from '../ui/contexto';
import { Icono } from '../ui/Icono';
import { Cargando } from '../ui/piezas';
import { useEmpezar } from './empezar';
import { AvisoHoy } from '../pro/AvisoHoy';
import { ProgramaEnCurso } from './Programas';
import { Grupo, PanelDia, TuSemana } from '../ui/familia';
import { fraseDelDia } from '../lib/frases';

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
  // Todas las rutinas del día, en orden; la tarjeta muestra la próxima pendiente
  const delDia = rutinas ? rutinasDeHoy(rutinas, ahora) : [];
  const listasHoy = hechasHoy(perfil, ahora);
  const deHoy = delDia.find((x) => !listasHoy.includes(x.id));
  const todoHecho = delDia.length > 0 && !deHoy;
  const nHoy = deHoy ? delDia.indexOf(deHoy) + 1 : 0;
  const idx = deHoy && rutinas ? [...rutinas].sort((a, b) => a.orden - b.orden).indexOf(deHoy) + 1 : 0;
  const proxima = rutinas && !deHoy
    ? [1, 2, 3, 4, 5, 6].map((k) => ({ k, r: rutinaDeHoy(rutinas, ahora + k * 86_400_000) })).find((x) => x.r)
    : undefined;
  const proximaTexto = proxima?.r ? `Lo próximo: ${proxima.r.nombre}, ${proxima.k === 1 ? 'mañana' : `en ${proxima.k} días`}.` : 'Hoy no hay rutina asignada.';


  // Widgets de Android: les pasamos lo que muestra Inicio (solo en la APK; si nada cambió no se manda)
  useEffect(() => {
    if (!rutinas) return;
    const progs = programasActivos(perfil).map((a) => {
      const p = buscarPrograma(a.id);
      if (!p) return null;
      const sig = proximaSesion(p, a.hechas);
      return { id: p.id, nombre: p.nombre, hechas: a.hechas.length, total: totalSesiones(p), siguiente: sig ? p.semanas[sig.semana].sesiones[sig.sesion].nombre : '¡Completo!' };
    }).filter(Boolean);
    const restan = delDia.filter((x) => !listasHoy.includes(x.id)).length - 1;
    const prox = proxima?.r;
    actualizarWidgets({
      racha, rango: `${r.nombre} · Nivel ${r.nivel}`,
      fechas: dias.filter((d) => d > ahora - 15 * 86_400_000).map((d) => fechaCorta(d)).join(','),
      esHoy: !!deHoy,
      etiqueta: deHoy ? (delDia.length > 1 ? `HOY TOCA · ${nHoy} DE ${delDia.length}` : 'HOY TOCA') : todoHecho ? 'HOY · CUMPLIDO' : prox ? 'LO PRÓXIMO' : 'ENTRENAMIENTO',
      entreno: deHoy?.nombre ?? (todoHecho ? 'Entrenamiento cumplido' : prox?.nombre ?? ''),
      entrenoDetalle: deHoy
        ? `${deHoy.ejercicios.length} ejercicios · ${minutosEstimados(deHoy)} min${restan > 0 ? ` · +${restan} más hoy` : ''}`
        : todoHecho ? `${delDia.length} de ${delDia.length} ${delDia.length === 1 ? 'rutina hecha' : 'rutinas hechas'} ✓`
          : prox ? (proxima!.k === 1 ? 'Mañana' : `En ${proxima!.k} días`) : '',
      boton: deHoy ? 'Entrenar' : 'Abrir', rutaBoton: deHoy ? '/?empezar=hoy' : '/entreno',
      programas: JSON.stringify(progs),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutinas, perfil, racha]);

  // Desde el widget "Entrenamiento de hoy": /?empezar=hoy arranca la rutina del día
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('empezar') !== 'hoy' || !rutinas) return;
    setParams({}, { replace: true });
    if (deHoy && !enCurso) empezar.rutina(deHoy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, rutinas]);

  return (
    <div className="flex flex-col gap-4 pt-6 lg:gap-5">
      {/* Panel del día de la familia, con la estatua de StoaGym */}
      <div className="entrar">
        <PanelDia nombre={perfil.nombre.split(' ')[0]} ahora={ahora}
          avatar={<img src={estatuas(perfil.figura).avatar} alt="" />}
          frase={fraseDelDia(ahora)}
          fichas={<>
            <Link to="/progreso" className="ficha">
              <Icono n="fuego" size={16} className="oro" />
              {racha ? <>Racha · <strong className="num oro text-[15px]" data-testid="racha">{romano(racha)}</strong> {racha === 1 ? 'semana' : 'semanas'}</>
                : <span data-testid="racha">Sin racha aún</span>}
              <span aria-hidden className="ir">›</span>
            </Link>
            <Link to="/progreso" className="ficha"><Icono n="medalla" size={16} className="oro" />{perfil.resumen.total} entrenamientos <span aria-hidden className="ir">›</span></Link>
          </>} />
      </div>

      <AvisoHoy />
      <ProgramaEnCurso />

      {/* Celular: una columna. PC: dos columnas con filas alineadas (título, contenido) */}
      <div className="mt-2 flex flex-col gap-3 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-x-6 lg:gap-y-3">
        <Grupo n={1} className="mt-4 lg:col-start-1 lg:row-start-1 lg:mt-0">Entrenamiento de hoy</Grupo>

        <div className="lg:col-start-1 lg:row-start-2">
          {!rutinas ? <Cargando forma="tarjeta" /> : (
            <div className="tarjeta flex h-full min-h-[165px] items-stretch gap-3 overflow-hidden p-0 lg:h-[212px]" data-testid="tarjeta-hoy">
              <img src={estatuas(perfil.figura).espalda} alt="" style={{ objectPosition: foco(perfil.figura, 'espalda') }} className="h-full w-[40%] object-cover" />
              <div className="flex flex-1 flex-col justify-center py-4 pr-4">
                {deHoy ? <>
                  <div className="etiqueta oro">{delDia.length > 1 ? `Hoy ${nHoy} de ${delDia.length}` : `Día ${romano(idx)}`} · {perfil.resumen.total ? `Sesión ${perfil.resumen.total + 1}` : 'Primera sesión'}</div>
                  <h3 className="mt-1 font-display text-[20px] font-semibold leading-tight">{deHoy.nombre}</h3>
                  <p className="mt-1 text-[13.5px] text-mu">{deHoy.ejercicios.length} ejercicios</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[15px]"><Icono n="reloj" size={16} className="oro" />{minutosEstimados(deHoy)} min</span>
                    <button className="btn-redondo" aria-label={`Empezar ${deHoy.nombre}`} disabled={enCurso}
                      onClick={() => empezar.rutina(deHoy)}><Icono n="play" size={20} /></button>
                  </div>
                </> : todoHecho ? <>
                  <div className="etiqueta" style={{ color: 'var(--verde)' }}>Hoy · cumplido</div>
                  <h3 className="mt-1 font-display text-[20px] font-semibold leading-tight">Entrenamiento cumplido</h3>
                  <p className="mt-1 text-[13.5px] text-mu">{delDia.length === 1 ? `${delDia[0].nombre} hecha.` : `Las ${delDia.length} rutinas de hoy, hechas.`} {proxima?.r ? proximaTexto : ''}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[15px]" style={{ color: 'var(--verde)' }}><Icono n="check" size={16} />Bien hecho</span>
                    <button className="btn-redondo" aria-label="Empezar entrenamiento libre" disabled={enCurso}
                      onClick={() => empezar.libre()}><Icono n="play" size={20} /></button>
                  </div>
                </> : <>
                  <div className="etiqueta oro">{rutinas.length ? 'Día libre' : 'Primer paso'}</div>
                  <h3 className="mt-1 font-display text-[20px] font-semibold leading-tight">{rutinas.length ? 'Descanso o libre' : 'Armá tu rutina'}</h3>
                  <p className="mt-1 text-[13.5px] text-mu">{rutinas.length ? proximaTexto : 'Elegí ejercicios y días.'}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link to={rutinas.length ? '/entreno' : '/rutinas/nueva'} className="text-[15px] oro font-semibold">{rutinas.length ? 'Ver rutinas' : 'Crear rutina'}</Link>
                    <button className="btn-redondo" aria-label="Empezar entrenamiento libre" disabled={enCurso}
                      onClick={() => empezar.libre()}><Icono n="play" size={20} /></button>
                  </div>
                </>}
              </div>
            </div>
          )}
        </div>

        {delDia.length > 1 && (
          <ul className="tarjeta flex flex-col gap-1 px-3 py-2 lg:col-start-1 lg:row-start-3" data-testid="rutinas-de-hoy" aria-label="Rutinas de hoy">
            {delDia.map((x, i) => {
              const hecha = listasHoy.includes(x.id);
              const ahoraToca = deHoy?.id === x.id;
              return (
                <li key={x.id} className={`flex items-center gap-3 rounded-[12px] px-2 py-2 ${ahoraToca ? 'bg-sf2' : ''}`}>
                  <span className={`num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13.5px] ${hecha ? '' : ahoraToca ? 'border-gold oro' : 'border-ln3 text-mu'}`}
                    style={hecha ? { background: 'var(--verde)', borderColor: 'var(--verde)', color: 'var(--sobre-verde)' } : undefined}>
                    {hecha ? <Icono n="check" size={16} /> : romano(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-semibold ${hecha ? 'text-mu' : ''}`}>{x.nombre}</span>
                    <span className="text-[12.5px] text-mu">{hecha ? 'Hecha hoy' : `${x.ejercicios.length} ejercicios · ${minutosEstimados(x)} min${ahoraToca ? ' · ahora' : ''}`}</span>
                  </span>
                  {!hecha && <button className="btn-sec h-9 px-3 text-[13.5px]" disabled={enCurso} aria-label={`Hacer ${x.nombre}`}
                    onClick={() => empezar.rutina(x)}><Icono n="play" size={16} />Hacer</button>}
                </li>
              );
            })}
          </ul>
        )}

        <Grupo n={2} className="mt-4 lg:col-start-2 lg:row-start-1 lg:mt-0">Tu semana</Grupo>

        {/* Semana igual que en Stoica: día, número en Playfair, hoy subrayado en oro y la cuenta abajo */}
        <TuSemana className="lg:col-start-2 lg:row-start-2 lg:h-[212px]" texto="días entrenados"
          dias={semana.map((d) => ({ fecha: fechaLocal(d.fecha), hecho: d.hecho, hoy: d.hoy }))} />

        <div className="lg:col-span-2">
          {usuario.invitado && (
            <Link to="/perfil" className="tarjeta flex items-center gap-3 border-gold2 py-3">
              <Icono n="info" className="oro shrink-0" />
              <span className="flex-1 text-[15px]">Estás como invitado. <b className="oro">Creá tu cuenta</b> para no perder tu progreso.</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
