import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { leerBorrador } from '../lib/borrador';
import { reloj } from '../lib/logica';
import { Icono } from './Icono';
import { useApp } from './contexto';
import { useEffect, useState } from 'react';

const PESTANAS = [
  { a: '/', n: 'hoy', t: 'Inicio' },
  { a: '/entreno', n: 'entreno', t: 'Entreno' },
  { a: '/progreso', n: 'progreso', t: 'Progreso' },
  { a: '/perfil', n: 'perfil', t: 'Perfil' },
];

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${grande ? 'flex-col' : ''}`}>
      <Icono n="corona" size={grande ? 64 : 22} className="oro" />
      <span className={`marca oro ${grande ? 'text-[46px] leading-none' : 'text-[21px]'}`}
        style={grande ? { textShadow: '0 2px 3px #000, 0 0 20px rgba(182,122,42,.7)' } : undefined}>TITANUS</span>
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
        <span className="block text-[11px] font-bold uppercase tracking-[.12em]">Entrenamiento en curso</span>
        <span className="block font-semibold">{b.nombre}</span>
      </span>
      <span className="num text-[18px]">{reloj((ahora - b.inicio) / 1000)}</span>
    </button>
  );
}

/** Celular: barra de pestañas abajo. PC: barra lateral oscura de 248px */
export function Marco() {
  const { mensaje, repo } = useApp();
  const loc = useLocation();
  const enEntreno = loc.pathname.startsWith('/entrenar');
  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[248px] flex-col px-5 py-7 border-r border-ln2" style={{ background: 'var(--lateral)' }}>
        <Logo />
        <div className="divisor mt-5" />
        <nav className="mt-6 flex flex-col gap-1" aria-label="Menú">
          {PESTANAS.map((p) => (
            <NavLink key={p.a} to={p.a} end={p.a === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 h-11 text-[14px] font-semibold transition-colors ${isActive ? 'bg-[#1d180f] text-[#f2c55c]' : 'text-[#c9bda7] hover:text-[#f7f1e7]'}`}>
              <Icono n={p.n} size={20} />{p.t}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-[11px] uppercase tracking-[.14em] text-[#7d7462]">
          {repo.modo === 'prueba' ? 'Modo prueba' : 'Entrenamiento · Disciplina · Fuerza'}
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[480px] px-[17px] pb-seguro lg:max-w-[1180px] lg:px-10">
        {repo.modo === 'prueba' && (
          <div className="mt-3 rounded-full border border-ln2 px-4 py-1 text-center text-[11px] font-semibold uppercase tracking-[.12em] text-mu2 lg:mx-auto lg:max-w-[360px]">
            Modo prueba · datos inventados
          </div>
        )}
        <Outlet />
      </main>

      <EnCurso />

      {!enEntreno && (
        <nav aria-label="Pestañas" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-ln2"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))', background: 'linear-gradient(var(--sf), var(--nav))' }}>
          <div className="mx-auto flex max-w-[480px] pt-2">
            {PESTANAS.map((p) => (
              <NavLink key={p.a} to={p.a} end={p.a === '/'}
                className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-1 h-[54px] text-[12px] ${isActive ? 'oro font-semibold' : 'text-tx2'}`}>
                <Icono n={p.n} size={25} />{p.t}
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
