import type { Entrenamiento, EstadoEjercicio, Perfil, RegistroCuerpo, Rutina } from '../lib/tipos';
import {
  actualizarEstado, agregarDia, claveDia, detectarRecords, inicioDia, sumarSemana, volumenTotal,
} from '../lib/logica';
import type { Semanas } from '../lib/tipos';
import type { Usuario } from './repo';

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

/** Datos inventados para el modo prueba: 3 rutinas y unas 8 semanas de entrenamientos con progreso */
export function datosDePrueba(ahora = Date.now()) {
  const rutinas: Rutina[] = [
    {
      id: 'r-empuje', nombre: 'Pecho y tríceps', dias: [1, 4], orden: 0, creado: ahora,
      ejercicios: [
        { ejercicioId: 'press-banca', series: 4, reps: 8, descanso: 120 },
        { ejercicioId: 'press-inclinado-mancuernas', series: 3, reps: 10, descanso: 90 },
        { ejercicioId: 'aperturas', series: 3, reps: 12, descanso: 60 },
        { ejercicioId: 'extension-polea', series: 3, reps: 12, descanso: 60 },
      ],
    },
    {
      id: 'r-tiron', nombre: 'Espalda y bíceps', dias: [2, 5], orden: 1, creado: ahora,
      ejercicios: [
        { ejercicioId: 'dominadas', series: 4, reps: 6, descanso: 120 },
        { ejercicioId: 'remo-barra', series: 4, reps: 8, descanso: 90 },
        { ejercicioId: 'jalon-pecho', series: 3, reps: 10, descanso: 75 },
        { ejercicioId: 'curl-barra', series: 3, reps: 10, descanso: 60 },
      ],
    },
    {
      id: 'r-pierna', nombre: 'Piernas y glúteos', dias: [3, 6], orden: 2, creado: ahora,
      ejercicios: [
        { ejercicioId: 'sentadilla', series: 4, reps: 6, descanso: 150 },
        { ejercicioId: 'prensa', series: 3, reps: 10, descanso: 90 },
        { ejercicioId: 'hip-thrust', series: 3, reps: 10, descanso: 90 },
        { ejercicioId: 'curl-femoral', series: 3, reps: 12, descanso: 60 },
      ],
    },
  ];
  const base: Record<string, number> = {
    'press-banca': 60, 'press-inclinado-mancuernas': 22, aperturas: 12, 'extension-polea': 25,
    dominadas: 0, 'remo-barra': 50, 'jalon-pecho': 45, 'curl-barra': 25,
    sentadilla: 80, prensa: 140, 'hip-thrust': 70, 'curl-femoral': 35,
  };

  const historial: Entrenamiento[] = [];
  const estados = new Map<string, EstadoEjercicio>();
  let dias: number[] = [];
  let semanas: Semanas = {};
  const hoy = inicioDia(ahora);
  // Entrena 3 veces por semana durante 8 semanas, sin incluir hoy
  for (let d = 56; d >= 1; d--) {
    const f = new Date(hoy - d * DIA);
    const dow = f.getDay();
    const r = rutinas.find((x) => x.dias.includes(dow));
    if (!r || (d % 7 === 3 && d > 30)) continue; // alguna falta para que sea creíble
    const semana = Math.floor((56 - d) / 7);
    const inicio = f.getTime() + 18 * 3600_000 + (d % 3) * 900_000;
    const ejercicios = r.ejercicios.map((er) => {
      const p = base[er.ejercicioId] + semana * (er.ejercicioId === 'dominadas' ? 0 : 2.5);
      return {
        ejercicioId: er.ejercicioId,
        descanso: er.descanso,
        series: Array.from({ length: er.series }, (_, i) => ({
          tipo: (i === 0 && er.series > 3 ? 'calentamiento' : 'normal') as 'calentamiento' | 'normal',
          peso: i === 0 && er.series > 3 ? Math.round(p * 0.6) : p,
          reps: Math.max(1, er.reps - (i > 1 ? 1 : 0) + (semana > 4 ? 1 : 0)),
          sensacion: (i === er.series - 1 ? 4 : 3) as 3 | 4,
          hecha: true,
        })),
      };
    });
    const records = detectarRecords(ejercicios, estados);
    const e: Entrenamiento = {
      id: 'h' + d, rutinaId: r.id, nombre: r.nombre, inicio, fin: inicio + (52 + (d % 4) * 6) * 60_000,
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
      peso: Math.round((82.4 - (8 - s) * 0.35) * 10) / 10,
      cintura: Math.round((88 - (8 - s) * 0.4) * 10) / 10,
      pecho: 102 + (8 - s) * 0.2,
      brazo: 36 + (8 - s) * 0.1,
      muslo: 58,
    });
  }

  return { rutinas, historial, estados, dias, semanas, cuerpo };
}
