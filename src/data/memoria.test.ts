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
    await r.registrar('Ana', 'ana@ejemplo.com', 'secreta');
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
