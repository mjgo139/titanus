import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Repo, Usuario } from '../data/repo';
import type { Perfil, Tema } from '../lib/tipos';

interface Ctx {
  repo: Repo;
  usuario: Usuario | null;
  perfil: Perfil | null;
  admin: boolean;
  cargando: boolean;
  cambiarPerfil: (c: Partial<Perfil>) => Promise<void>;
  recargarPerfil: () => Promise<void>;
  aviso: (texto: string) => void;
  mensaje: string | null;
}

const C = createContext<Ctx | null>(null);

export function aplicarTema(t: Tema) {
  try { localStorage.setItem('titanus-tema', t); } catch { /* sin almacenamiento */ }
  const oscuro = t === 'oscuro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = oscuro ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#090909' : '#ECE6DB');
}

export function ProveedorApp({ repo, children }: { repo: Repo; children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [admin, setAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const previo = useRef<Usuario | null>(null);
  useEffect(() => repo.escucharSesion(async (u) => {
    const antes = previo.current;
    previo.current = u;
    setUsuario(u);
    if (!u) {
      setPerfil(null);
      setAdmin(false);
      setCargando(false);
      return;
    }
    // Renovación del token sin cambios: no hace falta volver a leer
    if (antes && antes.uid === u.uid && antes.invitado === u.invitado) return;
    const mismo = antes?.uid === u.uid;
    if (!mismo) setCargando(true);
    try {
      const [p, a] = await Promise.all([repo.leerPerfil(u), repo.esAdmin(u.uid)]);
      setPerfil(p);
      setAdmin(a);
      aplicarTema(p.tema);
    } finally {
      setCargando(false);
    }
  }), [repo]);

  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const f = () => perfil?.tema === 'sistema' && aplicarTema('sistema');
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [perfil?.tema]);

  const cambiarPerfil = useCallback(async (c: Partial<Perfil>) => {
    if (!usuario) return;
    setPerfil((p) => (p ? { ...p, ...c } : p));
    if (c.tema) aplicarTema(c.tema);
    await repo.guardarPerfil(usuario.uid, c);
  }, [repo, usuario]);

  const recargarPerfil = useCallback(async () => {
    if (usuario) setPerfil(await repo.leerPerfil(usuario));
  }, [repo, usuario]);

  const aviso = useCallback((t: string) => {
    setMensaje(t);
    window.setTimeout(() => setMensaje((m) => (m === t ? null : m)), 2600);
  }, []);

  const v = useMemo(() => ({ repo, usuario, perfil, admin, cargando, cambiarPerfil, recargarPerfil, aviso, mensaje }),
    [repo, usuario, perfil, admin, cargando, cambiarPerfil, recargarPerfil, aviso, mensaje]);
  return <C.Provider value={v}>{children}</C.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('Falta ProveedorApp');
  return c;
}

/** Para pantallas que solo existen con sesión iniciada */
export function useSesion() {
  const c = useApp();
  if (!c.usuario || !c.perfil) throw new Error('Sin sesión');
  return { ...c, usuario: c.usuario, perfil: c.perfil };
}
