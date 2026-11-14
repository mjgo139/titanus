import { describe, expect, it } from 'vitest';
import {
  aKg, aUnidad, actualizarEstado, agregarDia, detectarRecords, duracion, e1rm, inicioSemana, mejorSerie,
  rachaSemanas, rango, reloj, romano, rutinaDeHoy, saludo, semanaActual, semanasEnRango, sumarSemana,
  volumenTotal, MAX_PUNTOS, MAX_SEMANAS,
} from './logica';
import { cerrarEntrenamiento, ejercicioNuevo, iniciarDesdeRutina, iniciarLibre, iniciarRepeticion, rutinaDesdeEntreno } from './entreno';
import { BIBLIOTECA, MUSCULOS, buscarEjercicio } from './biblioteca';
import { PLANTILLAS, rutinasDePlantilla, textoObjetivo } from './plantillas';
import { FRASES, fraseDelDia } from './frases';
import type { EjercicioEntreno, EstadoEjercicio, Rutina } from './tipos';

// Sábado 14 de noviembre de 2026, 15:00 hora local
const SAB = new Date(2026, 10, 14, 15).getTime();
const dia = (d: number, h = 18) => new Date(2026, 10, d, h).getTime();

describe('números romanos', () => {
  it('convierte bien', () => {
    expect(romano(1)).toBe('I');
    expect(romano(4)).toBe('IV');
    expect(romano(9)).toBe('IX');
    expect(romano(13)).toBe('XIII');
    expect(romano(49)).toBe('XLIX');
    expect(romano(2026)).toBe('MMXXVI');
    expect(romano(0)).toBe('—');
  });
});

describe('semanas y racha', () => {
  it('la semana empieza el lunes', () => {
    expect(new Date(inicioSemana(SAB)).getDay()).toBe(1);
    expect(new Date(inicioSemana(SAB)).getDate()).toBe(9);
  });
  it('cuenta semanas seguidas', () => {
    expect(rachaSemanas([dia(13), dia(4), new Date(2026, 9, 27).getTime()], SAB)).toBe(3);
  });
  it('si esta semana no entrenó, la racha sigue viva desde la anterior', () => {
    expect(rachaSemanas([dia(5), dia(3)], SAB)).toBe(1);
  });
  it('una semana sin entrenar corta la racha', () => {
    expect(rachaSemanas([dia(13), new Date(2026, 9, 28).getTime()], SAB)).toBe(1);
    expect(rachaSemanas([], SAB)).toBe(0);
  });
  it('agregarDia no repite el mismo día', () => {
    const a = agregarDia([], dia(10, 8));
    expect(agregarDia(a, dia(10, 20))).toHaveLength(1);
    expect(agregarDia(a, dia(11))).toHaveLength(2);
  });
  it('semanaActual marca hecho, hoy y futuro', () => {
    const s = semanaActual([dia(10)], SAB);
    expect(s.map((d) => d.letra).join('')).toBe('LMMJVSD');
    expect(s[1].hecho).toBe(true);
    expect(s[5].hoy).toBe(true);
    expect(s[6].futuro).toBe(true);
  });
});

describe('rutina de hoy', () => {
  const r = (id: string, dias: number[], orden: number): Rutina => ({ id, nombre: id, dias, ejercicios: [], orden, creado: 0 });
  it('elige la rutina del día de la semana', () => {
    expect(rutinaDeHoy([r('a', [1], 0), r('b', [6], 1)], SAB)?.id).toBe('b');
    expect(rutinaDeHoy([r('a', [1], 0)], SAB)).toBeUndefined();
  });
});

const ej = (id: string, series: [number, number, boolean?][]): EjercicioEntreno => ({
  ejercicioId: id, series: series.map(([peso, reps, hecha = true]) => ({ peso, reps, hecha })),
});

describe('volumen y récords', () => {
  it('suma solo series hechas', () => {
    expect(volumenTotal([ej('a', [[50, 10], [50, 8], [60, 5, false]])])).toBe(900);
  });
  it('el primer entrenamiento de un ejercicio no es récord', () => {
    expect(detectarRecords([ej('a', [[50, 10]])], new Map())).toEqual([]);
  });
  it('detecta récord de peso y de volumen', () => {
    const prev = actualizarEstado(undefined, ej('a', [[50, 10]]), 1)!;
    const r = detectarRecords([ej('a', [[55, 10], [50, 10]])], new Map([['a', prev]]));
    expect(r).toEqual([
      { ejercicioId: 'a', tipo: 'peso', valor: 55 },
      { ejercicioId: 'a', tipo: '1rm', valor: 73.33 },
      { ejercicioId: 'a', tipo: 'volumen', valor: 1050 },
    ]);
  });
  it('igualar la marca no es récord', () => {
    const prev = actualizarEstado(undefined, ej('a', [[50, 10]]), 1)!;
    expect(detectarRecords([ej('a', [[50, 10]])], new Map([['a', prev]]))).toEqual([]);
  });
  it('actualizarEstado guarda la última vez y limita los puntos', () => {
    let e: EstadoEjercicio | undefined;
    for (let i = 0; i < MAX_PUNTOS + 10; i++) e = actualizarEstado(e, ej('a', [[40 + (i % 3), 8]]), i);
    expect(e!.puntos).toHaveLength(MAX_PUNTOS);
    expect(e!.mejorPeso).toBe(42);
    expect(e!.ultima!.series).toEqual([{ peso: 40 + ((MAX_PUNTOS + 9) % 3), reps: 8 }]);
    expect(actualizarEstado(e, ej('a', [[90, 5, false]]), 999)).toBe(e);
  });
});

describe('entrenamiento completo', () => {
  const rutina: Rutina = {
    id: 'r', nombre: 'Pecho', dias: [6], orden: 0, creado: 0,
    ejercicios: [{ ejercicioId: 'press-banca', series: 3, reps: 8, descanso: 90 }, { ejercicioId: 'aperturas', series: 2, reps: 12, descanso: 60 }],
  };
  it('arranca con el peso de la última vez', () => {
    const prev = new Map([['press-banca', actualizarEstado(undefined, ej('press-banca', [[60, 8], [62.5, 6]]), 1)!]]);
    const b = iniciarDesdeRutina(rutina, prev, SAB);
    expect(b.ejercicios[0].series.map((s) => s.peso)).toEqual([60, 62.5, 62.5]);
    expect(b.ejercicios[1].series.map((s) => s.peso)).toEqual([0, 0]);
    expect(b.ejercicios[0].series.every((s) => s.reps === 8 && !s.hecha)).toBe(true);
  });
  it('al cerrar guarda solo lo hecho y actualiza el resumen', () => {
    const prev = new Map([['press-banca', actualizarEstado(undefined, ej('press-banca', [[60, 8]]), 1)!]]);
    const b = iniciarDesdeRutina(rutina, prev, SAB);
    b.ejercicios[0].series[0] = { peso: 65, reps: 8, hecha: true };
    const c = cerrarEntrenamiento(b, prev, { dias: [dia(10)], total: 4 }, SAB + 3600_000);
    expect(c.entreno.ejercicios).toHaveLength(1);
    expect(c.entreno.volumen).toBe(520);
    expect(c.entreno.records.map((r) => r.tipo)).toEqual(['peso', '1rm', 'volumen']);
    expect(c.entreno.numero).toBe(5);
    expect(Object.values(c.resumen.semanas!)[0]).toEqual({ v: 520, n: 1, m: 60 });
    expect(c.estados[0].mejorPeso).toBe(65);
    expect(c.resumen.total).toBe(5);
    expect(c.resumen.dias).toHaveLength(2);
  });
});

describe('unidades y textos', () => {
  it('kg ↔ lb', () => {
    expect(aUnidad(100, 'lb')).toBeCloseTo(220.46, 1);
    expect(aKg(aUnidad(80, 'lb'), 'lb')).toBeCloseTo(80, 6);
    expect(aUnidad(80, 'kg')).toBe(80);
  });
  it('formatos de tiempo y saludo', () => {
    expect(reloj(95)).toBe('01:35');
    expect(duracion(65 * 60_000)).toBe('1 h 5 min');
    expect(saludo(8)).toBe('Buenos días');
    expect(saludo(15)).toBe('Buenas tardes');
    expect(saludo(22)).toBe('Buenas noches');
  });
});

describe('biblioteca y frases', () => {
  it('tiene unos 60 ejercicios con id único y músculo válido', () => {
    expect(BIBLIOTECA.length).toBeGreaterThanOrEqual(58);
    expect(new Set(BIBLIOTECA.map((e) => e.id)).size).toBe(BIBLIOTECA.length);
    expect(BIBLIOTECA.every((e) => MUSCULOS.includes(e.musculo))).toBe(true);
  });
  it('la frase del día es estable durante el día y cambia al siguiente', () => {
    expect(fraseDelDia(dia(14, 7))).toEqual(fraseDelDia(dia(14, 22)));
    expect(fraseDelDia(dia(14))).not.toEqual(fraseDelDia(dia(15)));
    expect(FRASES.every((f) => ['Séneca', 'Marco Aurelio', 'Epicteto'].includes(f.autor))).toBe(true);
  });
});

describe('estilo Hevy: 1RM, tipos de serie y repetir', () => {
  it('1RM estimado con Epley', () => {
    expect(e1rm(100, 1)).toBe(100);
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1);
    expect(e1rm(0, 10)).toBe(0);
  });
  it('las series de calentamiento no cuentan para récords pero sí para el volumen', () => {
    const prev = actualizarEstado(undefined, ej('a', [[50, 10]]), 1)!;
    const hoy: EjercicioEntreno = { ejercicioId: 'a', series: [
      { peso: 80, reps: 5, hecha: true, tipo: 'calentamiento' }, { peso: 50, reps: 10, hecha: true, tipo: 'normal' },
    ] };
    expect(detectarRecords([hoy], new Map([['a', prev]])).map((r) => r.tipo)).toEqual(['volumen']);
    expect(volumenTotal([hoy])).toBe(900);
    expect(mejorSerie(hoy)?.peso).toBe(50);
  });
  it('ejercicio nuevo toma pesos y reps de la última vez', () => {
    const est = actualizarEstado(undefined, ej('a', [[40, 12], [45, 10]]), 1)!;
    const e = ejercicioNuevo('a', est, 3, 8, 60);
    expect(e.series.map((s) => [s.peso, s.reps])).toEqual([[40, 12], [45, 10], [45, 10]]);
    expect(e.descanso).toBe(60);
    expect(ejercicioNuevo('b', undefined).series[0]).toMatchObject({ peso: 0, reps: 10, hecha: false });
  });
  it('entrenamiento libre, repetir y guardar como rutina', () => {
    expect(iniciarLibre(new Date(2026, 10, 14, 8).getTime()).nombre).toBe('Entrenamiento de la mañana');
    const c = cerrarEntrenamiento({ nombre: 'Libre', inicio: SAB, ejercicios: [{ ejercicioId: 'a', descanso: 75, series: [
      { peso: 50, reps: 10, hecha: true, tipo: 'fallo' }, { peso: 50, reps: 8, hecha: true },
    ] }] }, new Map(), { dias: [], total: 0 }, SAB + 1000);
    const rep = iniciarRepeticion(c.entreno);
    expect(rep.ejercicios[0].series.every((s) => !s.hecha)).toBe(true);
    expect(rep.ejercicios[0].series[0].tipo).toBe('fallo');
    const r = rutinaDesdeEntreno(c.entreno, 2);
    expect(r.ejercicios[0]).toMatchObject({ ejercicioId: 'a', series: 2, reps: 8, descanso: 75 });
    expect(r.orden).toBe(2);
  });
});

describe('semanas, rango y nivel', () => {
  it('suma por semana y recorta a las últimas', () => {
    let s = sumarSemana(undefined, dia(10), 1000, 50);
    s = sumarSemana(s, dia(12), 500, 40);
    expect(Object.values(s)).toEqual([{ v: 1500, n: 2, m: 90 }]);
    for (let i = 1; i <= MAX_SEMANAS + 5; i++) s = sumarSemana(s, dia(10) - i * 7 * 86_400_000, 1, 1);
    expect(Object.keys(s)).toHaveLength(MAX_SEMANAS);
  });
  it('semanasEnRango rellena las semanas vacías', () => {
    const s = sumarSemana(undefined, dia(10), 1000, 50);
    const r = semanasEnRango(s, 4, SAB);
    expect(r).toHaveLength(4);
    expect(r[3].v).toBe(1000);
    expect(r[0].v).toBe(0);
  });
  it('rango por hitos y nivel cada 5', () => {
    expect(rango(0)).toMatchObject({ nombre: 'Recluta', nivel: 1, siguiente: 'Legionario', faltan: 10 });
    expect(rango(23)).toMatchObject({ nombre: 'Legionario', nivel: 5 });
    expect(rango(400)).toMatchObject({ nombre: 'César', progreso: 1 });
  });
});

describe('plantilla Full body principiante', () => {
  const p = PLANTILLAS.find((x) => x.id === 'fullbody-principiante')!;
  it('tiene A (lunes), B (miércoles) y C (viernes) con ejercicios de la biblioteca', () => {
    expect(p.rutinas.map((r) => r.dias[0])).toEqual([1, 3, 5]);
    expect(p.rutinas.map((r) => r.ejercicios.length)).toEqual([7, 8, 7]);
    for (const r of p.rutinas) for (const e of r.ejercicios) expect(buscarEjercicio(e.ejercicioId), e.ejercicioId).toBeTruthy();
  });
  it('respeta la pizarra: 3×6 + 1 al fallo, rangos y alternativas', () => {
    const [a, b] = p.rutinas;
    expect(textoObjetivo(a.ejercicios[0])).toBe('3×6 + 1 al fallo');
    expect(textoObjetivo(a.ejercicios[5])).toBe('3×8–12');
    expect(textoObjetivo(b.ejercicios[6])).toBe('5×10–15');
    expect(a.ejercicios[3].nota).toBe('o Jalón al pecho');
  });
  it('al entrenar, la serie al fallo queda marcada como tal', () => {
    const [r] = rutinasDePlantilla(p, 0);
    const bor = iniciarDesdeRutina(r, new Map());
    expect(bor.ejercicios[0].series.map((s) => s.tipo)).toEqual(['normal', 'normal', 'normal', 'fallo']);
    expect(bor.ejercicios[0].objetivo).toBe('3×6 + 1 al fallo');
    expect(bor.ejercicios[3].objetivo).toBe('3×8 · o Jalón al pecho');
    const c = cerrarEntrenamiento({ ...bor, ejercicios: [{ ...bor.ejercicios[0], series: bor.ejercicios[0].series.map((s) => ({ ...s, peso: 60, reps: 6, hecha: true })) }] }, new Map(), { dias: [], total: 0 });
    expect(c.entreno.ejercicios[0]).not.toHaveProperty('objetivo');
  });
});

describe('columna ANTERIOR por tipo de serie', () => {
  it('compara normal con normal y fallo con fallo', async () => {
    const { anteriorPara } = await import('./entreno');
    const previas = [{ peso: 60, reps: 8 }, { peso: 60, reps: 8 }, { peso: 60, reps: 12, tipo: 'fallo' as const }];
    const hoy = [0, 1, 2, 3].map((i) => ({ peso: 0, reps: 0, hecha: false, tipo: (i === 3 ? 'fallo' : 'normal') as 'fallo' | 'normal' }));
    expect(anteriorPara(previas, hoy, 0)).toEqual({ peso: 60, reps: 8 });
    expect(anteriorPara(previas, hoy, 2)).toEqual({ peso: 60, reps: 8 });
    expect(anteriorPara([{ peso: 60, reps: 8 }], hoy, 3)).toBeUndefined();
    expect(anteriorPara(previas, hoy, 3)).toEqual({ peso: 60, reps: 12, tipo: 'fallo' });
  });
});

describe('sobrecarga progresiva', async () => {
  const { sugerirSobrecarga } = await import('./sobrecarga');
  const { aplicarSugerencia } = await import('./entreno');
  const aj = { modo: 'manual' as const, superior: 1.25, inferior: 2.5 };
  const ult = (series: [number, number, ('fallo' | undefined)?][]) => ({ fecha: 1, series: series.map(([peso, reps, tipo]) => ({ peso, reps, ...(tipo ? { tipo } : {}) })) });
  it('sube el peso si cumplió todas las reps (piernas +2,5, tren superior +1,25)', () => {
    expect(sugerirSobrecarga('sentadilla', ult([[80, 6], [80, 6], [80, 6], [80, 9, 'fallo']]), { reps: 6 }, aj)).toMatchObject({ accion: 'subir', peso: 82.5, reps: 6 });
    expect(sugerirSobrecarga('press-banca', ult([[60, 6], [60, 6]]), { reps: 6 }, aj)).toMatchObject({ accion: 'subir', peso: 61.25 });
  });
  it('con rango, sube solo al llegar al máximo', () => {
    expect(sugerirSobrecarga('curl-barra', ult([[25, 12], [25, 11]]), { reps: 8, repsMax: 12 }, aj)).toMatchObject({ accion: 'mantener', peso: 25, reps: 12 });
    expect(sugerirSobrecarga('curl-barra', ult([[25, 12], [25, 12]]), { reps: 8, repsMax: 12 }, aj)).toMatchObject({ accion: 'subir', peso: 26.25, reps: 8 });
  });
  it('si faltaron reps mantiene el peso y dice cuántas', () => {
    const s = sugerirSobrecarga('sentadilla', ult([[80, 6], [80, 5], [80, 4]]), { reps: 6 }, aj)!;
    expect(s).toMatchObject({ accion: 'mantener', peso: 80 });
    expect(s.texto).toContain('3 repeticiones');
  });
  it('peso corporal progresa con repeticiones; apagada o sin historial no sugiere', () => {
    expect(sugerirSobrecarga('dominadas', ult([[0, 8], [0, 8]]), { reps: 8 }, aj)).toMatchObject({ accion: 'reps', reps: 9 });
    expect(sugerirSobrecarga('sentadilla', ult([[80, 6]]), { reps: 6 }, { ...aj, modo: 'apagada' })).toBeUndefined();
    expect(sugerirSobrecarga('sentadilla', undefined, { reps: 6 }, aj)).toBeUndefined();
  });
  it('en automático la rutina ya arranca con el peso nuevo; en manual no', () => {
    const r = { id: 'r', nombre: 'A', dias: [1], orden: 0, creado: 0, ejercicios: [{ ejercicioId: 'sentadilla', series: 3, reps: 6, alFallo: 1, descanso: 120 }] };
    const est = new Map([['sentadilla', { ejercicioId: 'sentadilla', mejorPeso: 80, mejorVolumen: 0, puntos: [], ultima: ult([[80, 6], [80, 6], [80, 6], [80, 10, 'fallo']]) }]]);
    const auto = iniciarDesdeRutina(r, est, 0, { ...aj, modo: 'auto' });
    expect(auto.ejercicios[0].series.map((s) => s.peso)).toEqual([82.5, 82.5, 82.5, 82.5]);
    expect(auto.ejercicios[0].sugerencia?.aplicada).toBe(true);
    const manual = iniciarDesdeRutina(r, est, 0, aj);
    expect(manual.ejercicios[0].series[0].peso).toBe(80);
    expect(manual.ejercicios[0].sugerencia).toMatchObject({ accion: 'subir', aplicada: false });
    expect(aplicarSugerencia(manual.ejercicios[0].series, manual.ejercicios[0].sugerencia!).map((s) => s.peso)).toEqual([82.5, 82.5, 82.5, 82.5]);
  });
});
