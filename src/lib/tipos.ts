export type Tema = 'claro' | 'oscuro' | 'sistema';
export type Unidad = 'kg' | 'lb';
export type Musculo =
  | 'Pecho' | 'Espalda' | 'Hombros' | 'Bíceps' | 'Tríceps'
  | 'Piernas' | 'Glúteos' | 'Abdomen' | 'Cardio';

/** Sensación de la serie: 1 = muy fácil … 5 = al límite */
export type Sensacion = 1 | 2 | 3 | 4 | 5;

export interface Ejercicio {
  id: string;
  nombre: string;
  musculo: Musculo;
  equipo?: string;
  propio?: boolean;
}

export interface EjercicioRutina {
  ejercicioId: string;
  series: number;
  reps: number;
  /** Si hay rango (por ejemplo 8–12), el máximo */
  repsMax?: number;
  /** Series extra al fallo (el "1×Máx" de la pizarra) */
  alFallo?: number;
  descanso: number; // segundos
  /** Alternativa o indicación, por ejemplo "o Jalón al pecho" */
  nota?: string;
}

export interface Rutina {
  id: string;
  nombre: string;
  /** 0 = domingo … 6 = sábado */
  dias: number[];
  ejercicios: EjercicioRutina[];
  orden: number;
  creado: number;
}

export type TipoSerie = 'normal' | 'calentamiento' | 'fallo' | 'drop';

export interface Serie {
  peso: number; // siempre guardado en kg
  reps: number;
  sensacion?: Sensacion;
  tipo?: TipoSerie;
  hecha: boolean;
}

export interface EjercicioEntreno {
  ejercicioId: string;
  series: Serie[];
  nota?: string;
  descanso?: number; // segundos
  /** Solo mientras se entrena: lo que pide la rutina ("3×6 + 1 al fallo") */
  objetivo?: string;
}

export interface Entrenamiento {
  id: string;
  rutinaId?: string;
  nombre: string;
  inicio: number; // ms
  fin: number; // ms
  ejercicios: EjercicioEntreno[];
  volumen: number; // kg·reps
  records: Record[];
  nota?: string;
  numero?: number; // entrenamiento N° del usuario
}

export interface Record {
  ejercicioId: string;
  tipo: 'peso' | 'volumen' | '1rm';
  valor: number;
}

export interface PuntoGrafico {
  fecha: number;
  pesoMax: number;
  volumen: number;
  e1rm?: number;
  reps?: number;
}

/** Resumen por ejercicio: evita recorrer todo el historial (ahorra lecturas) */
export interface EstadoEjercicio {
  ejercicioId: string;
  ultima?: { fecha: number; series: { peso: number; reps: number }[] };
  mejorPeso: number;
  mejorVolumen: number;
  mejor1RM?: number;
  puntos: PuntoGrafico[];
}

export interface RegistroCuerpo {
  id: string; // AAAA-MM-DD
  fecha: number;
  peso?: number; // kg
  cintura?: number; // cm
  pecho?: number;
  brazo?: number;
  muslo?: number;
}

export interface Recordatorio {
  activo: boolean;
  hora: string; // "18:30"
  dias: number[];
}

export interface Perfil {
  uid: string;
  nombre: string;
  email: string;
  tema: Tema;
  unidad: Unidad;
  recordatorio: Recordatorio;
  creado: number;
  /** Fechas (ms) de los entrenamientos de las últimas semanas, para Hoy con 1 sola lectura */
  resumen: Resumen;
}

/** Totales por semana (clave: lunes AAAA-MM-DD): volumen, entrenamientos y minutos */
export type Semanas = { [lunes: string]: { v: number; n: number; m: number } };

/** Resumen guardado en el perfil para que Inicio y Progreso carguen con 1 sola lectura */
export interface Resumen {
  dias: number[];
  total: number;
  semanas?: Semanas;
}
