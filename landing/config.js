// Familia estoica · landing. Lo único que se cambia a mano está acá.

/**
 * Huella del código de acceso (SHA-256). La genera el dueño en /huella.html y la pega acá.
 * Vacía = la puerta queda cerrada para todos ("Muy pronto").
 */
export const HUELLA = '';

/** Sal fija: hace que la huella sirva solo para esta página */
export const SAL = 'familia-estoica·stoa:';

export const APPS = [
  { id: 'stoagym', nombre: 'StoaGym', tema: 'Entrenamiento', lema: 'Disciplina · Fuerza', url: 'https://stoagym.web.app' },
  { id: 'stoafit', nombre: 'StoaFit', tema: 'Nutrición', lema: 'Templanza · Medida', url: 'https://stoafit-app.web.app' },
  { id: 'stoahabit', nombre: 'StoaHabit', tema: 'Hábitos', lema: 'Constancia · Serenidad', url: 'https://stoahabit.web.app' },
];

/** Normaliza el código (sin espacios, en mayúsculas) y devuelve su huella */
export async function huellaDe(codigo) {
  const datos = new TextEncoder().encode(SAL + codigo.trim().toUpperCase());
  const h = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
