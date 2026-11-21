import { describe, expect, it } from 'vitest';
import { BIBLIOTECA } from './biblioteca';
import { iniciarDesdeRutina } from './entreno';
import { PROGRAMAS, buscarPrograma, deIdSesion, marcarSesion, proximaSesion, rutinaDeSesion, totalSesiones } from './programas';

describe('programas', () => {
  it('todos usan ejercicios de la biblioteca y son gratis por ahora', () => {
    const ids = new Set(BIBLIOTECA.map((e) => e.id));
    for (const p of PROGRAMAS) {
      expect(p.acceso).toBe('gratis');
      for (const s of p.semanas) for (const ses of s.sesiones) for (const e of ses.ejercicios) expect(ids.has(e.ejercicioId), `${p.id}: ${e.ejercicioId}`).toBe(true);
    }
    expect(new Set(PROGRAMAS.map((p) => p.id)).size).toBe(PROGRAMAS.length);
  });
  it('avanza sesión por sesión y termina', () => {
    const p = buscarPrograma('mas-dominadas')!;
    let a = { id: p.id, inicio: 0, hechas: [] as string[] };
    expect(proximaSesion(p, a.hechas)?.clave).toBe('s1-1');
    a = marcarSesion(a, 's1-1');
    a = marcarSesion(a, 's1-1');
    expect(a.hechas).toEqual(['s1-1']);
    expect(proximaSesion(p, a.hechas)?.clave).toBe('s1-2');
    for (let w = 0; w < p.semanas.length; w++) for (let k = 0; k < p.semanas[w].sesiones.length; k++) a = marcarSesion(a, `s${w + 1}-${k + 1}`);
    expect(a.hechas).toHaveLength(totalSesiones(p));
    expect(proximaSesion(p, a.hechas)).toBeNull();
  });
  it('una sesión se entrena como una rutina y se reconoce al guardarla', () => {
    const p = buscarPrograma('abdomen-acero')!;
    const r = rutinaDeSesion(p, 1, 0);
    expect(deIdSesion(r.id)).toEqual({ programaId: 'abdomen-acero', clave: 's2-1' });
    expect(deIdSesion('r-123')).toBeNull();
    const b = iniciarDesdeRutina(r, new Map(), Date.now());
    expect(b.rutinaId).toBe(r.id);
    expect(b.ejercicios[0].series[0].reps).toBe(40);
  });
});

describe('lugares de los programas', () => {
  it('cada lugar (gimnasio, calistenia, en casa) tiene al menos dos programas', async () => {
    const { PROGRAMAS, LUGARES } = await import('./programas');
    for (const l of LUGARES) expect(PROGRAMAS.filter((p) => p.lugar === l.id).length).toBeGreaterThanOrEqual(2);
    for (const p of PROGRAMAS) expect(p.equipo.length).toBeGreaterThan(3);
  });
});

describe('carátulas de los programas', () => {
  it('elige la de la figura, si falta usa la otra y los archivos existen', async () => {
    const { PROGRAMAS, portadaDe, buscarPrograma } = await import('./programas');
    const { existsSync } = await import('node:fs');
    expect(portadaDe(buscarPrograma('fuerza-5x5')!, 'mujer')).toBe('/programas/fuerza-5x5-m.webp');
    expect(portadaDe(buscarPrograma('fuerza-5x5')!, 'hombre')).toBe('/programas/fuerza-5x5-h.webp');
    expect(portadaDe(buscarPrograma('gluteos-gladiadora')!, 'hombre')).toBe('/programas/gluteos-gladiadora-m.webp');
    for (const p of PROGRAMAS) for (const f of ['hombre', 'mujer'] as const) {
      const r = portadaDe(p, f);
      if (r) expect(existsSync(`public${r}`), r).toBe(true);
    }
  });
});

describe('varios programas a la vez', () => {
  it('lee el formato viejo, suma hasta 3, quita y marca en el que corresponde', async () => {
    const { programasActivos, sumarPrograma, quitarPrograma, marcarEnLista, MAX_PROGRAMAS } = await import('./programas');
    expect(MAX_PROGRAMAS).toBe(3);
    expect(programasActivos({ programa: { id: 'x', inicio: 1, hechas: ['s1-1'] } })).toEqual([{ id: 'x', inicio: 1, hechas: ['s1-1'] }]);
    expect(programasActivos({ programa: null })).toEqual([]);
    let l = sumarPrograma([], 'a', 1)!;
    l = sumarPrograma(l, 'b', 1)!;
    expect(sumarPrograma(l, 'a', 1)).toBe(l);
    l = sumarPrograma(l, 'c', 1)!;
    expect(sumarPrograma(l, 'd', 1)).toBeNull();
    l = marcarEnLista(l, 'b', 's1-1');
    expect(l.find((a) => a.id === 'b')!.hechas).toEqual(['s1-1']);
    expect(l.find((a) => a.id === 'a')!.hechas).toEqual([]);
    expect(quitarPrograma(l, 'a').map((a) => a.id)).toEqual(['b', 'c']);
  });
});
