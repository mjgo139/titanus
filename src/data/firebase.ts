import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, deleteUser, getAuth, onAuthStateChanged,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
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
import type { Repo, Usuario } from './repo';
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
    return onAuthStateChanged(this.auth, (fu) => {
      cb(fu ? { uid: fu.uid, email: fu.email ?? '', nombre: fu.displayName ?? '' } : null);
    });
  }

  async ingresar(email: string, clave: string) {
    await signInWithEmailAndPassword(this.auth, email.trim(), clave);
  }

  async registrar(nombre: string, email: string, clave: string) {
    const c = await createUserWithEmailAndPassword(this.auth, email.trim(), clave);
    if (nombre) await updateProfile(c.user, { displayName: nombre });
    await setDoc(this.u(c.user.uid), limpio(perfilInicial({ uid: c.user.uid, email: c.user.email ?? '', nombre })));
  }

  async recuperarClave(email: string) {
    await sendPasswordResetEmail(this.auth, email.trim());
  }

  async ingresarConGoogle() {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
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
    for (const nombre of ['routines', 'customExercises', 'workouts', 'exerciseStats', 'bodyLogs']) {
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
    };
  }
}
