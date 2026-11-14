import type {
  Ejercicio, Entrenamiento, EstadoEjercicio, Perfil, RegistroCuerpo, Rutina,
} from '../lib/tipos';
import { ErrorApp, type Repo, type Usuario } from './repo';
import { CLAVE_PRUEBA, USUARIO_PRUEBA, datosDePrueba, perfilInicial } from './semilla';

interface Datos {
  perfil?: Perfil;
  rutinas: Map<string, Rutina>;
  propios: Map<string, Ejercicio>;
  estados: Map<string, EstadoEjercicio>;
  historial: Entrenamiento[];
  cuerpo: Map<string, RegistroCuerpo>;
}

const espera = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const copia = <T,>(x: T): T => structuredClone(x);

/** Modo prueba: todo vive en la memoria del navegador. Al recargar vuelve a los datos de ejemplo. */
export class RepoMemoria implements Repo {
  readonly modo = 'prueba' as const;
  readonly permiteGoogle = true;
  private usuario: Usuario | null = null;
  private oyentes = new Set<(u: Usuario | null) => void>();
  private cuentas = new Map<string, { u: Usuario; clave: string }>();
  private datos = new Map<string, Datos>();

  constructor(ahora = Date.now()) {
    this.cuentas.set(USUARIO_PRUEBA.email, { u: USUARIO_PRUEBA, clave: CLAVE_PRUEBA });
    const s = datosDePrueba(ahora);
    const perfil = perfilInicial(USUARIO_PRUEBA);
    perfil.nombre = 'Marco';
    perfil.tema = 'oscuro';
    perfil.resumen = { dias: s.dias, total: s.historial.length, semanas: s.semanas };
    perfil.creado = ahora - 60 * 86_400_000;
    this.datos.set(USUARIO_PRUEBA.uid, {
      perfil,
      rutinas: new Map(s.rutinas.map((r) => [r.id, r])),
      propios: new Map(),
      estados: s.estados,
      historial: s.historial,
      cuerpo: new Map(s.cuerpo.map((c) => [c.id, c])),
    });
  }

  private d(uid: string): Datos {
    let x = this.datos.get(uid);
    if (!x) {
      x = { rutinas: new Map(), propios: new Map(), estados: new Map(), historial: [], cuerpo: new Map() };
      this.datos.set(uid, x);
    }
    return x;
  }

  private avisar() {
    for (const o of this.oyentes) o(this.usuario);
  }

  escucharSesion(cb: (u: Usuario | null) => void) {
    this.oyentes.add(cb);
    setTimeout(() => cb(this.usuario), 0);
    return () => { this.oyentes.delete(cb); };
  }

  async ingresar(email: string, clave: string) {
    await espera();
    const c = this.cuentas.get(email.trim().toLowerCase());
    if (!c || c.clave !== clave) throw Object.assign(new ErrorApp('El correo o la contraseña no coinciden.'), { code: 'auth/invalid-credential' });
    this.usuario = c.u;
    this.avisar();
  }

  async registrar(nombre: string, email: string, clave: string) {
    await espera();
    const e = email.trim().toLowerCase();
    if (this.cuentas.has(e)) throw Object.assign(new ErrorApp('x'), { code: 'auth/email-already-in-use' });
    if (clave.length < 6) throw Object.assign(new ErrorApp('x'), { code: 'auth/weak-password' });
    // Si era invitado, la cuenta nueva conserva sus datos (mismo uid)
    const uid = this.usuario?.invitado ? this.usuario.uid : 'u-' + Math.random().toString(36).slice(2, 9);
    const u: Usuario = { uid, email: e, nombre };
    const d = this.datos.get(uid);
    if (d?.perfil) { d.perfil.email = e; d.perfil.nombre = nombre || d.perfil.nombre; }
    this.cuentas.set(e, { u, clave });
    this.usuario = u;
    this.avisar();
  }

  async recuperarClave(email: string) {
    await espera();
    if (!email.includes('@')) throw Object.assign(new ErrorApp('x'), { code: 'auth/invalid-email' });
  }

  async ingresarConGoogle() {
    await espera();
    this.usuario = USUARIO_PRUEBA;
    this.avisar();
  }

  async ingresarComoInvitado() {
    await espera();
    this.usuario = { uid: 'inv-' + Math.random().toString(36).slice(2, 9), email: '', nombre: 'Legionario', invitado: true };
    this.avisar();
  }

  async salir() {
    this.usuario = null;
    this.avisar();
  }

  async borrarCuenta() {
    if (!this.usuario) return;
    this.datos.delete(this.usuario.uid);
    this.cuentas.delete(this.usuario.email);
    this.usuario = null;
    this.avisar();
  }

  async leerPerfil(u: Usuario) {
    await espera(60);
    const d = this.d(u.uid);
    if (!d.perfil) d.perfil = perfilInicial(u);
    return copia(d.perfil);
  }

  async guardarPerfil(uid: string, cambios: Partial<Perfil>) {
    const d = this.d(uid);
    if (d.perfil) d.perfil = { ...d.perfil, ...copia(cambios) };
  }

  async esAdmin(uid: string) {
    return uid === USUARIO_PRUEBA.uid;
  }

  async leerRutinas(uid: string) {
    await espera(60);
    return copia([...this.d(uid).rutinas.values()].sort((a, b) => a.orden - b.orden));
  }
  async guardarRutina(uid: string, r: Rutina) { this.d(uid).rutinas.set(r.id, copia(r)); }
  async borrarRutina(uid: string, id: string) { this.d(uid).rutinas.delete(id); }

  async leerPropios(uid: string) { return copia([...this.d(uid).propios.values()]); }
  async guardarPropio(uid: string, e: Ejercicio) { this.d(uid).propios.set(e.id, copia(e)); }

  async leerEstados(uid: string, ids?: string[]) {
    const m = this.d(uid).estados;
    const r = new Map<string, EstadoEjercicio>();
    for (const [k, v] of m) if (!ids || ids.includes(k)) r.set(k, copia(v));
    return r;
  }

  async guardarEntrenamiento(uid: string, e: Entrenamiento, estados: EstadoEjercicio[], resumen: Perfil['resumen']) {
    await espera();
    const d = this.d(uid);
    d.historial.unshift(copia(e));
    for (const s of estados) d.estados.set(s.ejercicioId, copia(s));
    if (d.perfil) d.perfil.resumen = copia(resumen);
  }

  async leerHistorial(uid: string, limite: number, antesDe?: number) {
    await espera(60);
    return copia(
      this.d(uid).historial
        .filter((h) => antesDe === undefined || h.inicio < antesDe)
        .sort((a, b) => b.inicio - a.inicio)
        .slice(0, limite),
    );
  }

  async leerCuerpo(uid: string) {
    return copia([...this.d(uid).cuerpo.values()].sort((a, b) => a.fecha - b.fecha));
  }
  async guardarCuerpo(uid: string, r: RegistroCuerpo) { this.d(uid).cuerpo.set(r.id, copia(r)); }

  async exportar(uid: string) {
    const d = this.d(uid);
    return copia({
      perfil: d.perfil,
      rutinas: [...d.rutinas.values()],
      ejerciciosPropios: [...d.propios.values()],
      entrenamientos: d.historial,
      resumenesPorEjercicio: [...d.estados.values()],
      cuerpo: [...d.cuerpo.values()],
    });
  }
}
