import type { Objetivo, Vinculo } from './tipos';

const DIA = 86_400_000;
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I para que no se confundan

/** Código corto y fácil de dictar: TIT-4K9Q */
export function codigoNuevo(prefijo = 'STG', azar: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += LETRAS[Math.floor(azar() * LETRAS.length)];
  return `${prefijo}-${s}`;
}

/** Acepta "tit 4k9q", "TIT4K9Q" o "tit-4k9q" */
export function normalizarCodigo(t: string): string {
  const s = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length < 5) return s;
  return `${s.slice(0, s.length - 4)}-${s.slice(-4)}`;
}

export const idVinculo = (profesionalId: string, clienteId: string) => `${profesionalId}_${clienteId}`;

/** Un día con actividad: fecha en ms o texto AAAA-MM-DD. Devuelve el inicio de ese día. */
export type Dia = number | string;
function inicioDe(d: Dia): number {
  if (typeof d === 'string') {
    const [a, m, x] = d.split('-').map(Number);
    return new Date(a, m - 1, x).getTime();
  }
  const f = new Date(d);
  return new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
}

/** Días desde la última actividad (undefined si nunca registró nada) */
export function diasSinActividad(dias: Dia[], ahora: number): number | undefined {
  if (!dias.length) return undefined;
  const ultimo = Math.max(...dias.map(inicioDe));
  return Math.max(0, Math.round((inicioDe(ahora) - ultimo) / DIA));
}

export type EstadoCliente = 'nuevo' | 'al-dia' | 'atencion' | 'inactivo';

/** Al día: menos de 4 días. Atención: 4 a 7. Inactivo: más de 7. Nuevo: nunca registró. */
export function estadoCliente(dias: Dia[], ahora: number): EstadoCliente {
  const n = diasSinActividad(dias, ahora);
  if (n === undefined) return 'nuevo';
  if (n < 4) return 'al-dia';
  if (n <= 7) return 'atencion';
  return 'inactivo';
}

export const TEXTO_ESTADO: Record<EstadoCliente, string> = {
  nuevo: 'Sin registros', 'al-dia': 'Al día', atencion: 'Atención', inactivo: 'Inactivo',
};

/** Días con actividad en la semana actual (lunes a domingo) */
export function vecesEstaSemana(dias: Dia[], ahora: number): number {
  const h = new Date(ahora);
  const lunes = new Date(h.getFullYear(), h.getMonth(), h.getDate() - ((h.getDay() + 6) % 7)).getTime();
  return new Set(dias.map(inicioDe).filter((t) => t >= lunes && t < lunes + 7 * DIA)).size;
}

/**
 * Avance de un objetivo entre 0 y 1.
 * `actual` es el valor medido hoy (lo calcula cada especialidad); `inicial` el de cuando se fijó.
 */
export function avanceObjetivo(o: Objetivo, actual: number | undefined, inicial?: number): number {
  if (o.cumplido) return 1;
  if (actual === undefined || !o.meta) return 0;
  if (o.tipo === 'corporal' && o.bajar) {
    const desde = o.inicio ?? inicial ?? actual;
    if (actual <= o.meta) return 1;
    if (desde <= o.meta) return 0;
    return Math.max(0, Math.min(1, (desde - actual) / (desde - o.meta)));
  }
  return Math.max(0, Math.min(1, actual / o.meta));
}

/** Primero los que necesitan atención, después los nuevos, después los al día; dentro, por nombre */
export function ordenarClientes<T extends { vinculo: Vinculo; estado: EstadoCliente }>(l: T[]): T[] {
  const peso: Record<EstadoCliente, number> = { inactivo: 0, atencion: 1, nuevo: 2, 'al-dia': 3 };
  return [...l].sort((a, b) => peso[a.estado] - peso[b.estado] || a.vinculo.nombreCliente.localeCompare(b.vinculo.nombreCliente));
}

/** Iniciales para el medallón: "Ana Ruiz" → "AR" */
export function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '?') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}
