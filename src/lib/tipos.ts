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

/** Una serie planificada en la rutina */
export interface SerieRutina { tipo?: TipoSerie; peso?: number; reps: number }

export interface EjercicioRutina {
  ejercicioId: string;
  series: number;
  reps: number;
  /** Si hay rango (por ejemplo 8–12), el máximo */
  repsMax?: number;
  /** Series extra al fallo (el "1×Máx" de la pizarra) */
  alFallo?: number;
  descanso: number; // segundos
  /** Peso inicial planificado en kg (se usa mientras no haya historial de ese ejercicio) */
  peso?: number;
  /** Serie por serie (tipo, peso en kg y reps). Si está, manda sobre series/reps/alFallo/peso */
  detalle?: SerieRutina[];
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
  /** Rutina asignada por su entrenador: el cliente la usa pero no la cambia */
  asignadaPor?: string;
  nombreAsignador?: string;
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
  /** Solo mientras se entrena: sugerencia de sobrecarga progresiva */
  sugerencia?: Sugerencia;
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
  ultima?: { fecha: number; series: { peso: number; reps: number; tipo?: TipoSerie }[] };
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

export type Figura = 'hombre' | 'mujer';
export type Objetivo = 'musculo' | 'fuerza' | 'grasa';
export type Nivel = 'principiante' | 'intermedio' | 'avanzado';

export interface Perfil {
  uid: string;
  nombre: string;
  email: string;
  tema: Tema;
  unidad: Unidad;
  recordatorio: Recordatorio;
  sobrecarga?: AjustesSobrecarga;
  /** Qué estatuas ve: legionario o legionaria */
  figura?: Figura;
  // Datos de la bienvenida ("Conocerte"); todos opcionales
  genero?: 'hombre' | 'mujer' | 'otro';
  /** AAAA-MM-DD */
  nacimiento?: string;
  /** cm */
  altura?: number;
  objetivo?: Objetivo;
  nivel?: Nivel;
  /** Foto de perfil (data URL WebP/JPEG 256×256, v1.26.0); null = sin foto */
  foto?: string | null;
  /** Widget para Windows (v1.33.0): código secreto de 24 letras del resumen `escritorio/{codigo}`, o null */
  escritorio?: string | null;
  /** Ya pasó (o salteó) la bienvenida */
  conocido?: boolean;
  /** Programa en curso (formato viejo, hasta v1.19; se lee con programasActivos) */
  programa?: { id: string; inicio: number; hechas: string[] } | null;
  /** Programas en curso, hasta 3 (v1.20; ver src/lib/programas.ts) */
  programas?: { id: string; inicio: number; hechas: string[] }[];
  /** Rutinas terminadas hoy (para mostrar la siguiente del día) */
  hoy?: { fecha: string; ids: string[] } | null;
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

export type ModoSobrecarga = 'auto' | 'manual' | 'apagada';

/** Sobrecarga progresiva: cuánto subir (en kg) cuando se cumplen todas las repeticiones */
export interface AjustesSobrecarga {
  modo: ModoSobrecarga;
  superior: number; // tren superior, kg
  inferior: number; // piernas, glúteos y peso muerto, kg
}

export interface Sugerencia {
  peso: number; // kg
  reps: number;
  accion: 'subir' | 'mantener' | 'reps';
  texto: string;
  aplicada?: boolean;
}
