export const COLORES_ICONO: { fondo: string; laurel: string; figura: string };
export const laurel: string;
export function emblema(figura: string): string;
export function svgIcono(figura: string, opciones?: { forma?: 'cuadrado' | 'redondo' | string; titulo?: string }): string;
export function svgEmblemaSolo(figura: string, ancho: number): string;
export const FIGURAS: { mancuerna: string; manzana: string; check: string; [nombre: string]: string };
