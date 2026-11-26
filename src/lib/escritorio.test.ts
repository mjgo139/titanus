import { describe, expect, it } from 'vitest';
import {
  armarRmskin, armarTextoEscritorio, armarZip, archivosEscritorio, inicioGrilla, LARGO_CODIGO, nuevoCodigoEscritorio, skinIni, skinTarjetaIni, utf16le,
} from '../../familia/escritorio';
import { APP_ESCRITORIO, resumenStoaGym } from './escritorio';
import type { Perfil, Rutina } from './tipos';

// Miércoles 25/11/2026 a las 10:00
const AHORA = new Date(2026, 10, 25, 10).getTime();
const dia = (d: number, m = 11) => new Date(2026, m - 1, d, 18).getTime();
const perfil = (extra: Partial<Perfil> = {}): Perfil => ({
  uid: 'u', nombre: 'Marco Aurelio', email: 'marco@ejemplo.com', tema: 'oscuro', unidad: 'kg',
  recordatorio: { activo: false, hora: '18:30', dias: [] }, creado: 0,
  resumen: { dias: [dia(16), dia(18), dia(23)], total: 12 }, ...extra,
} as Perfil);
const rutina = (id: string, nombre: string, dias: number[], orden: number): Rutina => ({ id, nombre, dias, ejercicios: [], orden, creado: dia(1, 10) });
const colores = { verde: '1,2,3', rojo: '4,5,6', series: ['7,7,7', '8,8,8', '9,9,9', '10,10,10'] as [string, string, string, string] };

describe('widget para Windows · StoaGym', () => {
  it('el código es largo y al azar', () => {
    const a = nuevoCodigoEscritorio();
    expect(a).toHaveLength(LARGO_CODIGO);
    expect(a).toMatch(/^[a-zA-Z0-9]+$/);
    expect(nuevoCodigoEscritorio()).not.toBe(a);
  });

  it('la grilla empieza un lunes, 4 semanas antes de esta', () => {
    expect(inicioGrilla('2026-11-25')).toBe('2026-10-26');
    expect(inicioGrilla('2026-11-30')).toBe('2026-11-02');
  });

  it('resumen: entrenamientos y una fila por rutina con sus días', () => {
    // Lunes y miércoles: Pecho | Martes: Piernas | sin separadores en el nombre
    const rutinas = [rutina('a', 'Pecho | ~ "y" tríceps', [1, 3], 0), rutina('b', 'Piernas', [2], 1)];
    const r = resumenStoaGym(perfil(), rutinas, AHORA);
    expect(r.resumen).toBe('HOY · 0 DE 1 RUTINA');
    expect(r.barra).toBe(0);
    const { texto, clave } = armarTextoEscritorio(r, '10:00');
    const [cab, gen, pecho, piernas] = texto.split('~');
    expect(cab).toBe('2|Marco|2026-11-25|10:00|2026-10-26|HOY · 0 DE 1 RUTINA|0|SEMANAS');
    expect(clave.startsWith('2|Marco|2026-11-25|2026-10-26|')).toBe(true);
    const g = gen.split('|');
    // id|nombre|estado|racha|color|subtítulo|35 días|%|derecha|ruta|tarjeta|unidad
    expect(g.slice(0, 5)).toEqual(['general', 'Entrenamientos', '0', '2', 'Oro']);
    // semana del 23/11: lunes entrenado, miércoles 25 = hoy pendiente
    expect(g[6].slice(28)).toBe('1-pffff');
    expect(g.slice(8, 12)).toEqual(['12', '/progreso', '1', 'SEMANAS']);
    const p = pecho.split('|');
    expect(p.slice(0, 5)).toEqual(['a', 'Pecho y tríceps', '0', '3', 'Serie1']); // lunes 16, miércoles 18 y lunes 23
    expect(p[5]).toBe('0 EJERCICIOS · LUN · MIÉ');
    // semana anterior: lunes 16 sí, miércoles 18 sí; esta: lunes 23 sí, hoy pendiente
    expect(p[6].slice(21)).toBe('1-1----1-p----'); // los días que no tocan quedan en gris, también los que vienen
    expect(p.slice(8, 12)).toEqual(['LUN·MIÉ', '/rutinas/a/ver', '1', 'VECES']);
    const q = piernas.split('|');
    expect(q[2]).toBe('-');
    expect(q[6].slice(28)).toBe('-0-----'); // el martes 24 tocaba y no entrenó
  });

  it('rutina hecha hoy: estado 1, barra llena y "cumplido"', () => {
    const r = resumenStoaGym(perfil({ hoy: { fecha: '2026-11-25', ids: ['a'] }, resumen: { dias: [dia(23), dia(25)], total: 2 } }), [rutina('a', 'Pecho', [3], 0)], AHORA);
    expect(r.resumen).toBe('HOY · 1 DE 1 RUTINA · CUMPLIDO');
    expect(r.barra).toBe(100);
    expect(r.filas[1].estado).toBe('1');
    expect(r.filas[0].estado).toBe('1');
  });

  it('hasta 8 filas (entrenamientos + 7 rutinas)', () => {
    const muchas = Array.from({ length: 12 }, (_, i) => rutina(`r${i}`, `R${i}`, [1], i));
    const r = resumenStoaGym(perfil(), muchas, AHORA);
    expect(armarTextoEscritorio(r, '10:00').texto.split('~')).toHaveLength(9);
  });

  it('skins con la dirección del resumen, los colores y la carpeta StoaGym; textos en UTF-16 LE', () => {
    const app = APP_ESCRITORIO('titanus-10398');
    const ini = skinIni(app, 'CODIGO123', colores);
    expect(ini).toContain('projects/titanus-10398/databases/(default)/documents/escritorio/CODIGO123');
    expect(ini).toMatch(/Oro=\d+,\d+,\d+/);
    expect(ini).toContain('[MeterH8Derecha]');
    const t = skinTarjetaIni(app, 'C', 2, colores);
    expect(t).toContain('Indice=2');
    expect(t).toContain('[!ActivateConfig "StoaGym\\Tarjeta3" "Tarjeta.ini"]');
    expect(t).toContain('Accion=Entrenar ◇');
    expect(skinTarjetaIni(app, 'C', 8, colores)).not.toContain('Agregar otra tarjeta');
    const nombres = archivosEscritorio(app, 'C', colores).map((a) => a.nombre);
    expect(nombres).toContain('Skins/StoaGym/Hoy/Hoy.ini');
    expect(nombres).toContain('Skins/StoaGym/Tarjeta8/Tarjeta.ini');
    expect(Array.from(utf16le('Á\n'))).toEqual([0xff, 0xfe, 0xc1, 0x00, 0x0d, 0x00, 0x0a, 0x00]);
  });

  it('el .rmskin es un zip válido con el pie de Rainmeter', () => {
    const datos = new TextEncoder().encode('hola');
    const zip = armarZip([{ nombre: 'a.txt', datos }]);
    const p = armarRmskin([{ nombre: 'a.txt', datos }]);
    expect(p.length).toBe(zip.length + 16);
    expect(new DataView(p.buffer, p.length - 16).getUint32(0, true)).toBe(zip.length);
    expect(Array.from(p.slice(-8))).toEqual([0, 0x52, 0x4d, 0x53, 0x4b, 0x49, 0x4e, 0]);
    expect(new DataView(p.buffer).getUint32(0, true)).toBe(0x04034b50);
    expect(new DataView(p.buffer).getUint32(14, true)).toBe(0x6fa0f988);
  });
});
