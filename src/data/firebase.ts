import { initializeApp } from 'firebase/app';
import {
  EmailAuthProvider, GoogleAuthProvider, createUserWithEmailAndPassword, deleteUser, getAuth, linkWithCredential,
  linkWithPopup, onIdTokenChanged, sendPasswordResetEmail, signInAnonymously, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
} from 'firebase/auth';
import {
  collection, deleteDoc, doc, getDoc, getDocs, initializeFirestore, limit, orderBy,
  persistentLocalCache, persistentMultipleTabManager, query, setDoc, startAfter, where,
  documentId, writeBatch, type Firestore,
} from 'firebase/firestore';
import type {
  Ejercicio, Entrenamiento, EstadoEjercicio, Perfil, RegistroCuerpo, Rutina,
} from '../lib/tipos';
import { firebaseConfig } from '../firebaseConfig';
import { ErrorApp, type Repo, type Usuario } from './repo';
import type { Comentario, Objetivo, Profesional, Solicitud, TipoProfesional, Vinculo, Codigo } from '../pro/tipos';
import { idVinculo, normalizarCodigo } from '../pro/logica';
import { perfilInicial } from './semilla';

/** Firestore no acepta `undefined`: lo quitamos antes de guardar */
function limpio<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/** Sin conexión, las escrituras quedan en cola y la promesa tarda: no frenamos la pantalla por eso */
function sinBloquear(p: Promise<unknown>, ms = 2500): Promise<void> {
  return Promise.race([p.then(() => undefined), new Promise<void>((r) => setTimeout(r, ms))]);
}

export class RepoFirebase implements Repo {
  readonly modo = 'firebase' as const;
  readonly permiteGoogle: boolean;
  private app = initializeApp(firebaseConfig);
  private auth = getAuth(this.app);
  private db: Firestore;

  constructor(nativo: boolean) {
    // En la APK, el acceso con Google necesita un complemento nativo (fase siguiente)
    this.permiteGoogle = !nativo;
    this.auth.languageCode = 'es';
    this.db = initializeFirestore(this.app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }

  private u(uid: string) { return doc(this.db, 'users', uid); }
  private col(uid: string, nombre: string) { return collection(this.db, 'users', uid, nombre); }

  escucharSesion(cb: (u: Usuario | null) => void) {
    // onIdTokenChanged también avisa cuando un invitado se convierte en cuenta
    return onIdTokenChanged(this.auth, (fu) => {
      cb(fu ? { uid: fu.uid, email: fu.email ?? '', nombre: fu.displayName ?? '', invitado: fu.isAnonymous } : null);
    });
  }

  async ingresar(email: string, clave: string) {
    await signInWithEmailAndPassword(this.auth, email.trim(), clave);
  }

  async registrar(nombre: string, email: string, clave: string) {
    const actual = this.auth.currentUser;
    if (actual?.isAnonymous) {
      // El invitado pasa a tener cuenta y conserva todo lo que registró
      const c = await linkWithCredential(actual, EmailAuthProvider.credential(email.trim(), clave));
      if (nombre) await updateProfile(c.user, { displayName: nombre });
      await setDoc(this.u(c.user.uid), { email: c.user.email ?? '', ...(nombre ? { nombre } : {}) }, { merge: true });
      await c.user.reload();
      return;
    }
    const c = await createUserWithEmailAndPassword(this.auth, email.trim(), clave);
    if (nombre) await updateProfile(c.user, { displayName: nombre });
    await setDoc(this.u(c.user.uid), limpio(perfilInicial({ uid: c.user.uid, email: c.user.email ?? '', nombre })));
  }

  async recuperarClave(email: string) {
    await sendPasswordResetEmail(this.auth, email.trim());
  }

  async ingresarConGoogle() {
    const actual = this.auth.currentUser;
    if (actual?.isAnonymous) {
      const c = await linkWithPopup(actual, new GoogleAuthProvider());
      await setDoc(this.u(c.user.uid), { email: c.user.email ?? '', nombre: c.user.displayName ?? 'Legionario' }, { merge: true });
      await c.user.reload();
      return;
    }
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async ingresarComoInvitado() {
    await signInAnonymously(this.auth);
  }

  async salir() {
    await signOut(this.auth);
  }

  async borrarCuenta() {
    const fu = this.auth.currentUser;
    if (!fu) return;
    // Firebase exige un ingreso reciente para borrar la cuenta: lo comprobamos ANTES de borrar los datos
    const t = await fu.getIdTokenResult();
    const hace = Date.now() - new Date(t.authTime).getTime();
    if (hace > 5 * 60_000) throw Object.assign(new Error('reciente'), { code: 'auth/requires-recent-login' });
    const uid = fu.uid;
    // Se cortan los vínculos con profesionales antes de borrar
    for (const v of await this.leerMisProfesionales(uid)) await this.terminarVinculo(v.id);
    for (const nombre of ['routines', 'customExercises', 'workouts', 'exerciseStats', 'bodyLogs', 'comments', 'goals']) {
      const snap = await getDocs(this.col(uid, nombre));
      let lote = writeBatch(this.db);
      let n = 0;
      for (const d of snap.docs) {
        lote.delete(d.ref);
        if (++n % 450 === 0) { await lote.commit(); lote = writeBatch(this.db); }
      }
      await lote.commit();
    }
    await deleteDoc(this.u(uid));
    await deleteUser(fu);
  }

  async leerPerfil(u: Usuario): Promise<Perfil> {
    const s = await getDoc(this.u(u.uid));
    const base = perfilInicial(u);
    if (!s.exists()) {
      await sinBloquear(setDoc(this.u(u.uid), limpio(base)));
      return base;
    }
    const p = s.data() as Partial<Perfil>;
    return { ...base, ...p, uid: u.uid, resumen: p.resumen ?? base.resumen, recordatorio: p.recordatorio ?? base.recordatorio };
  }

  async guardarPerfil(uid: string, cambios: Partial<Perfil>) {
    await sinBloquear(setDoc(this.u(uid), limpio(cambios), { merge: true }));
  }

  async esAdmin(uid: string) {
    try {
      const s = await getDoc(doc(this.db, 'config', 'admins'));
      const uids = (s.data()?.uids as string[] | undefined) ?? [];
      return uids.includes(uid);
    } catch {
      return false;
    }
  }

  async leerRutinas(uid: string) {
    const s = await getDocs(this.col(uid, 'routines'));
    return s.docs.map((d) => ({ ...(d.data() as Rutina), id: d.id })).sort((a, b) => a.orden - b.orden);
  }
  async guardarRutina(uid: string, r: Rutina) {
    await sinBloquear(setDoc(doc(this.col(uid, 'routines'), r.id), limpio(r)));
  }
  async borrarRutina(uid: string, id: string) {
    await sinBloquear(deleteDoc(doc(this.col(uid, 'routines'), id)));
  }

  async leerPropios(uid: string) {
    const s = await getDocs(this.col(uid, 'customExercises'));
    return s.docs.map((d) => ({ ...(d.data() as Ejercicio), id: d.id, propio: true }));
  }
  async guardarPropio(uid: string, e: Ejercicio) {
    await sinBloquear(setDoc(doc(this.col(uid, 'customExercises'), e.id), limpio(e)));
  }

  async leerEstados(uid: string, ids?: string[]) {
    const r = new Map<string, EstadoEjercicio>();
    if (ids && ids.length === 0) return r;
    const partes: string[][] = [];
    if (ids) for (let i = 0; i < ids.length; i += 30) partes.push(ids.slice(i, i + 30));
    const consultas = ids
      ? partes.map((p) => query(this.col(uid, 'exerciseStats'), where(documentId(), 'in', p)))
      : [query(this.col(uid, 'exerciseStats'))];
    for (const q of consultas) {
      const s = await getDocs(q);
      for (const d of s.docs) r.set(d.id, { ...(d.data() as EstadoEjercicio), ejercicioId: d.id });
    }
    return r;
  }

  async guardarEntrenamiento(uid: string, e: Entrenamiento, estados: EstadoEjercicio[], resumen: Perfil['resumen']) {
    const lote = writeBatch(this.db);
    lote.set(doc(this.col(uid, 'workouts'), e.id), limpio(e));
    for (const s of estados) lote.set(doc(this.col(uid, 'exerciseStats'), s.ejercicioId), limpio(s));
    lote.set(this.u(uid), { resumen: limpio(resumen) }, { merge: true });
    await sinBloquear(lote.commit());
  }

  async leerHistorial(uid: string, limite: number, antesDe?: number) {
    const base = [orderBy('inicio', 'desc')];
    const q = antesDe !== undefined
      ? query(this.col(uid, 'workouts'), ...base, startAfter(antesDe), limit(limite))
      : query(this.col(uid, 'workouts'), ...base, limit(limite));
    const s = await getDocs(q);
    return s.docs.map((d) => ({ ...(d.data() as Entrenamiento), id: d.id }));
  }

  async leerCuerpo(uid: string) {
    const s = await getDocs(query(this.col(uid, 'bodyLogs'), orderBy('fecha', 'asc')));
    return s.docs.map((d) => ({ ...(d.data() as RegistroCuerpo), id: d.id }));
  }
  async guardarCuerpo(uid: string, r: RegistroCuerpo) {
    await sinBloquear(setDoc(doc(this.col(uid, 'bodyLogs'), r.id), limpio(r)));
  }

  async exportar(uid: string) {
    const leer = async (n: string) => (await getDocs(this.col(uid, n))).docs.map((d) => ({ id: d.id, ...d.data() }));
    const perfil = (await getDoc(this.u(uid))).data();
    return {
      perfil,
      rutinas: await leer('routines'),
      ejerciciosPropios: await leer('customExercises'),
      entrenamientos: await leer('workouts'),
      resumenesPorEjercicio: await leer('exerciseStats'),
      cuerpo: await leer('bodyLogs'),
      comentarios: await leer('comments'),
      objetivos: await leer('goals'),
      vinculos: await this.leerMisProfesionales(uid),
    };
  }

  // ── Profesionales y clientes ──
  private sinPermiso<T>(p: Promise<T>, siNo: T): Promise<T> {
    return p.catch((e) => { if ((e as { code?: string })?.code === 'permission-denied') return siNo; throw e; });
  }

  async leerPerfilDe(uid: string) {
    const s = await getDoc(this.u(uid));
    return s.exists() ? ({ ...(s.data() as Perfil), uid, resumen: (s.data() as Perfil).resumen ?? { dias: [], total: 0 } }) : null;
  }
  async leerProfesional(uid: string) {
    const s = await this.sinPermiso(getDoc(doc(this.db, 'profesionales', uid)), null);
    return s?.exists() ? ({ ...(s.data() as Profesional), uid }) : null;
  }
  async leerMiSolicitud(uid: string) {
    const s = await this.sinPermiso(getDoc(doc(this.db, 'solicitudes', uid)), null);
    return s?.exists() ? ({ ...(s.data() as Solicitud), uid }) : null;
  }
  async enviarSolicitud(x: Solicitud) {
    await setDoc(doc(this.db, 'solicitudes', x.uid), limpio(x));
  }
  async leerSolicitudes() {
    const s = await getDocs(query(collection(this.db, 'solicitudes'), orderBy('fecha', 'desc'), limit(200)));
    return s.docs.map((d) => ({ ...(d.data() as Solicitud), uid: d.id }));
  }
  async aprobarSolicitud(x: Solicitud, codigo: string) {
    const p: Profesional = { uid: x.uid, tipo: x.tipo, nombre: x.nombre, codigo, activo: true, alta: Date.now() };
    const c: Codigo = { codigo, profesionalId: x.uid, tipo: x.tipo, nombre: x.nombre };
    const lote = writeBatch(this.db);
    lote.set(doc(this.db, 'profesionales', x.uid), limpio(p));
    lote.set(doc(this.db, 'codigos', codigo), limpio(c));
    lote.set(doc(this.db, 'solicitudes', x.uid), { estado: 'aprobada' }, { merge: true });
    await lote.commit();
    return p;
  }
  async rechazarSolicitud(uid: string) {
    await setDoc(doc(this.db, 'solicitudes', uid), { estado: 'rechazada' }, { merge: true });
  }
  async leerProfesionales() {
    const s = await getDocs(collection(this.db, 'profesionales'));
    return s.docs.map((d) => ({ ...(d.data() as Profesional), uid: d.id })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  async cambiarEstadoProfesional(uid: string, activo: boolean) {
    await setDoc(doc(this.db, 'profesionales', uid), { activo }, { merge: true });
  }
  async vincular(cliente: { uid: string; nombre: string }, codigo: string, tipo: TipoProfesional) {
    const cod = normalizarCodigo(codigo);
    const s = await this.sinPermiso(getDoc(doc(this.db, 'codigos', cod)), null);
    const c = s?.exists() ? (s.data() as Codigo) : null;
    if (!c || c.tipo !== tipo) throw Object.assign(new ErrorApp('pro/codigo'), { code: 'pro/codigo' });
    if (c.profesionalId === cliente.uid) throw Object.assign(new ErrorApp('pro/propio'), { code: 'pro/propio' });
    const v: Vinculo = {
      id: idVinculo(c.profesionalId, cliente.uid), profesionalId: c.profesionalId, clienteId: cliente.uid, tipo,
      nombreProfesional: c.nombre, nombreCliente: cliente.nombre || 'Cliente', codigo: cod, desde: Date.now(), activo: true,
    };
    try {
      await setDoc(doc(this.db, 'vinculos', v.id), limpio(v));
    } catch (e) {
      // Las reglas rechazan si el profesional está dado de baja
      if ((e as { code?: string })?.code === 'permission-denied') throw Object.assign(new ErrorApp('pro/codigo'), { code: 'pro/codigo' });
      throw e;
    }
    return v;
  }
  async leerMisProfesionales(clienteId: string) {
    const s = await getDocs(query(collection(this.db, 'vinculos'), where('clienteId', '==', clienteId), where('activo', '==', true)));
    return s.docs.map((d) => ({ ...(d.data() as Vinculo), id: d.id }));
  }
  async leerClientes(profesionalId: string) {
    const s = await getDocs(query(collection(this.db, 'vinculos'), where('profesionalId', '==', profesionalId), where('activo', '==', true)));
    return s.docs.map((d) => ({ ...(d.data() as Vinculo), id: d.id }));
  }
  async terminarVinculo(id: string) {
    await setDoc(doc(this.db, 'vinculos', id), { activo: false, hasta: Date.now() }, { merge: true });
  }
  async leerComentarios(clienteId: string) {
    const s = await getDocs(query(this.col(clienteId, 'comments'), orderBy('fecha', 'desc'), limit(100)));
    return s.docs.map((d) => ({ ...(d.data() as Comentario), id: d.id }));
  }
  async guardarComentario(clienteId: string, c: Comentario) {
    await sinBloquear(setDoc(doc(this.col(clienteId, 'comments'), c.id), limpio(c)));
  }
  async marcarLeidos(clienteId: string, ids: string[]) {
    if (!ids.length) return;
    const lote = writeBatch(this.db);
    for (const id of ids) lote.set(doc(this.col(clienteId, 'comments'), id), { leido: true }, { merge: true });
    await sinBloquear(lote.commit());
  }
  async leerObjetivos(clienteId: string) {
    const s = await getDocs(this.col(clienteId, 'goals'));
    return s.docs.map((d) => ({ ...(d.data() as Objetivo), id: d.id })).sort((a, b) => a.fecha - b.fecha);
  }
  async guardarObjetivo(clienteId: string, o: Objetivo) {
    await sinBloquear(setDoc(doc(this.col(clienteId, 'goals'), o.id), limpio(o)));
  }
  async borrarObjetivo(clienteId: string, id: string) {
    await sinBloquear(deleteDoc(doc(this.col(clienteId, 'goals'), id)));
  }
}
