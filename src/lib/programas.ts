import type { EjercicioRutina, Rutina, TipoSerie } from './tipos';

/**
 * Programas: planes de varias semanas con un objetivo concreto ("Más dominadas en 30 días").
 * Hoy son todos gratis; `acceso` deja lista la estructura para que algunos sean "pro" más adelante.
 * Viven en el código (no gastan lecturas). El avance del usuario va en `perfil.programa`.
 */
export type Acceso = 'gratis' | 'pro';

export interface SesionPrograma { nombre: string; ejercicios: EjercicioRutina[] }
export interface SemanaPrograma { titulo: string; nota?: string; sesiones: SesionPrograma[] }

export interface Programa {
  id: string;
  nombre: string;
  /** Frase corta para la tarjeta */
  lema: string;
  descripcion: string;
  categoria: string;
  nivel: 'Principiante' | 'Intermedio' | 'Todos los niveles';
  /** Días sugeridos (0 = domingo … 6 = sábado) */
  dias: number[];
  /** Lo que vas a lograr */
  logros: string[];
  acceso: Acceso;
  /** Estatua de la tarjeta */
  imagen: 'espalda' | 'legionario' | 'capa' | 'busto';
  semanas: SemanaPrograma[];
}

/** Avance de un usuario en un programa (se guarda en el perfil: 1 escritura por sesión) */
export interface AvancePrograma { id: string; inicio: number; hechas: string[] }

// Ayudas para escribir los programas: ej('crunch', 3, 15) y variantes
const ej = (ejercicioId: string, series: number, reps: number, extra: Partial<EjercicioRutina> = {}): EjercicioRutina =>
  ({ ejercicioId, series, reps, descanso: 60, ...extra });
const conFallo = (e: EjercicioRutina): EjercicioRutina => ({ ...e, alFallo: 1 });
const semanas = (n: number, armar: (s: number) => SemanaPrograma): SemanaPrograma[] => Array.from({ length: n }, (_, s) => armar(s));

export const PROGRAMAS: Programa[] = [
  {
    id: 'abdomen-acero',
    nombre: 'Abdomen de acero',
    lema: 'Abdominales más fuertes en un mes',
    descripcion: 'Tres sesiones cortas por semana (20 minutos) para un abdomen firme y una zona media que aguante cualquier carga. Cada semana sube el tiempo y las repeticiones.',
    categoria: 'Abdomen', nivel: 'Todos los niveles', dias: [1, 3, 5], acceso: 'gratis', imagen: 'espalda',
    logros: ['Plancha de más de 1 minuto', 'Más control al levantar pesado', 'Rutina corta que entra en cualquier día'],
    semanas: semanas(4, (s) => ({
      titulo: `Semana ${s + 1}`,
      nota: s === 3 ? 'Última semana: llegá al fallo en la serie final.' : undefined,
      sesiones: [
        { nombre: 'Núcleo', ejercicios: [ej('plancha', 3, 30 + s * 10, { nota: 'segundos' }), ej('crunch', 3, 15 + s * 5), ej('elevacion-piernas', 3, 8 + s * 2), ej('giro-ruso', 3, 20 + s * 4)] },
        { nombre: 'Fuerza', ejercicios: [ej('rueda-abdominal', 3, 6 + s * 2, { descanso: 75 }), ej('crunch-polea', 3, 12 + s * 2), ej('plancha', 2, 40 + s * 10, { nota: 'segundos' })] },
        { nombre: 'Resistencia', ejercicios: [ej('elevacion-piernas', 4, 8 + s * 2), ej('giro-ruso', 3, 24 + s * 4), s === 3 ? conFallo(ej('crunch', 3, 20)) : ej('crunch', 3, 20 + s * 5)] },
      ],
    })),
  },
  {
    id: 'mas-dominadas',
    nombre: 'Más dominadas',
    lema: 'Sumá dominadas en 30 días',
    descripcion: 'Método de volumen progresivo: muchas series cortas, sin llegar al fallo, y trabajo de espalda y bíceps que las sostiene. Si todavía no hacés una, usá banda elástica o hacé negativas (bajar en 5 segundos).',
    categoria: 'Espalda', nivel: 'Todos los niveles', dias: [1, 3, 5], acceso: 'gratis', imagen: 'legionario',
    logros: ['Más repeticiones seguidas', 'Espalda más ancha y fuerte', 'Técnica limpia, sin balanceo'],
    semanas: semanas(4, (s) => ({
      titulo: `Semana ${s + 1}`,
      nota: s === 3 ? 'Al final de la última sesión: test de máximas dominadas.' : undefined,
      sesiones: [
        { nombre: 'Volumen', ejercicios: [ej('dominadas', 5 + s, 3 + Math.floor(s / 2), { descanso: 90, nota: 'o negativas / con banda' }), ej('remo-mancuerna', 3, 10), ej('curl-martillo', 3, 10)] },
        { nombre: 'Agarres', ejercicios: [ej('dominadas-supinas', 4 + s, 3, { descanso: 90 }), ej('dominadas-neutras', 3, 3 + s), ej('jalon-pecho', 3, 10)] },
        { nombre: s === 3 ? 'Test' : 'Fuerza', ejercicios: s === 3
          ? [conFallo(ej('dominadas', 2, 3, { descanso: 120 })), ej('remo-polea', 3, 12)]
          : [ej('dominadas', 4, 4 + s, { descanso: 120 }), ej('remo-barra', 3, 8, { descanso: 90 }), ej('face-pull', 3, 15)] },
      ],
    })),
  },
  {
    id: 'flexiones-30',
    nombre: 'De 10 a 30 flexiones',
    lema: 'Triplicá tus flexiones en un mes',
    descripcion: 'Sin equipamiento: flexiones con series escalonadas, tríceps y núcleo. Ideal para casa o para arrancar.',
    categoria: 'Pecho', nivel: 'Principiante', dias: [1, 3, 5], acceso: 'gratis', imagen: 'capa',
    logros: ['30 flexiones seguidas', 'Pecho y tríceps más fuertes', 'Se hace en casa'],
    semanas: semanas(4, (s) => ({
      titulo: `Semana ${s + 1}`,
      sesiones: [
        { nombre: 'Escalera', ejercicios: [ej('flexiones', 5, 6 + s * 3, { descanso: 75 }), ej('fondos-banco', 3, 10 + s * 2), ej('plancha', 3, 30 + s * 10, { nota: 'segundos' })] },
        { nombre: 'Volumen', ejercicios: [ej('flexiones', 6 + s, 5 + s * 2, { descanso: 60 }), ej('crunch', 3, 15)] },
        { nombre: s === 3 ? 'Test' : 'Máximo', ejercicios: [conFallo(ej('flexiones', 3, 8 + s * 3, { descanso: 90 })), ej('fondos-banco', 3, 12)] },
      ],
    })),
  },
  {
    id: 'brazos-centurion',
    nombre: 'Brazos de centurión',
    lema: 'Bíceps y tríceps en 4 semanas',
    descripcion: 'Dos sesiones de brazos por semana con rangos de 8–12 y sobrecarga progresiva. Combinalo con tu rutina de siempre.',
    categoria: 'Brazos', nivel: 'Intermedio', dias: [2, 5], acceso: 'gratis', imagen: 'busto',
    logros: ['Más peso en curl y press francés', 'Brazos más llenos', 'Se suma a tu rutina'],
    semanas: semanas(4, (s) => ({
      titulo: `Semana ${s + 1}`,
      sesiones: [
        { nombre: 'Bíceps pesado', ejercicios: [ej('curl-barra', 4, 8, { repsMax: 10, descanso: 90 }), ej('curl-martillo', 3, 10, { repsMax: 12 }), ej('press-cerrado', 3, 8, { repsMax: 10, descanso: 90 }), ej('extension-polea', 3, 12, { repsMax: 15 })] },
        { nombre: 'Bombeo', ejercicios: [ej('curl-predicador', 3, 10, { repsMax: 12 }), ej('press-frances', 3, 10, { repsMax: 12, descanso: 75 }), ej('curl-concentrado', 3, 12), s >= 2 ? conFallo(ej('patada-triceps', 3, 12)) : ej('patada-triceps', 3, 12)] },
      ],
    })),
  },
  {
    id: 'gluteos-gladiadora',
    nombre: 'Glúteos de gladiadora',
    lema: 'Glúteos y piernas fuertes en 6 semanas',
    descripcion: 'Tres días por semana centrados en glúteos: empuje de cadera, unilaterales y bisagra. Cada dos semanas cambian las repeticiones.',
    categoria: 'Glúteos', nivel: 'Todos los niveles', dias: [1, 3, 5], acceso: 'gratis', imagen: 'espalda',
    logros: ['Más fuerza en hip thrust', 'Piernas estables', 'Mejor postura'],
    semanas: semanas(6, (s) => {
      const reps = s < 2 ? 12 : s < 4 ? 10 : 8;
      return {
        titulo: `Semana ${s + 1}`,
        nota: s === 2 || s === 4 ? 'Bajan las reps: subí un poco el peso.' : undefined,
        sesiones: [
          { nombre: 'Empuje', ejercicios: [ej('hip-thrust', 4, reps, { descanso: 90 }), ej('sentadilla-bulgara', 3, reps), ej('abductores', 3, 15)] },
          { nombre: 'Bisagra', ejercicios: [ej('peso-muerto-rumano', 4, reps, { descanso: 90 }), ej('patada-gluteo', 3, 12), ej('puente-gluteo', 3, 15)] },
          { nombre: 'Piernas', ejercicios: [ej('sentadilla-goblet', 4, reps, { descanso: 75 }), ej('zancadas', 3, 10), ej('hip-thrust', 3, reps + 4)] },
        ],
      };
    }),
  },
  {
    id: 'fuerza-5x5',
    nombre: 'Fuerza base 5×5',
    lema: 'Los básicos, más pesados cada semana',
    descripcion: 'El clásico 5×5: dos sesiones que se alternan (A y B) con sentadilla en todas. La sobrecarga progresiva te sugiere cuándo subir.',
    categoria: 'Fuerza', nivel: 'Principiante', dias: [1, 3, 5], acceso: 'gratis', imagen: 'legionario',
    logros: ['Sentadilla, banca y peso muerto más pesados', 'Técnica de los básicos', 'Base para cualquier objetivo'],
    semanas: semanas(8, (s) => {
      const A = { nombre: 'A', ejercicios: [ej('sentadilla', 5, 5, { descanso: 180 }), ej('press-banca', 5, 5, { descanso: 180 }), ej('remo-barra', 5, 5, { descanso: 150 })] };
      const B = { nombre: 'B', ejercicios: [ej('sentadilla', 5, 5, { descanso: 180 }), ej('press-militar', 5, 5, { descanso: 150 }), ej('peso-muerto', 1, 5, { descanso: 180 })] };
      return { titulo: `Semana ${s + 1}`, sesiones: s % 2 === 0 ? [A, B, A] : [B, A, B] };
    }),
  },
];

export const buscarPrograma = (id: string) => PROGRAMAS.find((p) => p.id === id);

/** Clave de una sesión: "s1-2" = semana 1, sesión 2 */
export const claveSesion = (semana: number, sesion: number) => `s${semana + 1}-${sesion + 1}`;

export function totalSesiones(p: Programa): number {
  return p.semanas.reduce((t, s) => t + s.sesiones.length, 0);
}

/** La próxima sesión pendiente, en orden */
export function proximaSesion(p: Programa, hechas: string[]): { semana: number; sesion: number; clave: string } | null {
  for (let w = 0; w < p.semanas.length; w++) {
    for (let k = 0; k < p.semanas[w].sesiones.length; k++) {
      const clave = claveSesion(w, k);
      if (!hechas.includes(clave)) return { semana: w, sesion: k, clave };
    }
  }
  return null;
}

/** id de rutina con el que se marca un entrenamiento del programa: "prog:mas-dominadas:s1-2" */
export const idSesion = (programaId: string, clave: string) => `prog:${programaId}:${clave}`;
export function deIdSesion(rutinaId?: string): { programaId: string; clave: string } | null {
  const m = rutinaId?.match(/^prog:([^:]+):(s\d+-\d+)$/);
  return m ? { programaId: m[1], clave: m[2] } : null;
}

/** Una sesión del programa como rutina (no se guarda: solo sirve para empezar el entrenamiento) */
export function rutinaDeSesion(p: Programa, semana: number, sesion: number): Rutina {
  const s = p.semanas[semana].sesiones[sesion];
  return {
    id: idSesion(p.id, claveSesion(semana, sesion)),
    nombre: `${p.nombre} · S${semana + 1} · ${s.nombre}`,
    dias: [], orden: 0, creado: 0,
    ejercicios: s.ejercicios.map((e) => ({ ...e })),
  };
}

/** Avance tras terminar una sesión (sin duplicar) */
export function marcarSesion(a: AvancePrograma, clave: string): AvancePrograma {
  return a.hechas.includes(clave) ? a : { ...a, hechas: [...a.hechas, clave] };
}

export const textoAcceso: Record<Acceso, string> = { gratis: 'Gratis', pro: 'Pro' };
export type { TipoSerie };
