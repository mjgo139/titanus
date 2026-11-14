import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-700.css';
import './index.css';
import App from './App';
import type { Repo } from './data/repo';
import { ProveedorApp } from './ui/contexto';

/** Modo prueba: al armar con --mode demo, o abriendo la web con ?prueba=1 */
function esModoPrueba(): boolean {
  if (import.meta.env.VITE_DEMO === '1') return true;
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('prueba') === '1') sessionStorage.setItem('titanus-prueba', '1');
    if (q.get('prueba') === '0') sessionStorage.removeItem('titanus-prueba');
    return sessionStorage.getItem('titanus-prueba') === '1';
  } catch {
    return false;
  }
}

async function crearRepo(): Promise<Repo> {
  if (esModoPrueba()) {
    const { RepoMemoria } = await import('./data/memoria');
    return new RepoMemoria();
  }
  const { RepoFirebase } = await import('./data/firebase');
  return new RepoFirebase(Capacitor.isNativePlatform());
}

/** Service worker: la versión nueva se activa sola y la página se recarga para que llegue siempre */
async function registrarSW() {
  if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const { registerSW } = await import('virtual:pwa-register');
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return;
    recargando = true;
    location.reload();
  });
  registerSW({
    immediate: true,
    // Buscar versión nueva cada 30 minutos y al volver a la app
    onRegisteredSW(_url, r) {
      if (r) setInterval(() => void r.update(), 30 * 60_000);
    },
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then((r) => r?.update());
  });
}

crearRepo().then((repo) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ProveedorApp repo={repo}><App /></ProveedorApp>
    </StrictMode>,
  );
  void registrarSW();
});
