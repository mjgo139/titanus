import { Capacitor } from '@capacitor/core';

/** Dirección principal de StoaGym. La vieja (titanus-10398.web.app) sigue andando pero muestra este aviso. */
export const DIRECCION = 'https://stoagym.web.app';

/** En la dirección vieja, en el navegador (no en la APK), invita a pasar a la nueva */
export function AvisoMudanza({ className = '' }: { className?: string }) {
  if (Capacitor.isNativePlatform() || location.hostname !== 'titanus-10398.web.app') return null;
  return (
    <a href={DIRECCION + location.pathname + location.search} data-testid="aviso-mudanza"
      className={`ficha mx-auto h-auto w-fit max-w-full flex-wrap justify-center py-1.5 text-center ${className}`}>
      <span>StoaGym ahora está en</span><b className="oro">stoagym.web.app</b><span aria-hidden>›</span>
    </a>
  );
}
