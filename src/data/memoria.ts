import type {
  Ejercicio, Entrenamiento, EstadoEjercicio, Perfil, RegistroCuerpo, Rutina,
} from '../lib/tipos';
import { ErrorApp, type Repo, type Usuario } from './repo';
import { CLAVE_PRUEBA, USUARIO_PRUEBA, datosDePrueba, perfilInicial } from './semilla';
import type { Codigo, Comentario, Objetivo, Profesional, Solicitud, TipoProfesional, Vinculo } from '../pro/tipos';
import { idVinculo, normalizarCodigo } from '../pro/logica';
import { cargarEquipoDePrueba } from './semillaPro';

interface Datos {
  perfil?: Perfil;
  rutinas: Map<string, Rutina>;
  propios: Map<string, Ejercicio>;
  estados: Map<string, EstadoEjercicio>;
  historial: Entrenamiento[];
  cuerpo: Map<string, RegistroCuerpo>;
  comentarios: Map<string, Comentario>;
  objetivos: Map<string, Objetivo>;
}

/** Lo que no cuelga de un usuario: profesionales, solicitudes, códigos y vínculos */
interface Comun {
  profesionales: Map<string, Profesional>;
  solicitudes: Map<string, Solicitud>;
  codigos: Map<string, Codigo>;
  vinculos: Map<string, Vinculo>;
}

const espera = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const CLAVE_SESION = 'titanus-prueba-datos';

type DatosPlanos = {
  perfil?: Perfil; rutinas: Rutina[]; propios: Ejercicio[]; estados: EstadoEjercicio[]; historial: Entrenamiento[]; cuerpo: RegistroCuerpo[];
  comentarios?: Comentario[]; objetivos?: Objetivo[];
};
type ComunPlano = { profesionales: Profesional[]; solicitudes: Solicitud[]; codigos: Codigo[]; vinculos: Vinculo[] };
const ERR = (code: string) => Object.assign(new ErrorApp(code), { code });
const copia = <T,>(x: T): T => structuredClone(x);

/** Modo prueba: todo vive en la memoria del navegador. Al recargar vuelve a los datos de ejemplo. */
export class RepoMemoria implements Repo {
  readonly modo = 'prueba' as const;
  readonly permiteGoogle = true;
  private usuario: Usuario | null = null;
  private oyentes = new Set<(u: Usuario | null) => void>();
  private cuentas = new Map<string, { u: Usuario; clave: string }>();
  private datos = new Map<string, Datos>();
  private comun: Comun = { profesionales: new Map(), solicitudes: new Map(), codigos: new Map(), vinculos: new Map() };

  constructor(private ahora = Date.now(), private persistir = typeof sessionStorage !== 'undefined') {
    this.cuentas.set(USUARIO_PRUEBA.email, { u: USUARIO_PRUEBA, clave: CLAVE_PRUEBA });
    this.cargarEjemplo(USUARIO_PRUEBA, 'Marco');
    // Marco también es entrenador, con clientes inventados (Ana entra con ana@ejemplo.com / titanus)
    cargarEquipoDePrueba(this.ahora, {
      cuenta: (u) => this.cuentas.set(u.email, { u, clave: CLAVE_PRUEBA }),
      ejemplo: (u, nombre, desfaseDias) => this.cargarEjemplo(u, nombre, desfaseDias),
      datos: (uid) => this.d(uid),
      comun: this.comun,
    });
    this.restaurar();
  }

  /** El modo prueba guarda todo en la pestaña: sobrevive a recargas y a las actualizaciones automáticas */
  private guardar() {
    if (!this.persistir) return;
    try {
      const datos: Record<string, DatosPlanos> = {};
      for (const [uid, d] of this.datos) {
        datos[uid] = {
          perfil: d.perfil, rutinas: [...d.rutinas.values()], propios: [...d.propios.values()],
          estados: [...d.estados.values()], historial: d.historial, cuerpo: [...d.cuerpo.values()],
          comentarios: [...d.comentarios.values()], objetivos: [...d.objetivos.values()],
        };
      }
      const c = this.comun;
      const comun: ComunPlano = {
        profesionales: [...c.profesionales.values()], solicitudes: [...c.solicitudes.values()],
        codigos: [...c.codigos.values()], vinculos: [...c.vinculos.values()],
      };
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: this.usuario, cuentas: [...this.cuentas.entries()], datos, comun }));
    } catch { /* sin espacio: queda solo en memoria */ }
  }

  private restaurar() {
    if (!this.persistir) return;
    try {
      const t = sessionStorage.getItem(CLAVE_SESION);
      if (!t) return;
      const g = JSON.parse(t) as { usuario: Usuario | null; cuentas: [string, { u: Usuario; clave: string }][]; datos: Record<string, DatosPlanos>; comun?: ComunPlano };
      this.usuario = g.usuario;
      // Se suma lo guardado sobre los datos de ejemplo (no se reemplaza): si la sesión la guardó una versión
      // anterior, igual aparecen las cuentas y clientes de ejemplo que se agregaron después.
      for (const [email, c] of g.cuentas) this.cuentas.set(email, c);
      for (const [uid, d] of Object.entries(g.datos ?? {})) {
        this.datos.set(uid, {
          perfil: d.perfil,
          rutinas: new Map((d.rutinas ?? []).map((x) => [x.id, x])),
          propios: new Map((d.propios ?? []).map((x) => [x.id, x])),
          estados: new Map((d.estados ?? []).map((x) => [x.ejercicioId, x])),
          historial: d.historial ?? [],
          cuerpo: new Map((d.cuerpo ?? []).map((x) => [x.id, x])),
          comentarios: new Map((d.comentarios ?? []).map((x) => [x.id, x])),
          objetivos: new Map((d.objetivos ?? []).map((x) => [x.id, x])),
        });
      }
      if (g.comun) {
        for (const x of g.comun.profesionales ?? []) this.comun.profesionales.set(x.uid, x);
        for (const x of g.comun.solicitudes ?? []) this.comun.solicitudes.set(x.uid, x);
        for (const x of g.comun.codigos ?? []) this.comun.codigos.set(x.codigo, x);
        for (const x of g.comun.vinculos ?? []) this.comun.vinculos.set(x.id, x);
      }
    } catch { /* datos viejos o dañados: se empieza de cero */ }
  }

  /** Carga la rutina Full body ya hecha durante 8 semanas (datos inventados) */
  private cargarEjemplo(u: Usuario, nombre: string, desfaseDias = 0) {
    const s = datosDePrueba(this.ahora - desfaseDias * 86_400_000);
    const perfil = perfilInicial(u);
    perfil.nombre = nombre;
    perfil.tema = 'oscuro';
    perfil.resumen = { dias: s.dias, total: s.historial.length, semanas: s.semanas };
    perfil.creado = this.ahora - 60 * 86_400_000;
    this.datos.set(u.uid, {
      perfil,
      rutinas: new Map(s.rutinas.map((r) => [r.id, r])),
      propios: new Map(),
      estados: s.estados,
      historial: s.historial,
      cuerpo: new Map(s.cuerpo.map((c) => [c.id, c])),
      comentarios: new Map(),
      objetivos: new Map(),
    });
  }

  private d(uid: string): Datos {
    let x = this.datos.get(uid);
    if (!x) {
      x = { rutinas: new Map(), propios: new Map(), estados: new Map(), historial: [], cuerpo: new Map(), comentarios: new Map(), objetivos: new Map() };
      this.datos.set(uid, x);
    }
    return x;
  }

  private avisar() {
    this.guardar();
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
    // En el modo prueba, el invitado ve la rutina Full body como si ya la hubiera hecho
    this.cargarEjemplo(this.usuario, 'Legionario');
    this.avisar();
  }

  async salir() {
    this.usuario = null;
    this.avisar();
  }

  async borrarCuenta() {
    if (!this.usuario) return;
    const uid = this.usuario.uid;
    this.datos.delete(uid);
    for (const v of this.comun.vinculos.values()) if (v.clienteId === uid || v.profesionalId === uid) v.activo = false;
    this.cuentas.delete(this.usuario.email);
    this.usuario = null;
    this.avisar();
  }

  async leerPerfil(u: Usuario) {
    await espera(60);
    const d = this.d(u.uid);
    if (!d.perfil) { d.perfil = perfilInicial(u); this.guardar(); }
    return copia(d.perfil);
  }

  async guardarPerfil(uid: string, cambios: Partial<Perfil>) {
    const d = this.d(uid);
    if (d.perfil) d.perfil = { ...d.perfil, ...copia(cambios) };
    this.guardar();
  }

  async esAdmin(uid: string) {
    return uid === USUARIO_PRUEBA.uid;
  }

  /** Leer datos de otro: solo su profesional (en Firebase lo controlan las reglas) */
  private ver(uid: string) { if (!this.puedeVer(uid)) throw ERR('permission-denied'); }

  async leerRutinas(uid: string) {
    this.ver(uid);
    await espera(60);
    return copia([...this.d(uid).rutinas.values()].sort((a, b) => a.orden - b.orden));
  }
  async guardarRutina(uid: string, r: Rutina) {
    const yo = this.usuario?.uid;
    const previa = this.d(uid).rutinas.get(r.id);
    if (yo === uid && (r.asignadaPor || previa?.asignadaPor)) throw ERR('permission-denied');
    if (yo !== uid && (!this.puedeVer(uid) || r.asignadaPor !== yo || (previa && previa.asignadaPor !== yo))) throw ERR('permission-denied');
    this.d(uid).rutinas.set(r.id, copia(r));
    this.guardar();
  }
  async borrarRutina(uid: string, id: string) {
    const r = this.d(uid).rutinas.get(id);
    if (this.usuario?.uid !== uid && r?.asignadaPor !== this.usuario?.uid) throw ERR('permission-denied');
    this.d(uid).rutinas.delete(id);
    this.guardar();
  }

  async leerPropios(uid: string) { this.ver(uid); return copia([...this.d(uid).propios.values()]); }
  async guardarPropio(uid: string, e: Ejercicio) { this.d(uid).propios.set(e.id, copia(e)); this.guardar(); }

  async leerEstados(uid: string, ids?: string[]) {
    this.ver(uid);
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
    this.guardar();
  }

  async leerHistorial(uid: string, limite: number, antesDe?: number) {
    this.ver(uid);
    await espera(60);
    return copia(
      this.d(uid).historial
        .filter((h) => antesDe === undefined || h.inicio < antesDe)
        .sort((a, b) => b.inicio - a.inicio)
        .slice(0, limite),
    );
  }

  async leerCuerpo(uid: string) {
    this.ver(uid);
    return copia([...this.d(uid).cuerpo.values()].sort((a, b) => a.fecha - b.fecha));
  }
  async guardarCuerpo(uid: string, r: RegistroCuerpo) { this.d(uid).cuerpo.set(r.id, copia(r)); this.guardar(); }

  async exportar(uid: string) {
    const d = this.d(uid);
    return copia({
      perfil: d.perfil,
      rutinas: [...d.rutinas.values()],
      ejerciciosPropios: [...d.propios.values()],
      entrenamientos: d.historial,
      resumenesPorEjercicio: [...d.estados.values()],
      cuerpo: [...d.cuerpo.values()],
      comentarios: [...d.comentarios.values()],
      objetivos: [...d.objetivos.values()],
      vinculos: [...this.comun.vinculos.values()].filter((v) => v.clienteId === uid || v.profesionalId === uid),
    });
  }

  // ── Profesionales y clientes ──
  /** Simula las reglas: el cliente mismo, o su profesional con vínculo activo */
  private puedeVer(uid: string) {
    const yo = this.usuario?.uid;
    if (!yo) return false;
    if (yo === uid) return true;
    const v = this.comun.vinculos.get(idVinculo(yo, uid));
    return !!v?.activo && !!this.comun.profesionales.get(yo)?.activo;
  }

  async leerPerfilDe(uid: string) {
    await espera(40);
    if (!this.puedeVer(uid)) throw ERR('permission-denied');
    const p = this.datos.get(uid)?.perfil;
    return p ? copia(p) : null;
  }
  async leerProfesional(uid: string) { return copia(this.comun.profesionales.get(uid) ?? null); }
  async leerMiSolicitud(uid: string) { return copia(this.comun.solicitudes.get(uid) ?? null); }
  async enviarSolicitud(s: Solicitud) { await espera(); this.comun.solicitudes.set(s.uid, copia(s)); this.guardar(); }
  private soloAdmin() { if (this.usuario?.uid !== USUARIO_PRUEBA.uid) throw ERR('permission-denied'); }
  async leerSolicitudes() {
    this.soloAdmin();
    return copia([...this.comun.solicitudes.values()].sort((a, b) => b.fecha - a.fecha));
  }
  async aprobarSolicitud(s: Solicitud, codigo: string) {
    this.soloAdmin();
    const p: Profesional = { uid: s.uid, tipo: s.tipo, nombre: s.nombre, codigo, activo: true, alta: Date.now() };
    this.comun.profesionales.set(p.uid, p);
    this.comun.codigos.set(codigo, { codigo, profesionalId: p.uid, tipo: p.tipo, nombre: p.nombre });
    this.comun.solicitudes.set(s.uid, { ...s, estado: 'aprobada' });
    this.guardar();
    return copia(p);
  }
  async rechazarSolicitud(uid: string) {
    this.soloAdmin();
    const s = this.comun.solicitudes.get(uid);
    if (s) s.estado = 'rechazada';
    this.guardar();
  }
  async leerProfesionales() {
    this.soloAdmin();
    return copia([...this.comun.profesionales.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  }
  async cambiarEstadoProfesional(uid: string, activo: boolean) {
    this.soloAdmin();
    const p = this.comun.profesionales.get(uid);
    if (p) p.activo = activo;
    this.guardar();
  }
  async vincular(cliente: { uid: string; nombre: string }, codigo: string, tipo: TipoProfesional) {
    await espera();
    const c = this.comun.codigos.get(normalizarCodigo(codigo));
    const p = c && this.comun.profesionales.get(c.profesionalId);
    if (!c || !p?.activo || c.tipo !== tipo) throw ERR('pro/codigo');
    if (p.uid === cliente.uid) throw ERR('pro/propio');
    const v: Vinculo = {
      id: idVinculo(p.uid, cliente.uid), profesionalId: p.uid, clienteId: cliente.uid, tipo,
      nombreProfesional: p.nombre, nombreCliente: cliente.nombre, codigo: c.codigo, desde: Date.now(), activo: true,
    };
    this.comun.vinculos.set(v.id, v);
    this.guardar();
    return copia(v);
  }
  async leerMisProfesionales(clienteId: string) {
    return copia([...this.comun.vinculos.values()].filter((v) => v.clienteId === clienteId && v.activo));
  }
  async leerClientes(profesionalId: string) {
    await espera(60);
    return copia([...this.comun.vinculos.values()].filter((v) => v.profesionalId === profesionalId && v.activo));
  }
  async terminarVinculo(id: string) {
    const v = this.comun.vinculos.get(id);
    if (v) { v.activo = false; v.hasta = Date.now(); }
    this.guardar();
  }
  async leerComentarios(clienteId: string) {
    if (!this.puedeVer(clienteId)) throw ERR('permission-denied');
    return copia([...this.d(clienteId).comentarios.values()].sort((a, b) => b.fecha - a.fecha));
  }
  async guardarComentario(clienteId: string, c: Comentario) {
    if (!this.puedeVer(clienteId)) throw ERR('permission-denied');
    this.d(clienteId).comentarios.set(c.id, copia(c));
    this.guardar();
  }
  async marcarLeidos(clienteId: string, ids: string[]) {
    const m = this.d(clienteId).comentarios;
    for (const id of ids) { const c = m.get(id); if (c) c.leido = true; }
    this.guardar();
  }
  async leerObjetivos(clienteId: string) {
    if (!this.puedeVer(clienteId)) throw ERR('permission-denied');
    return copia([...this.d(clienteId).objetivos.values()].sort((a, b) => a.fecha - b.fecha));
  }
  async guardarObjetivo(clienteId: string, o: Objetivo) {
    if (!this.puedeVer(clienteId) || clienteId === this.usuario?.uid) throw ERR('permission-denied');
    this.d(clienteId).objetivos.set(o.id, copia(o));
    this.guardar();
  }
  async borrarObjetivo(clienteId: string, id: string) {
    if (!this.puedeVer(clienteId) || clienteId === this.usuario?.uid) throw ERR('permission-denied');
    this.d(clienteId).objetivos.delete(id);
    this.guardar();
  }
}
