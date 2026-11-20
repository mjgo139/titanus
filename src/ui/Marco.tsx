import { flushSync } from 'react-dom';
import { Link, NavLink, Outlet, useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { leerBorrador } from '../lib/borrador';
import { rango, reloj } from '../lib/logica';
import { estatuas } from './estatuas';
import { Emblema } from './familia';
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
      <span className={`marca oro ${grande ? 'text-[46px] leading-none' : 'text-[21px]'}`}
        style={grande ? { textShadow: '0 2px 3px #000, 0 0 20px rgba(182,122,42,.7)' } : undefined}>StoaGym</span>
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
      className="fixed left-3 right-3 lg:left-[260px] bottom-[78px] lg:bottom-4 z-40 mx-auto flex max-w-[456px] items-center gap-3 rounded-[12px] border border-goldh px-4 py-3 text-left"
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

/** Celular: barra de pestañas abajo. PC: barra lateral oscura de 248px */
export function Marco() {
  const { mensaje, repo, profesional, perfil } = useApp();
  // Los profesionales tienen una pestaña más: sus clientes
  const PESTANAS = profesional ? [...PESTANAS_BASE.slice(0, 3), { a: '/clientes', n: 'clientes', t: 'Clientes' }, PESTANAS_BASE[3]] : PESTANAS_BASE;
  const loc = useLocation();
  const nav = useNavigate();
  const enEntreno = loc.pathname.startsWith('/entrenar');
  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="lateral-fija hidden lg:flex fixed inset-y-0 left-0 w-[248px] flex-col px-4 pt-7 pb-5 border-r border-ln2" style={{ background: 'var(--lateral)', ['--marfil' as string]: '#F3EDDF' }}>
        <div className="px-2.5"><Logo /></div>
        <div className="divisor mt-6" />
        <nav className="mt-6 flex flex-col gap-1" aria-label="Menú">
          {PESTANAS.map((p) => (
            <NavLink key={p.a} to={p.a} end={p.a === '/'} onClick={(e) => navegarSuave(e, nav, p.a)}
              className={({ isActive }) => `flex items-center gap-[14px] rounded-[10px] px-[14px] h-[46px] text-[14.5px] font-semibold transition-colors ${activa(p.a, isActive, loc.pathname) ? 'bg-[#1d180f] text-[#f2c55c]' : 'text-[#c9bda7] hover:text-[#f7f1e7]'}`}>
              <Icono n={p.n} size={22} />{p.t}
            </NavLink>
          ))}
        </nav>
        {/* Como en Stoica: la persona al pie de la barra lateral */}
        <div className="mt-auto">
          {perfil && (
            <Link to="/perfil" onClick={(e) => navegarSuave(e, nav, '/perfil')} data-testid="persona-lateral"
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-[14px] font-semibold text-[#c9bda7] transition-colors hover:bg-[#1d180f] hover:text-[#f7f1e7]">
              <img src={estatuas(perfil.figura).avatar} alt="" className="h-9 w-9 rounded-full border border-[#a66c16] object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{perfil.nombre.split(' ')[0]}</span>
                <span className="block truncate text-[11px] font-semibold uppercase tracking-[.12em] text-[#7d7462]">{rango(perfil.resumen.total).nombre}</span>
              </span>
            </Link>
          )}
          <div className="mt-3 px-2 text-[10.5px] uppercase tracking-[.14em] text-[#7d7462]">
            {repo.modo === 'prueba' ? 'Modo prueba' : 'Entrenamiento · Disciplina · Fuerza'}
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[480px] px-[17px] pb-seguro lg:max-w-[1480px] lg:px-12 lg:pt-5 lg:pb-16">
        {repo.modo === 'prueba' && (
          <div className="mt-3 rounded-full border border-ln2 px-4 py-1 text-center text-[11px] font-semibold uppercase tracking-[.12em] text-mu2 lg:mx-auto lg:max-w-[360px]">
            Modo prueba · datos inventados
          </div>
        )}
        <div key={loc.pathname} className="pagina"><Outlet /></div>
      </main>

      <EnCurso />

      {!enEntreno && (
        <nav aria-label="Pestañas" className="pestanas-fijas lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-ln2"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))', background: 'linear-gradient(var(--sf), var(--nav))' }}>
          <div className="mx-auto flex max-w-[480px] pt-2">
            {PESTANAS.map((p) => (
              <NavLink key={p.a} to={p.a} end={p.a === '/'} onClick={(e) => navegarSuave(e, nav, p.a)}
                className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-1 h-[54px] transition-colors duration-300 ${PESTANAS.length > 4 ? 'text-[11px]' : 'text-[12px]'} ${activa(p.a, isActive, loc.pathname) ? 'oro font-semibold' : 'text-tx2'}`}>
                <Icono n={p.n} size={PESTANAS.length > 4 ? 23 : 25} />{p.t}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {mensaje && (
        <div role="status" className="entrar fixed left-1/2 -translate-x-1/2 bottom-28 lg:bottom-8 z-[70] rounded-[12px] px-5 py-3 text-[14px] font-semibold shadow-lg"
          style={{ background: 'var(--oro-grad)', color: 'var(--on)' }}>
          {mensaje}
        </div>
      )}
    </div>
  );
}
