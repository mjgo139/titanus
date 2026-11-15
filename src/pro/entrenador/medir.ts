import { aUnidad, formatoNumero, redondear } from '../../lib/logica';
import type { EstadoEjercicio, Perfil, RegistroCuerpo, Unidad } from '../../lib/tipos';
import { avanceObjetivo, vecesEstaSemana } from '../logica';
import type { Medicion } from '../piezas';
import type { Objetivo } from '../tipos';

export interface DatosCliente {
  perfil: Perfil;
  estados: Map<string, EstadoEjercicio>;
  cuerpo: RegistroCuerpo[];
}

export const MEDIDAS: { v: keyof Omit<RegistroCuerpo, 'id' | 'fecha'>; t: string; u: string }[] = [
  { v: 'peso', t: 'Peso corporal', u: 'kg' },
  { v: 'cintura', t: 'Cintura', u: 'cm' },
  { v: 'pecho', t: 'Pecho', u: 'cm' },
  { v: 'brazo', t: 'Brazo', u: 'cm' },
  { v: 'muslo', t: 'Muslo', u: 'cm' },
];

/** Último valor registrado de una medida del cuerpo */
export function ultimaMedida(cuerpo: RegistroCuerpo[], medida: string): number | undefined {
  const l = [...cuerpo].sort((a, b) => b.fecha - a.fecha);
  for (const r of l) {
    const v = (r as unknown as Record<string, number | undefined>)[medida];
    if (typeof v === 'number') return v;
  }
  return undefined;
}

/** Cómo va un objetivo del entrenador con los datos actuales del cliente */
export function medirObjetivo(o: Objetivo, d: DatosCliente, ahora: number, u: Unidad = 'kg'): Medicion {
  const n = (x: number, dec = 1) => formatoNumero(redondear(x, dec));
  if (o.tipo === 'frecuencia') {
    const actual = vecesEstaSemana(d.perfil.resumen.dias, ahora);
    return { actual, avance: avanceObjetivo(o, actual), texto: `Esta semana: ${actual} de ${o.meta}` };
  }
  if (o.tipo === 'marca') {
    const actual = o.referencia ? d.estados.get(o.referencia)?.mejorPeso : undefined;
    return {
      actual, avance: avanceObjetivo(o, actual),
      texto: actual !== undefined ? `Mejor marca: ${n(aUnidad(actual, u))} ${u} · meta ${n(aUnidad(o.meta, u))} ${u}` : `Sin registros todavía · meta ${n(aUnidad(o.meta, u))} ${u}`,
    };
  }
  if (o.tipo === 'corporal') {
    const actual = o.referencia ? ultimaMedida(d.cuerpo, o.referencia) : undefined;
    return {
      actual, avance: avanceObjetivo(o, actual),
      texto: actual !== undefined ? `Ahora: ${n(actual)} ${o.unidad ?? ''} · meta ${n(o.meta)} ${o.unidad ?? ''}` : 'Sin medidas registradas todavía',
    };
  }
  return { avance: o.cumplido ? 1 : 0, texto: o.cumplido ? 'Cumplido' : 'Lo marca tu entrenador cuando se cumple' };
}
