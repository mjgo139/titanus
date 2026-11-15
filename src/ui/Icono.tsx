/** Íconos de línea fina con puntas redondeadas (trazo 1.8) */
const P: Record<string, string> = {
  hoy: 'm2 11 10-8 10 8M5 10v11h14V10M9 21v-7h6v7',
  entreno: 'M2 9v6m3-9v12m3-8v4m0-2h8m0-2v4m3-8v12m3-9v6',
  rutinas: 'M5 6h14M5 12h14M5 18h9',
  progreso: 'M3 20h4v-7H3zm7 0h4V9h-4zm7 0h4V3h-4z',
  perfil: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 22v-3c0-6 18-6 18 0v3',
  corona: 'M3 18h18M4 18 3 7l5 4 4-6 4 6 5-4-1 11',
  puntos: 'M12 5h.01M12 12h.01M12 19h.01',
  nota: 'M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5',
  repetir: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  trofeo: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9 17h6',
  guardar: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  mas: 'M12 5v14M5 12h14',
  atras: 'M15 5l-7 7 7 7',
  cerrar: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5 10 17l9-10',
  pesa: 'M3 12h18M6.5 8v8M17.5 8v8M4.5 9.5v5M19.5 9.5v5',
  reloj: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4l2.5 2M10 3h4',
  fuego: 'M12 21c-3.6 0-6-2.4-6-5.6 0-3.6 3-5.4 3.4-9.4 2.4 1.6 3.6 3.6 3.6 5.4.8-.6 1.4-1.6 1.6-2.8 1.8 1.4 3.4 3.6 3.4 6.8 0 3.2-2.4 5.6-6 5.6Z',
  basura: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  editar: 'M4 20h4L19 9l-4-4L4 16v4Z',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  medalla: 'M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8.5 9.8 6 3h4l2 4 2-4h4l-2.5 6.8',
  laurel: 'M8 20c-3-3-4-8-2-13M16 20c3-3 4-8 2-13M6.5 12c-2 0-3.5 1-4 3M7 16c-2 .5-3 2-3 3.5M17.5 12c2 0 3.5 1 4 3M17 16c2 .5 3 2 3 3.5M6.3 8c-1.8-.4-3.3.3-4 1.6M17.7 8c1.8-.4 3.3.3 4 1.6',
  cuerpo: 'M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 9h12M12 9v6M9 22l3-7 3 7',
  campana: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 21h4',
  descargar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  salir: 'M14 5h4v14h-4M10 12h9M7 9l-3 3 3 3',
  sol: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  luna: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  arriba: 'M6 15l6-6 6 6',
  abajo: 'M6 9l6 6 6-6',
  play: 'M8 5v14l11-7L8 5Z',
  pausa: 'M9 5v14M15 5v14',
  clientes: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2c0-4.5 14-4.5 14 0v2M16 3.5a4 4 0 0 1 0 7.5M18 14c2.4.6 4 2 4 4.5V21',
  mensaje: 'M4 5h16v11H9l-5 4V5ZM8 9h8M8 12h5',
  objetivo: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01',
  escudo: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z',
  enlace: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  copiar: 'M8 8h11v12H8zM5 16V4h11',
  alerta: 'M12 3 2 20h20L12 3ZM12 10v4M12 17h.01',
  google: '',
};

export function Icono({ n, size = 22, className = '' }: { n: keyof typeof P | string; size?: number; className?: string }) {
  if (n === 'google') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
        <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
        <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
        <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[n] ?? ''} />
    </svg>
  );
}
