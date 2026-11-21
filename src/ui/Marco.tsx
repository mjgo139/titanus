import { flushSync } from 'react-dom';
import { Outlet, useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { leerBorrador } from '../lib/borrador';
import { rango, reloj } from '../lib/logica';
import { estatuas } from './estatuas';
import { AvisoPrueba, BarraLateral, Emblema, Pestanas } from './familia';
import { AvisoMudanza } from './AvisoMudanza';
import { Icono } from './Icono';
import { useApp } from './contexto';
import { useEffect, useState } from 'react';

const PESTANAS_BASE = [
  { a: '/', n: 'hoy', t: 'Inicio' },
  { a: '/entreno', n: 'entreno', t: 'Entreno' },
  { a: '/progreso', n: 'progreso', t: 'Progreso' },
  { a: '/perfil', n: 'perfil', t: 'Perfil' },
];

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${grande ? 'flex-col' : ''}`}>
      <Emblema size={grande ? 92 : 34} />
      <span className={`marca oro ${grande ? 'text-[48px] leading-none' : 'text-[20px]'}`}
        style={grande ? { textShadow: 'var(--brillo-marca)' } : undefined}>StoaGym</span>
    </div>
  );
}

/** Barra fija con el entrenamiento en curso, como en Hevy */
function EnCurso() {
  const { usuario } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!usuario || loc.pathname.startsWith('/entrenar') || loc.pathname.startsWith('/resumen')) return null;
  const b = leerBorrador(usuario.uid);
  if (!b) return null;
  return (
    <button onClick={() => nav('/entrenar')} data-testid="en-curso"
      className="fixed left-3 right-3 lg:left-[calc(var(--ancho-lateral)+12px)] bottom-[78px] lg:bottom-4 z-40 mx-auto flex max-w-[456px] items-center gap-3 rounded-[12px] border border-goldh px-4 py-3 text-left"
      style={{ background: 'var(--oro-grad)', color: 'var(--on)', boxShadow: 'var(--sombra)' }}>
      <Icono n="entreno" />
      <span className="flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[.12em]">{b.preparando ? 'Armando entrenamiento' : 'Entrenamiento en curso'}</span>
        <span className="block font-semibold">{b.nombre}</span>
      </span>
      <span className="num text-[18px]">{b.preparando ? 'Seguir' : reloj((ahora - b.inicio) / 1000)}</span>
    </button>
  );
}

/** Navega con fundido cruzado si el navegador lo permite (View Transitions); si no, normal */
function navegarSuave(e: React.MouseEvent, nav: NavigateFunction, a: string) {
  const d = document as Document & { startViewTransition?: (f: () => void) => unknown };
  if (!d.startViewTransition || e.metaKey || e.ctrlKey || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  e.preventDefault();
  d.startViewTransition(() => flushSync(() => nav(a)));
}

/** La pestaña Entreno también queda marcada en sus pantallas hermanas (programas, rutinas) */
const activa = (a: string, isActive: boolean, ruta: string) =>
  isActive || (a === '/entreno' && /^\/(programas|rutinas)/.test(ruta)) || (a === '/clientes' && ruta.startsWith('/clientes'));

/** Celular: pestañas abajo. PC: barra lateral. Las dos son piezas de la familia (BarraLateral, Pestanas) */
export function Marco() {
  const { mensaje, repo, profesional, perfil } = useApp();
  // Los profesionales tienen una pestaña más: sus clientes
  const PESTANAS = profesional ? [...PESTANAS_BASE.slice(0, 3), { a: '/clientes', n: 'clientes', t: 'Clientes' }, PESTANAS_BASE[3]] : PESTANAS_BASE;
  const loc = useLocation();
  const nav = useNavigate();
  const enEntreno = loc.pathname.startsWith('/entrenar');
  const secciones = PESTANAS.map((p) => ({ href: p.a, icono: p.n, texto: p.t, activa: activa(p.a, p.a === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p.a), loc.pathname) }));
  // Clic en la barra lateral o en las pestañas: fundido cruzado si se puede; si no, navegación normal
  const ir = (e: React.MouseEvent<HTMLAnchorElement>, a: string) => {
    if (e.metaKey || e.ctrlKey) return;
    navegarSuave(e, nav, a);
    if (!e.defaultPrevented) { e.preventDefault(); nav(a); }
  };
  return (
    <div className="con-lateral min-h-screen">
      <BarraLateral emblema={<Emblema size={40} />} nombreApp="StoaGym" secciones={secciones} ir={ir}
        persona={perfil ? { avatar: <img src={estatuas(perfil.figura).avatar} alt="" />, nombre: perfil.nombre.split(' ')[0], detalle: rango(perfil.resumen.total).nombre, href: '/perfil' } : undefined}
        nota={repo.modo === 'prueba' ? 'Modo prueba' : 'Entrenamiento · Disciplina · Fuerza'} />

      <main className="mx-auto w-full max-w-[480px] px-[17px] pb-seguro lg:max-w-[1480px] lg:px-12 lg:pt-5 lg:pb-16">
        <AvisoMudanza className="mt-3 flex" />
        {repo.modo === 'prueba' && <AvisoPrueba />}
        <div key={loc.pathname} className="pagina"><Outlet /></div>
      </main>

      <EnCurso />

      {!enEntreno && <Pestanas secciones={secciones} ir={ir} />}

      {mensaje && (
        <div role="status" className="entrar fixed left-1/2 -translate-x-1/2 bottom-28 lg:bottom-8 z-[70] rounded-[12px] px-5 py-3 text-[15px] font-semibold shadow-lg"
          style={{ background: 'var(--oro-grad)', color: 'var(--on)' }}>
          {mensaje}
        </div>
      )}
    </div>
  );
}
