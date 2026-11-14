import { describe, expect, it } from 'vitest';
import {
  aKg, aUnidad, actualizarEstado, agregarDia, detectarRecords, duracion, inicioSemana,
  rachaSemanas, reloj, romano, rutinaDeHoy, saludo, semanaActual, volumenTotal, MAX_PUNTOS,
} from './logica';
import { cerrarEntrenamiento, iniciarDesdeRutina } from './entreno';
import { BIBLIOTECA, MUSCULOS } from './biblioteca';
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
    expect(c.entreno.records.map((r) => r.tipo)).toEqual(['peso', 'volumen']);
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
