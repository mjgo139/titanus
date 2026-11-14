import type { Entrenamiento, EstadoEjercicio, Perfil, RegistroCuerpo, Rutina } from '../lib/tipos';
import {
  actualizarEstado, agregarDia, claveDia, detectarRecords, inicioDia, sumarSemana, volumenTotal,
} from '../lib/logica';
import type { Semanas, Serie, Sensacion } from '../lib/tipos';
import type { Usuario } from './repo';
import { PLANTILLAS, rutinasDePlantilla } from '../lib/plantillas';

export function perfilInicial(u: Usuario): Perfil {
  return {
    uid: u.uid,
    nombre: u.nombre || (u.email ? u.email.split('@')[0] : 'Legionario'),
    email: u.email,
    tema: 'oscuro',
    unidad: 'kg',
    recordatorio: { activo: false, hora: '18:30', dias: [1, 3, 5] },
    creado: Date.now(),
    resumen: { dias: [], total: 0 },
  };
}

export const USUARIO_PRUEBA: Usuario = { uid: 'prueba', email: 'marco@ejemplo.com', nombre: 'Marco' };
export const CLAVE_PRUEBA = 'titanus';

const DIA = 86_400_000;

/**
 * Datos inventados para el modo prueba: la plantilla Full body principiante (A lunes, B miércoles, C viernes)
 * hecha durante 8 semanas, con progreso de cargas, series al fallo, récords y medidas.
 */
export function datosDePrueba(ahora = Date.now()) {
  const plantilla = PLANTILLAS.find((p) => p.id === 'fullbody-principiante')!;
  const rutinas: Rutina[] = rutinasDePlantilla(plantilla, 0, ahora).map((r, i) => ({ ...r, id: ['r-a', 'r-b', 'r-c'][i] }));
  // Peso inicial (kg) y cuánto sube por semana
  const base: Record<string, [number, number]> = {
    sentadilla: [60, 2.5], 'press-banca': [45, 1.25], 'peso-muerto': [70, 2.5], 'dominadas-neutras': [0, 0], 'dominadas-supinas': [0, 0],
    'press-militar': [30, 1.25], 'curl-barra': [20, 0.5], 'extension-polea': [20, 1],
    'remo-pendlay': [40, 1.25], 'press-inclinado-barra': [35, 1.25], prensa: [100, 5], 'hip-thrust': [60, 5],
    'fondos-pecho': [0, 0], 'curl-femoral': [30, 1], 'elevaciones-laterales': [6, 0.25], 'face-pull': [15, 0.5],
    'press-hombro-mancuernas': [14, 0.5], 'curl-martillo': [10, 0.5], 'extension-triceps-mancuerna': [8, 0.5],
  };
  const red = (n: number) => Math.round(n * 4) / 4;

  const historial: Entrenamiento[] = [];
  const estados = new Map<string, EstadoEjercicio>();
  let dias: number[] = [];
  let semanas: Semanas = {};
  const hoy = inicioDia(ahora);
  for (let d = 56; d >= 1; d--) {
    const f = new Date(hoy - d * DIA);
    const r = rutinas.find((x) => x.dias.includes(f.getDay()));
    if (!r || d === 38) continue; // una falta para que sea creíble
    const semana = Math.floor((56 - d) / 7);
    const inicio = f.getTime() + 18 * 3600_000 + (d % 3) * 600_000;
    const ejercicios = r.ejercicios.map((er) => {
      const [p0, sube] = base[er.ejercicioId] ?? [20, 1];
      const p = red(p0 + semana * sube);
      const repsBase = er.repsMax ? Math.min(er.repsMax, er.reps + Math.floor(semana / 2)) : er.reps;
      const series: Serie[] = Array.from({ length: er.series }, (_, i) => ({
        peso: p, reps: Math.max(1, repsBase - (i === er.series - 1 && semana % 3 === 0 ? 1 : 0)),
        tipo: 'normal' as const, sensacion: (i === er.series - 1 ? 4 : 3) as Sensacion, hecha: true,
      }));
      for (let k = 0; k < (er.alFallo ?? 0); k++) {
        series.push({ peso: p, reps: er.reps + 3 + (semana % 3), tipo: 'fallo', sensacion: 5, hecha: true });
      }
      return { ejercicioId: er.ejercicioId, descanso: er.descanso, series };
    });
    const records = detectarRecords(ejercicios, estados);
    const e: Entrenamiento = {
      id: 'h' + d, rutinaId: r.id, nombre: r.nombre, inicio, fin: inicio + (55 + (d % 4) * 5) * 60_000,
      ejercicios, volumen: volumenTotal(ejercicios), records, numero: historial.length + 1,
    };
    historial.push(e);
    for (const ej of ejercicios) {
      const n = actualizarEstado(estados.get(ej.ejercicioId), ej, e.fin);
      if (n) estados.set(ej.ejercicioId, n);
    }
    dias = agregarDia(dias, inicio);
    semanas = sumarSemana(semanas, inicio, e.volumen, (e.fin - e.inicio) / 60000);
  }
  historial.reverse();

  const cuerpo: RegistroCuerpo[] = [];
  for (let s = 8; s >= 0; s--) {
    const fecha = hoy - s * 7 * DIA;
    cuerpo.push({
      id: claveDia(fecha), fecha,
      peso: Math.round((78.6 - (8 - s) * 0.3) * 10) / 10,
      cintura: Math.round((86 - (8 - s) * 0.35) * 10) / 10,
      pecho: Math.round((100 + (8 - s) * 0.25) * 10) / 10,
      brazo: Math.round((34.5 + (8 - s) * 0.12) * 10) / 10,
      muslo: Math.round((56 + (8 - s) * 0.15) * 10) / 10,
    });
  }

  return { rutinas, historial, estados, dias, semanas, cuerpo };
}
