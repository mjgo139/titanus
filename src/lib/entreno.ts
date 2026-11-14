import type { Borrador } from './borrador';
import { actualizarEstado, agregarDia, detectarRecords, nuevoId, seriesHechas, volumenTotal } from './logica';
import type { EjercicioEntreno, Entrenamiento, EstadoEjercicio, Perfil, Rutina } from './tipos';

/** Arma el borrador inicial a partir de la rutina y de lo que hizo la última vez */
export function iniciarDesdeRutina(r: Rutina, estados: Map<string, EstadoEjercicio>, ahora = Date.now()): Borrador {
  return {
    rutinaId: r.id,
    nombre: r.nombre,
    inicio: ahora,
    actual: 0,
    ejercicios: r.ejercicios.map((er) => {
      const ult = estados.get(er.ejercicioId)?.ultima?.series ?? [];
      return {
        ejercicioId: er.ejercicioId,
        series: Array.from({ length: er.series }, (_, i) => ({
          peso: ult[i]?.peso ?? ult[ult.length - 1]?.peso ?? 0,
          reps: er.reps,
          hecha: false,
        })),
      };
    }),
  };
}

export interface Cierre {
  entreno: Entrenamiento;
  estados: EstadoEjercicio[];
  resumen: Perfil['resumen'];
}

/** Cierra el entrenamiento: calcula volumen, récords, resúmenes por ejercicio y el resumen del perfil */
export function cerrarEntrenamiento(
  b: Borrador,
  previos: Map<string, EstadoEjercicio>,
  resumen: Perfil['resumen'],
  fin = Date.now(),
): Cierre {
  const ejercicios: EjercicioEntreno[] = b.ejercicios
    .map((e) => ({ ejercicioId: e.ejercicioId, series: seriesHechas(e) }))
    .filter((e) => e.series.length > 0);
  const records = detectarRecords(ejercicios, previos);
  const entreno: Entrenamiento = {
    id: nuevoId(),
    rutinaId: b.rutinaId,
    nombre: b.nombre,
    inicio: b.inicio,
    fin,
    ejercicios,
    volumen: volumenTotal(ejercicios),
    records,
  };
  const estados: EstadoEjercicio[] = [];
  for (const e of ejercicios) {
    const n = actualizarEstado(previos.get(e.ejercicioId), e, fin);
    if (n) estados.push(n);
  }
  return {
    entreno,
    estados,
    resumen: { dias: agregarDia(resumen.dias, b.inicio), total: resumen.total + 1 },
  };
}
