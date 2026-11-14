import { buscarEjercicio } from './biblioteca';
import type { AjustesSobrecarga, EjercicioRutina, EstadoEjercicio, Sugerencia } from './tipos';

export const SOBRECARGA_POR_DEFECTO: AjustesSobrecarga = { modo: 'manual', superior: 1.25, inferior: 2.5 };

const INFERIOR = new Set(['peso-muerto', 'peso-muerto-rumano', 'hip-thrust']);

export function esTrenInferior(ejercicioId: string): boolean {
  const m = buscarEjercicio(ejercicioId)?.musculo;
  return INFERIOR.has(ejercicioId) || m === 'Piernas' || m === 'Glúteos';
}

/**
 * Doble progresión: si la vez pasada completó todas las repeticiones objetivo en las series normales,
 * sube el peso; si no, mantiene el peso y apunta a sumar repeticiones.
 */
export function sugerirSobrecarga(
  ejercicioId: string,
  ultima: EstadoEjercicio['ultima'] | undefined,
  plan: Pick<EjercicioRutina, 'reps' | 'repsMax'> | undefined,
  ajustes: AjustesSobrecarga,
): Sugerencia | undefined {
  if (ajustes.modo === 'apagada' || !ultima?.series.length) return undefined;
  if (buscarEjercicio(ejercicioId)?.musculo === 'Cardio') return undefined;
  const normales = ultima.series.filter((s) => !s.tipo || s.tipo === 'normal' || s.tipo === 'drop');
  if (!normales.length) return undefined;
  const peso = Math.max(...normales.map((s) => s.peso));
  const minimo = plan?.reps ?? Math.min(...normales.map((s) => s.reps));
  const objetivo = plan?.repsMax && plan.repsMax > minimo ? plan.repsMax : minimo;
  const conPeso = normales.filter((s) => s.peso === peso);
  const logro = conPeso.every((s) => s.reps >= objetivo);

  // Peso corporal (dominadas, fondos): se progresa con repeticiones
  if (peso <= 0) {
    return logro
      ? { peso: 0, reps: objetivo + 1, accion: 'reps', texto: `Cumpliste ${objetivo} reps: buscá ${objetivo + 1} por serie o sumá lastre.` }
      : { peso: 0, reps: objetivo, accion: 'mantener', texto: `Mantené y llegá a ${objetivo} reps en todas las series.` };
  }
  if (logro) {
    const inc = esTrenInferior(ejercicioId) ? ajustes.inferior : ajustes.superior;
    return { peso: peso + inc, reps: minimo, accion: 'subir', texto: `Cumpliste ${objetivo} reps en todas: subí ${String(inc).replace('.', ',')} kg.` };
  }
  const faltan = conPeso.reduce((t, s) => t + Math.max(0, objetivo - s.reps), 0);
  return { peso, reps: objetivo, accion: 'mantener', texto: `Mantené el peso: te faltaron ${faltan} ${faltan === 1 ? 'repetición' : 'repeticiones'} para subir.` };
}
