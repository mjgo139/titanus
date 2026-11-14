import { nuevoId } from './logica';
import type { EjercicioRutina, Rutina } from './tipos';

export interface Plantilla {
  id: string;
  nombre: string;
  nivel: string;
  descripcion: string;
  rutinas: { nombre: string; dias: number[]; ejercicios: EjercicioRutina[] }[];
}

const E = (ejercicioId: string, series: number, reps: number, extra: Partial<EjercicioRutina> = {}): EjercicioRutina => ({
  ejercicioId, series, reps, descanso: extra.descanso ?? (reps <= 6 ? 150 : reps <= 8 ? 120 : 75), ...extra,
});

/** Rutinas listas para cargar con un toque */
export const PLANTILLAS: Plantilla[] = [
  {
    id: 'fullbody-principiante',
    nombre: 'Full body principiante',
    nivel: 'Principiante · 3 días',
    descripcion: 'Cuerpo completo lunes, miércoles y viernes. Básicos pesados primero y accesorios al final.',
    rutinas: [
      {
        nombre: 'A · Full body', dias: [1],
        ejercicios: [
          E('sentadilla', 3, 6, { alFallo: 1 }),
          E('press-banca', 3, 6, { alFallo: 1 }),
          E('peso-muerto', 2, 5, { descanso: 180 }),
          E('dominadas-neutras', 3, 8, { nota: 'o Jalón al pecho' }),
          E('press-militar', 2, 8),
          E('curl-barra', 3, 8, { repsMax: 12, descanso: 60 }),
          E('extension-polea', 3, 8, { repsMax: 12, descanso: 60 }),
        ],
      },
      {
        nombre: 'B · Full body', dias: [3],
        ejercicios: [
          E('remo-pendlay', 4, 8),
          E('press-inclinado-barra', 4, 8),
          E('prensa', 4, 12, { descanso: 90 }),
          E('hip-thrust', 4, 8),
          E('fondos-pecho', 2, 10, { repsMax: 12, nota: 'o Press declinado' }),
          E('curl-femoral', 4, 8, { repsMax: 12, descanso: 60 }),
          E('elevaciones-laterales', 5, 10, { repsMax: 15, descanso: 45 }),
          E('face-pull', 5, 10, { repsMax: 15, descanso: 45 }),
        ],
      },
      {
        nombre: 'C · Full body', dias: [5],
        ejercicios: [
          E('sentadilla', 2, 8, { alFallo: 1 }),
          E('press-banca', 2, 8, { alFallo: 1 }),
          E('peso-muerto', 2, 5, { descanso: 180 }),
          E('dominadas-supinas', 3, 8, { nota: 'o Jalón al pecho' }),
          E('press-hombro-mancuernas', 3, 10, { descanso: 90 }),
          E('curl-martillo', 3, 8, { repsMax: 12, descanso: 60 }),
          E('extension-triceps-mancuerna', 3, 8, { repsMax: 12, descanso: 60 }),
        ],
      },
    ],
  },
];

/** Convierte la plantilla en rutinas propias del usuario */
export function rutinasDePlantilla(p: Plantilla, ordenInicial: number, ahora = Date.now()): Rutina[] {
  return p.rutinas.map((r, i) => ({
    id: nuevoId(),
    nombre: r.nombre,
    dias: [...r.dias],
    ejercicios: r.ejercicios.map((e) => ({ ...e })),
    orden: ordenInicial + i,
    creado: ahora,
  }));
}

/** "3×6 + 1 al fallo", "3×8–12" */
export function textoObjetivo(e: EjercicioRutina): string {
  const reps = e.repsMax && e.repsMax > e.reps ? `${e.reps}–${e.repsMax}` : `${e.reps}`;
  return `${e.series}×${reps}${e.alFallo ? ` + ${e.alFallo} al fallo` : ''}`;
}
