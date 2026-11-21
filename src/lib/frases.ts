/** Frases estoicas: vienen de la familia (familia/frases.ts). StoaGym usa el tema 'esfuerzo'. */
import { fraseDelDia as delTema } from '../../familia/frases';
export { FRASES } from '../../familia/frases';
export type { Frase } from '../../familia/frases';
export const fraseDelDia = (t = Date.now()) => delTema('esfuerzo', t);
