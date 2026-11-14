import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-titanus',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const perfil = (uid: string) => ({
  uid, nombre: 'Ana', email: 'ana@ejemplo.com', tema: 'sistema', unidad: 'kg',
  recordatorio: { activo: false, hora: '18:30', dias: [1] }, creado: 1, resumen: { dias: [], total: 0 },
});
const entreno = { nombre: 'Pecho', inicio: 1, fin: 2, ejercicios: [], volumen: 0, records: [] };

describe('reglas de Firestore', () => {
  it('sin sesión no se lee ni se escribe nada', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/ana')));
    await assertFails(setDoc(doc(db, 'users/ana'), perfil('ana')));
    await assertFails(getDoc(doc(db, 'config/admins')));
  });

  it('cada uno lee y escribe su perfil', async () => {
    const db = env.authenticatedContext('ana').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/ana'), perfil('ana')));
    await assertSucceeds(getDoc(doc(db, 'users/ana')));
    await assertSucceeds(setDoc(doc(db, 'users/ana'), { tema: 'oscuro' }, { merge: true }));
    await assertSucceeds(setDoc(doc(db, 'users/ana'), { sobrecarga: { modo: 'auto', superior: 1.25, inferior: 2.5 } }, { merge: true }));
    await assertFails(setDoc(doc(db, 'users/ana'), { sobrecarga: { modo: 'loco', superior: 1, inferior: 2 } }, { merge: true }));
  });

  it('nadie lee ni escribe el perfil de otro', async () => {
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'users/ana'), perfil('ana')); });
    const beto = env.authenticatedContext('beto').firestore();
    await assertFails(getDoc(doc(beto, 'users/ana')));
    await assertFails(setDoc(doc(beto, 'users/ana'), { nombre: 'X' }, { merge: true }));
    await assertFails(deleteDoc(doc(beto, 'users/ana')));
  });

  it('rechaza campos o valores no permitidos en el perfil', async () => {
    const db = env.authenticatedContext('ana').firestore();
    await assertFails(setDoc(doc(db, 'users/ana'), { ...perfil('ana'), admin: true }));
    await assertFails(setDoc(doc(db, 'users/ana'), { ...perfil('ana'), tema: 'rosa' }));
    await assertFails(setDoc(doc(db, 'users/ana'), { ...perfil('ana'), uid: 'otro' }));
  });

  it('subcolecciones: solo el dueño', async () => {
    const ana = env.authenticatedContext('ana').firestore();
    const beto = env.authenticatedContext('beto').firestore();
    await assertSucceeds(setDoc(doc(ana, 'users/ana/workouts/w1'), entreno));
    await assertSucceeds(setDoc(doc(ana, 'users/ana/routines/r1'), { nombre: 'Pierna', ejercicios: [], dias: [1], orden: 0 }));
    await assertSucceeds(setDoc(doc(ana, 'users/ana/exerciseStats/press-banca'), { puntos: [], mejorPeso: 0, mejorVolumen: 0 }));
    await assertSucceeds(setDoc(doc(ana, 'users/ana/bodyLogs/2026-11-14'), { fecha: 1, peso: 80 }));
    await assertSucceeds(setDoc(doc(ana, 'users/ana/customExercises/p1'), { nombre: 'Remo en T', musculo: 'Espalda' }));
    await assertSucceeds(getDocs(collection(ana, 'users/ana/workouts')));
    await assertFails(getDocs(collection(beto, 'users/ana/workouts')));
    await assertFails(getDoc(doc(beto, 'users/ana/bodyLogs/2026-11-14')));
    await assertFails(setDoc(doc(beto, 'users/ana/workouts/w2'), entreno));
  });

  it('colecciones desconocidas quedan cerradas', async () => {
    const ana = env.authenticatedContext('ana').firestore();
    await assertFails(setDoc(doc(ana, 'users/ana/otra/x'), { a: 1 }));
    await assertFails(setDoc(doc(ana, 'publico/x'), { a: 1 }));
  });

  it('entrenamientos mal formados se rechazan', async () => {
    const ana = env.authenticatedContext('ana').firestore();
    await assertFails(setDoc(doc(ana, 'users/ana/workouts/w1'), { ...entreno, inicio: 'ayer' }));
  });

  it('la lista de admins se lee con sesión pero nadie la escribe desde la app', async () => {
    const ana = env.authenticatedContext('ana').firestore();
    await assertSucceeds(getDoc(doc(ana, 'config/admins')));
    await assertFails(setDoc(doc(ana, 'config/admins'), { uids: ['ana'] }));
  });
});
