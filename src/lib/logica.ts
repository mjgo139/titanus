import type {
  EjercicioEntreno, EstadoEjercicio, Rutina, Record, Unidad, Serie,
} from './tipos';

const DIA = 86_400_000;

/* ───────── Números romanos ───────── */
export function romano(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 4000) return String(n);
  const tabla: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let r = '';
  let x = Math.floor(n);
  for (const [v, s] of tabla) while (x >= v) { r += s; x -= v; }
  return r;
}

/* ───────── Fechas ───────── */
export function inicioDia(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Lunes 00:00 de la semana de `t` (hora local) */
export function inicioSemana(t: number): number {
  const d = new Date(inicioDia(t));
  const dow = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export function claveDia(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

/** Agrega un día (normalizado) a la lista sin repetir y en orden */
export function agregarDia(dias: number[], t: number): number[] {
  const d = inicioDia(t);
  if (dias.includes(d)) return dias;
  return [...dias, d].sort((a, b) => a - b);
}

/**
 * Racha de semanas entrenadas seguidas.
 * Si esta semana todavía no entrenó, la racha sigue viva y se cuenta desde la semana anterior.
 */
export function rachaSemanas(dias: number[], hoy = Date.now()): number {
  if (!dias.length) return 0;
  const semanas = new Set(dias.map((d) => inicioSemana(d)));
  let s = inicioSemana(hoy);
  if (!semanas.has(s)) s = inicioSemana(s - DIA);
  let n = 0;
  while (semanas.has(s)) {
    n++;
    s = inicioSemana(s - DIA);
  }
  return n;
}

export interface DiaSemana { fecha: number; letra: string; hecho: boolean; hoy: boolean; futuro: boolean }

export function semanaActual(dias: number[], hoy = Date.now()): DiaSemana[] {
  const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const set = new Set(dias.map(inicioDia));
  const lunes = inicioSemana(hoy);
  const hoyD = inicioDia(hoy);
  return letras.map((letra, i) => {
    const f = new Date(lunes);
    f.setDate(f.getDate() + i);
    const fecha = f.getTime();
    return { fecha, letra, hecho: set.has(fecha), hoy: fecha === hoyD, futuro: fecha > hoyD };
  });
}

/* ───────── Rutinas ───────── */
export function rutinaDeHoy(rutinas: Rutina[], hoy = Date.now()): Rutina | undefined {
  const dow = new Date(hoy).getDay();
  return [...rutinas].sort((a, b) => a.orden - b.orden).find((r) => r.dias.includes(dow));
}

export const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ───────── Series, volumen y récords ───────── */
export function seriesHechas(e: EjercicioEntreno): Serie[] {
  return e.series.filter((s) => s.hecha && s.reps > 0);
}

export function volumenEjercicio(e: EjercicioEntreno): number {
  return seriesHechas(e).reduce((t, s) => t + s.peso * s.reps, 0);
}

export function pesoMaximo(e: EjercicioEntreno): number {
  return seriesHechas(e).reduce((m, s) => Math.max(m, s.peso), 0);
}

export function volumenTotal(ejs: EjercicioEntreno[]): number {
  return ejs.reduce((t, e) => t + volumenEjercicio(e), 0);
}

export function contarSeries(ejs: EjercicioEntreno[]): number {
  return ejs.reduce((t, e) => t + seriesHechas(e).length, 0);
}

/** Compara contra los mejores registros anteriores. El primer entrenamiento de un ejercicio no cuenta como récord. */
export function detectarRecords(
  ejs: EjercicioEntreno[],
  estados: Map<string, EstadoEjercicio>,
): Record[] {
  const r: Record[] = [];
  for (const e of ejs) {
    const est = estados.get(e.ejercicioId);
    if (!est || !est.ultima) continue;
    const p = pesoMaximo(e);
    const v = volumenEjercicio(e);
    if (p > 0 && p > est.mejorPeso) r.push({ ejercicioId: e.ejercicioId, tipo: 'peso', valor: p });
    if (v > 0 && v > est.mejorVolumen) r.push({ ejercicioId: e.ejercicioId, tipo: 'volumen', valor: v });
  }
  return r;
}

export const MAX_PUNTOS = 200;

export function actualizarEstado(
  previo: EstadoEjercicio | undefined,
  e: EjercicioEntreno,
  fecha: number,
): EstadoEjercicio | undefined {
  const hechas = seriesHechas(e);
  if (!hechas.length) return previo;
  const p = pesoMaximo(e);
  const v = volumenEjercicio(e);
  const puntos = [...(previo?.puntos ?? []), { fecha, pesoMax: p, volumen: v }].slice(-MAX_PUNTOS);
  return {
    ejercicioId: e.ejercicioId,
    ultima: { fecha, series: hechas.map((s) => ({ peso: s.peso, reps: s.reps })) },
    mejorPeso: Math.max(previo?.mejorPeso ?? 0, p),
    mejorVolumen: Math.max(previo?.mejorVolumen ?? 0, v),
    puntos,
  };
}

/* ───────── Unidades ───────── */
const LB = 2.2046226218;
export function aUnidad(kg: number, u: Unidad): number {
  return u === 'kg' ? kg : kg * LB;
}
export function aKg(valor: number, u: Unidad): number {
  return u === 'kg' ? valor : valor / LB;
}
export function redondear(n: number, dec = 1): number {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}
export function formatoPeso(kg: number, u: Unidad, dec = 1): string {
  return `${formatoNumero(redondear(aUnidad(kg, u), dec))} ${u}`;
}
export function formatoNumero(n: number): string {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 1 }).format(n);
}

/* ───────── Textos ───────── */
export function saludo(hora: number): string {
  if (hora < 5) return 'Buenas noches';
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function duracion(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function reloj(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function fechaLarga(t: number): string {
  return new Intl.DateTimeFormat('es-PY', { weekday: 'long', day: 'numeric', month: 'long' }).format(t);
}
export function fechaCorta(t: number): string {
  return new Intl.DateTimeFormat('es-PY', { day: 'numeric', month: 'short' }).format(t);
}

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
