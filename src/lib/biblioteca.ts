import type { Ejercicio, Musculo } from './tipos';

export const MUSCULOS: Musculo[] = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Glúteos', 'Abdomen', 'Cardio',
];

const L = (id: string, nombre: string, musculo: Musculo, equipo: string): Ejercicio => ({ id, nombre, musculo, equipo });

/** Biblioteca incluida en la app: no consume lecturas de Firebase */
export const BIBLIOTECA: Ejercicio[] = [
  // Pecho
  L('press-banca', 'Press de banca', 'Pecho', 'Barra'),
  L('press-inclinado-barra', 'Press inclinado con barra', 'Pecho', 'Barra'),
  L('press-mancuernas', 'Press con mancuernas', 'Pecho', 'Mancuernas'),
  L('press-inclinado-mancuernas', 'Press inclinado con mancuernas', 'Pecho', 'Mancuernas'),
  L('aperturas', 'Aperturas con mancuernas', 'Pecho', 'Mancuernas'),
  L('cruce-poleas', 'Cruce de poleas', 'Pecho', 'Polea'),
  L('fondos-pecho', 'Fondos en paralelas', 'Pecho', 'Peso corporal'),
  L('flexiones', 'Flexiones de brazos', 'Pecho', 'Peso corporal'),
  L('press-maquina', 'Press en máquina', 'Pecho', 'Máquina'),
  L('press-declinado', 'Press declinado', 'Pecho', 'Barra'),
  // Espalda
  L('dominadas', 'Dominadas', 'Espalda', 'Peso corporal'),
  L('dominadas-neutras', 'Dominadas agarre neutro', 'Espalda', 'Peso corporal'),
  L('dominadas-supinas', 'Dominadas supinas', 'Espalda', 'Peso corporal'),
  L('remo-pendlay', 'Remo Pendlay', 'Espalda', 'Barra'),
  L('jalon-pecho', 'Jalón al pecho', 'Espalda', 'Polea'),
  L('remo-barra', 'Remo con barra', 'Espalda', 'Barra'),
  L('remo-mancuerna', 'Remo con mancuerna', 'Espalda', 'Mancuernas'),
  L('remo-polea', 'Remo en polea baja', 'Espalda', 'Polea'),
  L('peso-muerto', 'Peso muerto', 'Espalda', 'Barra'),
  L('pullover-polea', 'Pullover en polea', 'Espalda', 'Polea'),
  L('remo-maquina', 'Remo en máquina', 'Espalda', 'Máquina'),
  // Hombros
  L('press-militar', 'Press militar', 'Hombros', 'Barra'),
  L('press-hombro-mancuernas', 'Press de hombros con mancuernas', 'Hombros', 'Mancuernas'),
  L('elevaciones-laterales', 'Elevaciones laterales', 'Hombros', 'Mancuernas'),
  L('elevaciones-frontales', 'Elevaciones frontales', 'Hombros', 'Mancuernas'),
  L('pajaros', 'Pájaros (deltoide posterior)', 'Hombros', 'Mancuernas'),
  L('face-pull', 'Face pull', 'Hombros', 'Polea'),
  L('remo-al-menton', 'Remo al mentón', 'Hombros', 'Barra'),
  // Bíceps
  L('curl-barra', 'Curl con barra', 'Bíceps', 'Barra'),
  L('curl-mancuernas', 'Curl con mancuernas', 'Bíceps', 'Mancuernas'),
  L('curl-martillo', 'Curl martillo', 'Bíceps', 'Mancuernas'),
  L('curl-predicador', 'Curl predicador', 'Bíceps', 'Máquina'),
  L('curl-polea', 'Curl en polea', 'Bíceps', 'Polea'),
  L('curl-concentrado', 'Curl concentrado', 'Bíceps', 'Mancuernas'),
  // Tríceps
  L('extension-polea', 'Extensión de tríceps en polea', 'Tríceps', 'Polea'),
  L('press-frances', 'Press francés', 'Tríceps', 'Barra'),
  L('fondos-banco', 'Fondos en banco', 'Tríceps', 'Peso corporal'),
  L('extension-nuca', 'Extensión por encima de la cabeza', 'Tríceps', 'Mancuernas'),
  L('extension-triceps-mancuerna', 'Extensión de tríceps con mancuernas', 'Tríceps', 'Mancuernas'),
  L('patada-triceps', 'Patada de tríceps', 'Tríceps', 'Mancuernas'),
  L('press-cerrado', 'Press de banca agarre cerrado', 'Tríceps', 'Barra'),
  // Piernas
  L('sentadilla', 'Sentadilla', 'Piernas', 'Barra'),
  L('sentadilla-frontal', 'Sentadilla frontal', 'Piernas', 'Barra'),
  L('prensa', 'Prensa de piernas', 'Piernas', 'Máquina'),
  L('extension-cuadriceps', 'Extensión de cuádriceps', 'Piernas', 'Máquina'),
  L('curl-femoral', 'Curl femoral', 'Piernas', 'Máquina'),
  L('zancadas', 'Zancadas', 'Piernas', 'Mancuernas'),
  L('sentadilla-bulgara', 'Sentadilla búlgara', 'Piernas', 'Mancuernas'),
  L('peso-muerto-rumano', 'Peso muerto rumano', 'Piernas', 'Barra'),
  L('gemelos-pie', 'Elevación de talones de pie', 'Piernas', 'Máquina'),
  L('sentadilla-goblet', 'Sentadilla goblet', 'Piernas', 'Mancuernas'),
  // Glúteos
  L('hip-thrust', 'Hip thrust', 'Glúteos', 'Barra'),
  L('puente-gluteo', 'Puente de glúteos', 'Glúteos', 'Peso corporal'),
  L('patada-gluteo', 'Patada de glúteo en polea', 'Glúteos', 'Polea'),
  L('abductores', 'Abducción en máquina', 'Glúteos', 'Máquina'),
  // Abdomen
  L('plancha', 'Plancha', 'Abdomen', 'Peso corporal'),
  L('crunch', 'Crunch abdominal', 'Abdomen', 'Peso corporal'),
  L('elevacion-piernas', 'Elevación de piernas colgado', 'Abdomen', 'Peso corporal'),
  L('rueda-abdominal', 'Rueda abdominal', 'Abdomen', 'Accesorio'),
  L('crunch-polea', 'Crunch en polea', 'Abdomen', 'Polea'),
  L('giro-ruso', 'Giro ruso', 'Abdomen', 'Peso corporal'),
  // Cardio
  L('cinta', 'Cinta (minutos)', 'Cardio', 'Máquina'),
  L('bicicleta', 'Bicicleta fija (minutos)', 'Cardio', 'Máquina'),
  L('remo-ergometro', 'Remo ergómetro (minutos)', 'Cardio', 'Máquina'),
  L('eliptica', 'Elíptica (minutos)', 'Cardio', 'Máquina'),
  L('saltar-soga', 'Saltar la soga (minutos)', 'Cardio', 'Accesorio'),
];

export function buscarEjercicio(id: string, propios: Ejercicio[] = []): Ejercicio | undefined {
  return BIBLIOTECA.find((e) => e.id === id) ?? propios.find((e) => e.id === id);
}

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Ejercicios con fotos de free-exercise-db (dominio público): /ejercicios/<id>-0.webp y -1.webp */
const CON_IMAGEN = new Set<string>(["abductores", "aperturas", "bicicleta", "cinta", "cruce-poleas", "crunch", "crunch-polea", "curl-barra", "curl-concentrado", "curl-femoral", "curl-mancuernas", "curl-martillo", "curl-polea", "curl-predicador", "dominadas", "dominadas-neutras", "dominadas-supinas", "elevacion-piernas", "elevaciones-frontales", "elevaciones-laterales", "eliptica", "extension-cuadriceps", "extension-nuca", "extension-polea", "extension-triceps-mancuerna", "face-pull", "flexiones", "fondos-banco", "fondos-pecho", "gemelos-pie", "giro-ruso", "hip-thrust", "jalon-pecho", "pajaros", "patada-gluteo", "patada-triceps", "peso-muerto", "peso-muerto-rumano", "plancha", "prensa", "press-banca", "press-cerrado", "press-declinado", "press-frances", "press-hombro-mancuernas", "press-inclinado-barra", "press-inclinado-mancuernas", "press-mancuernas", "press-maquina", "press-militar", "puente-gluteo", "pullover-polea", "remo-al-menton", "remo-barra", "remo-ergometro", "remo-mancuerna", "remo-maquina", "remo-pendlay", "remo-polea", "rueda-abdominal", "saltar-soga", "sentadilla", "sentadilla-bulgara", "sentadilla-frontal", "sentadilla-goblet", "zancadas"]);

export function imagenesEjercicio(id: string): [string, string] | null {
  return CON_IMAGEN.has(id) ? [`/ejercicios/${id}-0.webp`, `/ejercicios/${id}-1.webp`] : null;
}
