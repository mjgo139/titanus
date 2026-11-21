import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cinzel/latin-700.css';
import '@fontsource/playfair-display/latin-600.css';
import '@fontsource/playfair-display/latin-700.css';
import '../familia/familia.css';
import './index.css';
import App from './App';
import type { Repo } from './data/repo';
import { ProveedorApp } from './ui/contexto';
import { guardarInvitacionDeLaUrl } from './pro/MiProfesional';

// Enlace de invitación de un entrenador (?codigo=TIT-XXXX): se guarda para después de ingresar
guardarInvitacionDeLaUrl();

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
  // En la APK la app se abre desde la web publicada: también usa el service worker para funcionar sin conexión
  const desdeLaWeb = location.protocol === 'https:' && !location.hostname.includes('localhost');
  if ((Capacitor.isNativePlatform() && !desdeLaWeb) || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
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
  quitarInicio();
  void registrarSW();
});

/** Desvanece la pantalla de inicio (emblema sobre negro) cuando la app ya se dibujó; dura al menos 0,8 s para que no parpadee */
function quitarInicio() {
  const el = document.getElementById('inicio');
  if (!el) return;
  const espera = Math.max(0, 800 - performance.now());
  setTimeout(() => requestAnimationFrame(() => {
    el.classList.add('fuera');
    setTimeout(() => el.remove(), 400);
  }), espera);
}
