import { describe, expect, it } from 'vitest';
import { RepoMemoria } from './memoria';
import { USUARIO_PRUEBA, CLAVE_PRUEBA } from './semilla';

describe('modo prueba en memoria', () => {
  it('trae la cuenta de ejemplo con datos inventados', async () => {
    const r = new RepoMemoria();
    await r.ingresar(USUARIO_PRUEBA.email, CLAVE_PRUEBA);
    const p = await r.leerPerfil(USUARIO_PRUEBA);
    expect(p.resumen.total).toBeGreaterThan(15);
    expect(await r.leerRutinas(USUARIO_PRUEBA.uid)).toHaveLength(3);
    expect((await r.leerHistorial(USUARIO_PRUEBA.uid, 5)).length).toBe(5);
    expect((await r.leerEstados(USUARIO_PRUEBA.uid, ['press-banca'])).get('press-banca')?.mejorPeso).toBeGreaterThan(50);
    expect((await r.leerRutinas(USUARIO_PRUEBA.uid)).map((x) => x.nombre)).toEqual(['A · Full body', 'B · Full body', 'C · Full body']);
    expect(await r.esAdmin(USUARIO_PRUEBA.uid)).toBe(true);
  });
  it('rechaza contraseña incorrecta y registra cuentas nuevas vacías', async () => {
    const r = new RepoMemoria();
    await expect(r.ingresar(USUARIO_PRUEBA.email, 'x')).rejects.toMatchObject({ code: 'auth/invalid-credential' });
    let actual: string | null = null;
    r.escucharSesion((u) => { actual = u?.uid ?? null; });
    await r.registrar('Sofía', 'sofia@ejemplo.com', 'secreta');
    expect(actual).toMatch(/^u-/);
    expect(await r.leerRutinas(actual!)).toEqual([]);
    expect(await r.esAdmin(actual!)).toBe(false);
  });
  it('en modo prueba el invitado ve la rutina Full body ya hecha', async () => {
    const r = new RepoMemoria();
    let uid = '';
    r.escucharSesion((u) => { uid = u?.uid ?? ''; });
    await r.ingresarComoInvitado();
    expect(uid).toMatch(/^inv-/);
    expect((await r.leerPerfil({ uid, email: '', nombre: '' })).resumen.total).toBeGreaterThan(20);
    const h = await r.leerHistorial(uid, 1);
    expect(h[0].ejercicios.some((e) => e.series.some((s) => s.tipo === 'fallo'))).toBe(true);
  });
  it('borrar cuenta elimina los datos', async () => {
    const r = new RepoMemoria();
    await r.ingresar(USUARIO_PRUEBA.email, CLAVE_PRUEBA);
    await r.borrarCuenta();
    await expect(r.ingresar(USUARIO_PRUEBA.email, CLAVE_PRUEBA)).rejects.toBeTruthy();
  });
});

describe('modo prueba: entrenador y clientes', () => {
  it('el entrenador ve a sus clientes; otro usuario no', async () => {
    const r = new RepoMemoria();
    await r.ingresar(USUARIO_PRUEBA.email, 'titanus');
    const cs = await r.leerClientes(USUARIO_PRUEBA.uid);
    expect(cs.map((c) => c.nombreCliente).sort()).toEqual(['Ana Ruiz', 'Bruno Paz', 'Carla Gómez']);
    expect((await r.leerPerfilDe('c-ana'))?.nombre).toBe('Ana Ruiz');
    await r.ingresar('bruno@ejemplo.com', 'titanus');
    await expect(r.leerHistorial('c-ana', 5)).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('la clienta no cambia la rutina asignada y puede cortar el vínculo', async () => {
    const r = new RepoMemoria();
    await r.ingresar('ana@ejemplo.com', 'titanus');
    const rs = await r.leerRutinas('c-ana');
    const asignada = rs.find((x) => x.asignadaPor)!;
    await expect(r.guardarRutina('c-ana', { ...asignada, nombre: 'Otra' })).rejects.toMatchObject({ code: 'permission-denied' });
    const [v] = await r.leerMisProfesionales('c-ana');
    await r.terminarVinculo(v.id);
    await r.ingresar(USUARIO_PRUEBA.email, 'titanus');
    await expect(r.leerPerfilDe('c-ana')).rejects.toMatchObject({ code: 'permission-denied' });
  });
  it('vincularse exige un código válido', async () => {
    const r = new RepoMemoria();
    await r.ingresar('carla@ejemplo.com', 'titanus');
    await expect(r.vincular({ uid: 'c-carla', nombre: 'Carla' }, 'TIT-NADA', 'entrenador')).rejects.toMatchObject({ code: 'pro/codigo' });
    await expect(r.vincular({ uid: 'prueba', nombre: 'Marco' }, 'tit m4rc', 'entrenador')).rejects.toMatchObject({ code: 'pro/propio' });
  });
});

describe('modo prueba: datos guardados por una versión anterior', () => {
  it('suma las cuentas y clientes de ejemplo nuevos sin perder lo que había', async () => {
    const guardado = new Map<string, string>();
    (globalThis as { sessionStorage?: unknown }).sessionStorage = {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => { guardado.set(k, v); },
      removeItem: (k: string) => { guardado.delete(k); },
    };
    try {
      // Así guardaba la sesión la versión 1.6: sin entrenador, sin clientes y sin la cuenta de Ana
      const viejo = new RepoMemoria(Date.now(), false);
      await viejo.ingresar(USUARIO_PRUEBA.email, 'titanus');
      const plano = {
        usuario: USUARIO_PRUEBA,
        cuentas: [[USUARIO_PRUEBA.email, { u: USUARIO_PRUEBA, clave: 'titanus' }]],
        datos: { [USUARIO_PRUEBA.uid]: { perfil: await viejo.leerPerfil(USUARIO_PRUEBA), rutinas: [], propios: [], estados: [], historial: [], cuerpo: [] } },
      };
      guardado.set('titanus-prueba-datos', JSON.stringify(plano));

      const r = new RepoMemoria(Date.now(), true);
      // Lo de antes se conserva (rutinas vacías) y aparecen los clientes de ejemplo
      expect(await r.leerRutinas(USUARIO_PRUEBA.uid)).toEqual([]);
      expect((await r.leerPerfilDe('c-ana'))?.nombre).toBe('Ana Ruiz');
      await r.ingresar('ana@ejemplo.com', 'titanus');
      expect((await r.leerMisProfesionales('c-ana')).length).toBe(1);
    } finally {
      delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    }
  });
});
