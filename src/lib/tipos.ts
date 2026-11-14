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
  descanso: number; // segundos
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

export interface Serie {
  peso: number; // siempre guardado en kg
  reps: number;
  sensacion?: Sensacion;
  hecha: boolean;
}

export interface EjercicioEntreno {
  ejercicioId: string;
  series: Serie[];
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
}

export interface Record {
  ejercicioId: string;
  tipo: 'peso' | 'volumen';
  valor: number;
}

export interface PuntoGrafico {
  fecha: number;
  pesoMax: number;
  volumen: number;
}

/** Resumen por ejercicio: evita recorrer todo el historial (ahorra lecturas) */
export interface EstadoEjercicio {
  ejercicioId: string;
  ultima?: { fecha: number; series: { peso: number; reps: number }[] };
  mejorPeso: number;
  mejorVolumen: number;
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
  resumen: { dias: number[]; total: number };
}
