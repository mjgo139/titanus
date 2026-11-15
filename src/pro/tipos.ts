/**
 * Base reutilizable "encargado y sus clientes".
 * Sirve para entrenadores (TITANUS) y, más adelante, nutricionistas u otros profesionales.
 * Nada de este archivo sabe de pesas ni de comidas: lo propio de cada especialidad va en su carpeta.
 */
export type TipoProfesional = 'entrenador' | 'nutricionista';

/** Un profesional dado de alta por el admin */
export interface Profesional {
  uid: string;
  tipo: TipoProfesional;
  nombre: string;
  /** Código para que sus clientes se vinculen, por ejemplo TIT-4K9Q */
  codigo: string;
  activo: boolean;
  alta: number;
}

/** Pedido de un usuario para ser profesional: lo aprueba el admin */
export interface Solicitud {
  uid: string;
  tipo: TipoProfesional;
  nombre: string;
  email: string;
  mensaje?: string;
  fecha: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

/** Entrada pública del código: solo dice de quién es */
export interface Codigo {
  codigo: string;
  profesionalId: string;
  tipo: TipoProfesional;
  nombre: string;
}

/** Relación profesional ↔ cliente. La crea el cliente al ingresar el código (así da su permiso) */
export interface Vinculo {
  /** `${profesionalId}_${clienteId}` */
  id: string;
  profesionalId: string;
  clienteId: string;
  tipo: TipoProfesional;
  nombreProfesional: string;
  nombreCliente: string;
  codigo: string;
  desde: number;
  activo: boolean;
  hasta?: number;
}

/** Nota del profesional (o respuesta del cliente), suelta o sobre un registro (un entrenamiento, una comida…) */
export interface Comentario {
  id: string;
  autorId: string;
  autorNombre: string;
  /** A qué se refiere, por ejemplo { tipo: 'entrenamiento', id, titulo: 'Full body A · 3 nov' } */
  sobre?: { tipo: string; id: string; titulo?: string };
  texto: string;
  fecha: number;
  leido: boolean;
}

/**
 * Objetivo que fija el profesional.
 * - frecuencia: N veces por semana (entrenos, comidas registradas…)
 * - marca: llegar a un valor en algo medible (peso en un ejercicio)
 * - corporal: llegar a un valor de una medida del cuerpo (peso, cintura…)
 * - libre: texto, se marca a mano como cumplido
 */
export interface Objetivo {
  id: string;
  tipo: 'frecuencia' | 'marca' | 'corporal' | 'libre';
  titulo: string;
  meta: number;
  /** kg, cm, veces… */
  unidad?: string;
  /** Qué se mide: id del ejercicio, nombre de la medida… */
  referencia?: string;
  /** Para "corporal": si hay que bajar en vez de subir */
  bajar?: boolean;
  inicio?: number;
  hasta?: number;
  creadoPor: string;
  fecha: number;
  cumplido?: boolean;
}
