import { useState } from 'react';
import { Link, NavLink, Navigate, useParams } from 'react-router-dom';
import busto from '../assets/busto.webp';
import { buscarEjercicio } from '../lib/biblioteca';
import { NOMBRES_DIA } from '../lib/logica';
import { textoObjetivo } from '../lib/plantillas';
import {
  PROGRAMAS, buscarPrograma, claveSesion, proximaSesion, rutinaDeSesion, textoAcceso, totalSesiones, type Programa,
} from '../lib/programas';
import type { Figura } from '../lib/tipos';
import { useSesion } from '../ui/contexto';
import { estatuas, foco } from '../ui/estatuas';
import { Icono } from '../ui/Icono';
import { Encabezado, Hoja } from '../ui/piezas';
import { useEmpezar } from './empezar';

function imagenDe(p: Programa, figura: Figura | undefined): { src: string; pos: string } {
  if (p.imagen === 'busto') return { src: busto, pos: '50% 20%' };
  return { src: estatuas(figura)[p.imagen], pos: foco(figura, p.imagen) };
}

/** Sello de acceso: hoy todos dicen "Gratis"; mañana algunos podrán decir "Pro" */
function Sello({ p }: { p: Programa }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[.14em] ${p.acceso === 'pro' ? 'border-gold oro' : 'border-ln3 text-tx2'}`}
      data-testid="acceso-programa">{textoAcceso[p.acceso]}</span>
  );
}

function Avance({ hechas, total }: { hechas: number; total: number }) {
  return (
    <div>
      <div className="flex justify-between text-[12px] text-mu"><span>Sesión {Math.min(hechas + 1, total)} de {total}</span><span className="num oro">{Math.round((hechas / total) * 100)} %</span></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ln2">
        <div className="h-full rounded-full" style={{ width: `${(hechas / total) * 100}%`, background: 'var(--oro-grad)' }} />
      </div>
    </div>
  );
}

/** Tarjeta de un programa (en Entreno y en Inicio) */
export function TarjetaPrograma({ p }: { p: Programa }) {
  const { perfil } = useSesion();
  const img = imagenDe(p, perfil.figura);
  const activo = perfil.programa?.id === p.id ? perfil.programa : null;
  return (
    <Link to={`/programas/${p.id}`} className="hero relative flex h-[212px] w-full flex-col overflow-hidden p-4 text-left transition-colors hover:border-gold" data-testid="programa">
      <img src={img.src} alt="" className="mascara-izq absolute inset-y-0 right-0 h-full w-[52%] object-cover opacity-90" style={{ objectPosition: img.pos }} />
      <div className="relative flex w-[66%] flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="etiqueta oro">{p.categoria}</span><Sello p={p} />
        </div>
        <h3 className="marca mt-2 line-clamp-2 text-[20px] leading-tight">{p.nombre}</h3>
        <p className="mt-1 line-clamp-2 text-[14px] text-tx2">{p.lema}</p>
        <div className="mt-auto pt-3 text-[12px] text-mu">{p.semanas.length} semanas · {p.semanas[0].sesiones.length} días por semana</div>
      </div>
      {activo && <div className="relative mt-2"><Avance hechas={activo.hechas.length} total={totalSesiones(p)} /></div>}
    </Link>
  );
}

/** Selector de arriba en Entreno y Programas: dos páginas hermanas */
export function NavEntreno() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors ${isActive ? '' : 'text-mu hover:text-tx'}`;
  const oro = { background: 'var(--oro-grad)', color: 'var(--on)' };
  return (
    <nav aria-label="Secciones de entrenamiento" className="mx-auto mt-3 flex w-full max-w-[360px] rounded-full border border-ln2 p-[3px] lg:mx-0">
      <NavLink to="/entreno" end className={cls} style={({ isActive }) => (isActive ? oro : undefined)}><Icono n="entreno" size={16} />Mis entrenos</NavLink>
      <NavLink to="/programas" end className={cls} style={({ isActive }) => (isActive ? oro : undefined)}><Icono n="corona" size={16} />Programas</NavLink>
    </nav>
  );
}

/** Página de programas: todas las tarjetas del mismo tamaño */
export function PaginaProgramas() {
  const { perfil } = useSesion();
  const activo = perfil.programa ? buscarPrograma(perfil.programa.id) : undefined;
  const lista = activo ? [activo, ...PROGRAMAS.filter((p) => p.id !== activo.id)] : PROGRAMAS;
  return (
    <div className="pt-6">
      <h1 className="titulo text-center lg:text-left">Programas</h1>
      <NavEntreno />
      <p className="mt-4 text-center text-[14px] text-mu lg:text-left">Planes de varias semanas con un objetivo. Seguís uno a la vez y la app marca tu avance.</p>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((p) => <li key={p.id}><TarjetaPrograma p={p} /></li>)}
      </ul>
    </div>
  );
}

/** En Inicio: la próxima sesión del programa en curso */
export function ProgramaEnCurso() {
  const { perfil } = useSesion();
  const empezar = useEmpezar();
  const p = perfil.programa ? buscarPrograma(perfil.programa.id) : undefined;
  if (!p || !perfil.programa) return null;
  const sig = proximaSesion(p, perfil.programa.hechas);
  return (
    <div className="tarjeta mb-4 entrar" data-testid="programa-en-curso">
      <div className="flex items-start gap-3">
        <Icono n="corona" className="oro shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="etiqueta oro">Tu programa</div>
          <Link to={`/programas/${p.id}`} className="font-display text-[18px] font-semibold">{p.nombre}</Link>
          <p className="text-[13px] text-mu">{sig ? `Semana ${sig.semana + 1} · ${p.semanas[sig.semana].sesiones[sig.sesion].nombre}` : '¡Programa completo!'}</p>
        </div>
      </div>
      <div className="mt-3"><Avance hechas={perfil.programa.hechas.length} total={totalSesiones(p)} /></div>
      {sig && <button className="btn mt-3 h-11 w-full text-[15px]" onClick={() => empezar.rutina(rutinaDeSesion(p, sig.semana, sig.sesion))}><Icono n="play" size={14} />Empezar sesión</button>}
    </div>
  );
}

/** Ficha de un programa: qué vas a lograr, semanas y sesiones, empezar y seguir */
export default function VerPrograma() {
  const { id = '' } = useParams();
  const { perfil, cambiarPerfil, aviso } = useSesion();
  const empezar = useEmpezar();
  const [cambiar, setCambiar] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);
  const p = buscarPrograma(id);
  if (!p) return <Navigate to="/entreno" replace />;
  const img = imagenDe(p, perfil.figura);
  const activo = perfil.programa?.id === p.id ? perfil.programa : null;
  const otro = perfil.programa && !activo ? buscarPrograma(perfil.programa.id) : undefined;
  const hechas = activo?.hechas ?? [];
  const sig = activo ? proximaSesion(p, hechas) : null;
  const semanaAbierta = abierta ?? sig?.semana ?? 0;

  async function comenzar() {
    await cambiarPerfil({ programa: { id: p!.id, inicio: Date.now(), hechas: [] } });
    setCambiar(false);
    aviso(`Empezaste «${p!.nombre}»`);
  }

  return (
    <div>
      <Encabezado atras="/programas" etiqueta={`Programa · ${p.categoria}`} titulo={p.nombre} linea={p.lema} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <section className="flex flex-col gap-4">
          <div className="hero relative min-h-[220px] overflow-hidden p-5 text-left">
            <img src={img.src} alt="" className="mascara-izq absolute inset-y-0 right-0 h-full w-[60%] object-cover" style={{ objectPosition: img.pos }} />
            <div className="relative w-[60%]">
              <Sello p={p} />
              <div className="mt-3 flex flex-col gap-1 text-[14px] text-tx2">
                <span><b className="num oro text-[20px]">{p.semanas.length}</b> semanas</span>
                <span><b className="num oro text-[20px]">{p.semanas[0].sesiones.length}</b> sesiones por semana</span>
                <span>{p.nivel}</span>
                <span className="text-[12px] text-mu">Sugerido: {p.dias.map((d) => NOMBRES_DIA[d]).join(' · ')}</span>
              </div>
            </div>
          </div>

          {activo ? (
            <div className="tarjeta" data-testid="avance-programa">
              <Avance hechas={hechas.length} total={totalSesiones(p)} />
              {sig ? (
                <button className="btn mt-4 w-full" onClick={() => empezar.rutina(rutinaDeSesion(p, sig.semana, sig.sesion))}>
                  <Icono n="play" size={16} />Empezar: semana {sig.semana + 1} · {p.semanas[sig.semana].sesiones[sig.sesion].nombre}
                </button>
              ) : <p className="mt-3 text-center font-display text-[18px] oro">¡Completaste el programa!</p>}
              <button className="mt-3 w-full p-2 text-[13px] font-semibold text-miss"
                onClick={async () => { await cambiarPerfil({ programa: null }); aviso('Dejaste el programa'); }}>Dejar el programa</button>
            </div>
          ) : (
            <button className="btn h-14 w-full text-[17px]" onClick={() => (otro ? setCambiar(true) : comenzar())}>
              <Icono n="corona" size={18} />Empezar programa
            </button>
          )}

          <div className="tarjeta">
            <div className="etiqueta oro">Qué vas a lograr</div>
            <ul className="mt-2 flex flex-col gap-2">
              {p.logros.map((l) => <li key={l} className="flex gap-2 text-[15px]"><Icono n="check" size={18} className="oro mt-0.5 shrink-0" />{l}</li>)}
            </ul>
            <p className="mt-3 text-[14px] text-mu">{p.descripcion}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-[22px] font-semibold">Semanas</h2>
          <ul className="flex flex-col gap-2">
            {p.semanas.map((w, i) => {
              const ab = semanaAbierta === i;
              const listas = w.sesiones.filter((_, k) => hechas.includes(claveSesion(i, k))).length;
              return (
                <li key={i} className={`tarjeta py-3 ${sig?.semana === i ? 'border-gold2' : ''}`} data-testid="semana-programa">
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => setAbierta(ab ? -1 : i)} aria-expanded={ab}>
                    <span className="num w-9 shrink-0 text-center text-[20px] oro">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i] ?? i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{w.titulo}</span>
                      <span className="text-[12px] text-mu">{listas}/{w.sesiones.length} sesiones{w.nota ? ` · ${w.nota}` : ''}</span>
                    </span>
                    {listas === w.sesiones.length && <span className="shrink-0" style={{ color: 'var(--verde)' }}><Icono n="check" size={18} /></span>}
                    <Icono n={ab ? 'arriba' : 'abajo'} size={18} className="shrink-0 text-mu" />
                  </button>
                  {ab && (
                    <ul className="mt-3 flex flex-col gap-2">
                      {w.sesiones.map((s, k) => {
                        const hecha = hechas.includes(claveSesion(i, k));
                        const toca = sig?.semana === i && sig.sesion === k;
                        return (
                          <li key={k} className={`rounded-[12px] border p-3 ${toca ? 'border-gold' : hecha ? 'serie-hecha border-transparent' : 'border-ln2'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <b className={hecha ? '' : 'oro'}>Sesión {k + 1} · {s.nombre}</b>
                              {hecha ? <span className="text-[12px]" style={{ color: 'var(--verde)' }}>Hecha</span> : null}
                            </div>
                            <ul className="mt-1 text-[13px] text-mu">
                              {s.ejercicios.map((e, x) => (
                                <li key={x} className="flex justify-between gap-2"><span className="truncate">{buscarEjercicio(e.ejercicioId, [])?.nombre}</span>
                                  <span className="num shrink-0 text-tx2">{textoObjetivo(e)}{e.nota ? ` ${e.nota}` : ''}</span></li>
                              ))}
                            </ul>
                            {activo && !hecha && (
                              <button className="btn-sec mt-2 h-9 w-full text-[13px]" onClick={() => empezar.rutina(rutinaDeSesion(p, i, k))}>
                                <Icono n="play" size={13} />Hacer esta sesión
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Hoja abierta={cambiar} alCerrar={() => setCambiar(false)} etiqueta="Cambiar de programa" titulo={`¿Dejar «${otro?.nombre ?? ''}»?`}>
        <p className="text-mu">Solo podés seguir un programa a la vez. Tus entrenamientos quedan guardados igual.</p>
        <div className="mt-5 flex flex-col gap-3">
          <button className="btn" onClick={comenzar}>Sí, empezar «{p.nombre}»</button>
          <button className="btn-sec" onClick={() => setCambiar(false)}>Cancelar</button>
        </div>
      </Hoja>
    </div>
  );
}
