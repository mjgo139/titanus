import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icono } from './Icono';
import { useApp } from './contexto';

const PESTANAS = [
  { a: '/', n: 'hoy', t: 'Hoy' },
  { a: '/rutinas', n: 'rutinas', t: 'Rutinas' },
  { a: '/progreso', n: 'progreso', t: 'Progreso' },
  { a: '/perfil', n: 'perfil', t: 'Perfil' },
];

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icono n="laurel" className={claro ? 'text-[#C9A66B]' : 'text-gold'} />
      <span className={`font-display font-bold text-[22px] tracking-[.14em] ${claro ? 'text-[#F3EDDF]' : 'text-tx'}`}>TITANUS</span>
    </div>
  );
}

/** Celular: barra de pestañas abajo. PC: barra lateral oscura de 248px */
export function Marco() {
  const { mensaje, repo } = useApp();
  const loc = useLocation();
  const enEntreno = loc.pathname.startsWith('/entrenar');
  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[248px] flex-col px-5 py-7" style={{ background: 'var(--lateral)' }}>
        <Logo claro />
        <nav className="mt-10 flex flex-col gap-1" aria-label="Menú">
          {PESTANAS.map((p) => (
            <NavLink key={p.a} to={p.a} end={p.a === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 h-11 text-[14px] font-semibold transition-colors ${isActive ? 'bg-[#2a2419] text-[#C9A66B]' : 'text-[#BDB5A4] hover:text-[#F3EDDF]'}`}>
              <Icono n={p.n} size={20} />{p.t}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-[11px] uppercase tracking-[.14em] text-[#7d7462]">
          {repo.modo === 'prueba' ? 'Modo prueba' : 'Disciplina diaria'}
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[480px] px-5 pb-seguro">
        {repo.modo === 'prueba' && (
          <div className="mt-3 rounded-full border border-ln bg-sf px-4 py-1.5 text-center text-[12px] font-semibold text-mu lg:hidden">
            MODO PRUEBA · datos inventados
          </div>
        )}
        <Outlet />
      </main>

      {!enEntreno && (
        <nav aria-label="Pestañas" className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-ln bg-nav"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto flex max-w-[480px]">
            {PESTANAS.map((p) => (
              <NavLink key={p.a} to={p.a} end={p.a === '/'}
                className={({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-1 h-[64px] text-[11px] font-bold uppercase tracking-[.1em] ${isActive ? 'text-gold' : 'text-mu2'}`}>
                <Icono n={p.n} size={22} />{p.t}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {mensaje && (
        <div role="status" className="entrar fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 z-[70] rounded-full bg-tx text-bg px-5 py-3 text-[14px] font-semibold shadow-lg">
          {mensaje}
        </div>
      )}
    </div>
  );
}
