/**
 * Widget para Windows (Rainmeter) de StoaGym (v1.33.0, pedido del dueño; motor común en familia/escritorio.ts).
 * Qué muestra:
 *  - Lista "Hoy": tus rutinas (◆ hecha hoy · ◇ toca hoy · · no toca) con sus días, y "HOY · 1 DE 2 RUTINAS".
 *  - Tarjetas con las últimas 5 semanas: "Entrenamientos" (días entrenados) y una por rutina
 *    (verde = entrenaste un día que tocaba · rojo = tocaba y no entrenaste · gris = no tocaba).
 * Todo sale del perfil (resumen.dias, hoy) y de las rutinas: no hace falta leer el historial.
 */
import { DIRECCION } from '../ui/AvisoMudanza';
import { FIGURAS } from '../../familia/emblema.mjs';
import { fechasGrilla, type AppEscritorio, type ColorFila, type FilaEscritorio, type ResumenEscritorio } from '../../familia/escritorio';
import { fechaLocal, hechasHoy, rachaSemanas, rango, rutinasDeHoy } from './logica';
import type { Perfil, Rutina } from './tipos';

export const APP_ESCRITORIO = (proyecto: string): AppEscritorio => ({
  nombre: 'StoaGym',
  proyecto,
  url: DIRECCION.replace(/\/$/, ''),
  figura: FIGURAS.mancuerna,
  singular: 'rutina',
  accionPendiente: 'Entrenar ◇',
  informacion: 'Tus rutinas de hoy, tu racha y las últimas 5 semanas.',
});

export const CLAVE_ESCRITORIO = 'stoagym.escritorio.ultimo';
const DIA_CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const COLORES: ColorFila[] = ['Serie1', 'Serie2', 'Serie3', 'Serie4'];

/** Día de la semana (0 = domingo) de una fecha AAAA-MM-DD */
function dow(clave: string): number {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d, 12).getDay();
}
function restarDias(clave: string, n: number): string {
  const [a, m, d] = clave.split('-').map(Number);
  return fechaLocal(new Date(a, m - 1, d - n, 12).getTime());
}
/** Días de la rutina en orden lunes→domingo: "LUN · JUE" */
function diasTexto(r: Rutina): string {
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => r.dias.includes(d)).map((d) => DIA_CORTO[d]).join(' · ');
}

export function resumenStoaGym(perfil: Perfil, rutinas: Rutina[], ahora = Date.now()): ResumenEscritorio {
  const hoy = fechaLocal(ahora);
  const entrenados = new Set(perfil.resumen.dias.map((d) => fechaLocal(d)));
  const grilla = fechasGrilla(hoy);
  const delDia = rutinasDeHoy(rutinas, ahora);
  const listas = hechasHoy(perfil, ahora);
  const hechasDelDia = delDia.filter((r) => listas.includes(r.id)).length;
  const entrenoHoy = entrenados.has(hoy);
  const r = rango(perfil.resumen.total);
  const racha = rachaSemanas(perfil.resumen.dias, ahora);

  // Tarjeta general: los días que entrenaste
  let en30 = 0;
  for (let i = 0; i < 30; i++) if (entrenados.has(restarDias(hoy, i))) en30++;
  const general: FilaEscritorio = {
    id: 'general',
    nombre: 'Entrenamientos',
    estado: entrenoHoy ? '1' : delDia.length ? '0' : '-',
    racha,
    color: 'Oro',
    subtitulo: `${r.nombre} · NIVEL ${r.nivel}`.toUpperCase(),
    dias: grilla.map((f) => (f > hoy ? 'f' : entrenados.has(f) ? '1' : f === hoy && delDia.length ? 'p' : '-')).join(''),
    pct: (en30 / 30) * 100,
    derecha: `${perfil.resumen.total}`,
    ruta: '/progreso',
    tarjeta: true,
    unidad: 'SEMANAS',
  };

  // Una fila por rutina
  const filas = [...rutinas].sort((a, b) => a.orden - b.orden).slice(0, 7).map((rt, i): FilaEscritorio => {
    const creada = rt.creado ? fechaLocal(rt.creado) : '0000-00-00';
    const toca = (f: string) => rt.dias.includes(dow(f)) && f >= creada;
    const hechoHoy = listas.includes(rt.id);
    const dias = grilla.map((f) => {
      if (!toca(f)) return f === hoy && hechoHoy ? '1' : '-';
      if (f > hoy) return 'f';
      if (f === hoy) return hechoHoy ? '1' : 'p';
      return entrenados.has(f) ? '1' : '0';
    }).join('');
    // Racha: veces seguidas que entrenaste cuando tocaba (hoy pendiente no la corta)
    let n = 0;
    for (let k = 0; k < 400; k++) {
      const f = restarDias(hoy, k);
      if (f < creada) break;
      if (!rt.dias.includes(dow(f))) continue;
      if (f === hoy && !hechoHoy) continue;
      if (f === hoy ? hechoHoy : entrenados.has(f)) n++;
      else break;
    }
    let tocan = 0, cumplidas = 0;
    for (let k = 0; k < 30; k++) {
      const f = restarDias(hoy, k);
      if (!toca(f) || (f === hoy && !hechoHoy)) continue;
      tocan++;
      if (f === hoy ? hechoHoy : entrenados.has(f)) cumplidas++;
    }
    return {
      id: rt.id,
      nombre: rt.nombre,
      estado: rt.dias.includes(dow(hoy)) ? (hechoHoy ? '1' : '0') : hechoHoy ? '1' : '-',
      racha: n,
      color: COLORES[i % COLORES.length],
      subtitulo: `${rt.ejercicios.length} EJERCICIOS · ${diasTexto(rt) || 'SIN DÍAS'}`,
      dias,
      pct: tocan ? (cumplidas / tocan) * 100 : 0,
      derecha: diasTexto(rt).replace(/ · /g, '·') || '—',
      ruta: `/rutinas/${rt.id}/ver`,
      tarjeta: true,
      unidad: 'VECES',
    };
  });

  const resumen = delDia.length
    ? `HOY · ${hechasDelDia} DE ${delDia.length} ${delDia.length === 1 ? 'RUTINA' : 'RUTINAS'}${hechasDelDia === delDia.length ? ' · CUMPLIDO' : ''}`
    : entrenoHoy ? 'HOY · ENTRENAMIENTO HECHO' : 'HOY TOCA DESCANSO';
  return {
    nombre: (perfil.nombre || 'Invitado').split(' ')[0],
    hoy,
    resumen,
    barra: delDia.length ? (hechasDelDia / delDia.length) * 100 : entrenoHoy ? 100 : 0,
    unidadRacha: 'SEMANAS',
    filas: [general, ...filas],
  };
}
