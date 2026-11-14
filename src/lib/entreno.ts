import type { Borrador } from './borrador';
import {
  actualizarEstado, agregarDia, detectarRecords, nuevoId, seriesHechas, sumarSemana, volumenTotal,
} from './logica';
import { textoObjetivo } from './plantillas';
import type { EjercicioEntreno, Entrenamiento, EstadoEjercicio, Resumen, Rutina, Serie, TipoSerie } from './tipos';

export const DESCANSO_POR_DEFECTO = 90;

type Previa = { peso: number; reps: number; tipo?: TipoSerie };
const clase = (t?: TipoSerie) => (t === 'fallo' || t === 'calentamiento' ? t : 'normal');

/**
 * Qué hizo la vez anterior en esta serie. Se compara por tipo, como Hevy:
 * la 1.ª serie normal con la 1.ª normal, la serie al fallo con la serie al fallo.
 */
export function anteriorPara(previas: Previa[] | undefined, series: Serie[], j: number): Previa | undefined {
  if (!previas?.length) return undefined;
  const c = clase(series[j]?.tipo);
  const k = series.slice(0, j).filter((s) => clase(s.tipo) === c).length;
  const mismas = previas.filter((p) => clase(p.tipo) === c);
  // Si hoy hay más series que la vez pasada, se compara con la última de ese tipo
  return mismas[k] ?? mismas[mismas.length - 1];
}

/** Un ejercicio nuevo dentro del entrenamiento, con los pesos de la última vez */
export function ejercicioNuevo(ejercicioId: string, estado: EstadoEjercicio | undefined, series = 3, reps = 10, descanso = DESCANSO_POR_DEFECTO): EjercicioEntreno {
  const ult = estado?.ultima?.series ?? [];
  const n = Math.max(series, 1);
  return {
    ejercicioId,
    descanso,
    series: Array.from({ length: n }, (_, i) => ({
      peso: ult[i]?.peso ?? ult[ult.length - 1]?.peso ?? 0,
      reps: ult[i]?.reps ?? ult[ult.length - 1]?.reps ?? reps,
      tipo: 'normal' as const,
      hecha: false,
    })),
  };
}

/** Arma el entrenamiento a partir de la rutina y de lo que hizo la última vez */
export function iniciarDesdeRutina(r: Rutina, estados: Map<string, EstadoEjercicio>, ahora = Date.now()): Borrador {
  return {
    rutinaId: r.id,
    nombre: r.nombre,
    inicio: ahora,
    ejercicios: r.ejercicios.map((er) => {
      const fallo = er.alFallo ?? 0;
      const est = estados.get(er.ejercicioId);
      const e = ejercicioNuevo(er.ejercicioId, est, er.series + fallo, er.reps, er.descanso);
      // En una rutina mandan las repeticiones planificadas; las últimas son al fallo (1×Máx)
      e.series = e.series.map((s, i) => (i < er.series ? { ...s, reps: er.reps } : { ...s, reps: 0, tipo: 'fallo' as const }));
      // El peso inicial sale de la misma serie (por tipo) de la vez anterior
      const ult = est?.ultima?.series;
      e.series = e.series.map((s, j) => {
        const a = anteriorPara(ult, e.series, j) ?? anteriorPara(ult, e.series.map((x) => ({ ...x, tipo: 'normal' as const })), j);
        return a ? { ...s, peso: a.peso } : s;
      });
      e.objetivo = textoObjetivo(er) + (er.nota ? ` · ${er.nota}` : '');
      return e;
    }),
  };
}

export function nombreLibre(ahora = Date.now()): string {
  const h = new Date(ahora).getHours();
  return h < 12 ? 'Entrenamiento de la mañana' : h < 19 ? 'Entrenamiento de la tarde' : 'Entrenamiento de la noche';
}

export function iniciarLibre(ahora = Date.now()): Borrador {
  return { nombre: nombreLibre(ahora), inicio: ahora, ejercicios: [] };
}

/** Repetir un entrenamiento del historial con los mismos ejercicios y series */
export function iniciarRepeticion(e: Entrenamiento, ahora = Date.now()): Borrador {
  return {
    rutinaId: e.rutinaId,
    nombre: e.nombre,
    inicio: ahora,
    ejercicios: e.ejercicios.map((x) => ({
      ejercicioId: x.ejercicioId,
      descanso: x.descanso ?? DESCANSO_POR_DEFECTO,
      series: x.series.map((s) => ({ peso: s.peso, reps: s.reps, tipo: s.tipo ?? 'normal', hecha: false })),
    })),
  };
}

export interface Cierre {
  entreno: Entrenamiento;
  estados: EstadoEjercicio[];
  resumen: Resumen;
}

/** Cierra el entrenamiento: volumen, récords, resúmenes por ejercicio y el resumen del perfil */
export function cerrarEntrenamiento(
  b: Borrador,
  previos: Map<string, EstadoEjercicio>,
  resumen: Resumen,
  fin = Date.now(),
): Cierre {
  const ejercicios: EjercicioEntreno[] = b.ejercicios
    .map((e) => ({
      ejercicioId: e.ejercicioId,
      series: seriesHechas(e).map((s) => ({ ...s, tipo: s.tipo ?? 'normal' })),
      ...(e.nota?.trim() ? { nota: e.nota.trim() } : {}),
      ...(e.descanso ? { descanso: e.descanso } : {}),
    }))
    .filter((e) => e.series.length > 0);
  const records = detectarRecords(ejercicios, previos);
  const volumen = volumenTotal(ejercicios);
  const entreno: Entrenamiento = {
    id: nuevoId(),
    ...(b.rutinaId ? { rutinaId: b.rutinaId } : {}),
    nombre: b.nombre.trim() || nombreLibre(b.inicio),
    inicio: b.inicio,
    fin,
    ejercicios,
    volumen,
    records,
    numero: resumen.total + 1,
    ...(b.nota?.trim() ? { nota: b.nota.trim() } : {}),
  };
  const estados: EstadoEjercicio[] = [];
  for (const e of ejercicios) {
    const n = actualizarEstado(previos.get(e.ejercicioId), e, fin);
    if (n) estados.push(n);
  }
  return {
    entreno,
    estados,
    resumen: {
      dias: agregarDia(resumen.dias, b.inicio),
      total: resumen.total + 1,
      semanas: sumarSemana(resumen.semanas, b.inicio, volumen, (fin - b.inicio) / 60000),
    },
  };
}

/** Convierte un entrenamiento terminado en rutina (como "guardar como rutina" de Hevy) */
export function rutinaDesdeEntreno(e: Entrenamiento, orden: number): Rutina {
  return {
    id: nuevoId(),
    nombre: e.nombre,
    dias: [],
    orden,
    creado: Date.now(),
    ejercicios: e.ejercicios.map((x) => ({
      ejercicioId: x.ejercicioId,
      series: x.series.length,
      reps: x.series[x.series.length - 1]?.reps ?? 10,
      descanso: x.descanso ?? DESCANSO_POR_DEFECTO,
    })),
  };
}
