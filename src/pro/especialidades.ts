import type { TipoProfesional } from './tipos';

/**
 * Lo que cambia entre especialidades son las palabras y qué secciones tiene la ficha del cliente.
 * Para sumar nutricionistas en otra app: se usa esta misma base y se arma su carpeta (como `entrenador/`).
 */
export interface Especialidad {
  tipo: TipoProfesional;
  rol: string;
  rolPlural: string;
  /** "tu entrenador" */
  tuRol: string;
  prefijoCodigo: string;
  /** Qué va a poder hacer el profesional: se le muestra al cliente antes de aceptar */
  permisos: string[];
}

export const ESPECIALIDADES: Record<TipoProfesional, Especialidad> = {
  entrenador: {
    tipo: 'entrenador', rol: 'Entrenador', rolPlural: 'Entrenadores', tuRol: 'tu entrenador', prefijoCodigo: 'TIT',
    permisos: [
      'Ver tus entrenamientos, progreso, récords, peso y medidas.',
      'Asignarte rutinas (las vas a ver marcadas como "De tu entrenador").',
      'Dejarte comentarios y fijarte objetivos.',
    ],
  },
  nutricionista: {
    tipo: 'nutricionista', rol: 'Nutricionista', rolPlural: 'Nutricionistas', tuRol: 'tu nutricionista', prefijoCodigo: 'NUT',
    permisos: [
      'Ver tus registros de comidas, peso y medidas.',
      'Asignarte planes de alimentación.',
      'Dejarte comentarios y fijarte objetivos.',
    ],
  },
};

/** La especialidad de esta app */
export const TIPO_APP: TipoProfesional = 'entrenador';
export const ESP = ESPECIALIDADES[TIPO_APP];
