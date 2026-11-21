import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, query, setDoc, updateDoc, where } from 'firebase/firestore';

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

  it('el perfil acepta legionario o legionaria y nada más', async () => {
    const ana = env.authenticatedContext('ana').firestore();
    await assertSucceeds(setDoc(doc(ana, 'users/ana'), { ...perfil('ana'), figura: 'mujer' }));
    await assertFails(setDoc(doc(ana, 'users/ana'), { ...perfil('ana'), figura: 'robot' }));
  });

  it('hasta 3 programas a la vez y las rutinas hechas hoy', async () => {
    const ana = env.authenticatedContext('ana').firestore();
    const prog = (id: string) => ({ id, inicio: 1, hechas: [] });
    await assertSucceeds(setDoc(doc(ana, 'users/ana'), { ...perfil('ana'), programas: [prog('a'), prog('b'), prog('c')], programa: null,
      hoy: { fecha: '2026-11-20', ids: ['r1', 'r2'] } }));
    await assertFails(setDoc(doc(ana, 'users/ana'), { ...perfil('ana'), programas: [prog('a'), prog('b'), prog('c'), prog('d')] }));
  });

  describe('profesionales y clientes', () => {
    // ana = admin · pepe = entrenador activo · beto = cliente de pepe · zoe = otra persona
    const vinculo = (extra = {}) => ({
      id: 'pepe_beto', profesionalId: 'pepe', clienteId: 'beto', tipo: 'entrenador',
      nombreProfesional: 'Pepe', nombreCliente: 'Beto', codigo: 'TIT-PEPE', desde: 1, activo: true, ...extra,
    });
    async function preparar(activo = true) {
      await env.withSecurityRulesDisabled(async (c) => {
        const db = c.firestore();
        await setDoc(doc(db, 'config/admins'), { uids: ['ana'] });
        await setDoc(doc(db, 'profesionales/pepe'), { uid: 'pepe', tipo: 'entrenador', nombre: 'Pepe', codigo: 'TIT-PEPE', activo, alta: 1 });
        await setDoc(doc(db, 'codigos/TIT-PEPE'), { codigo: 'TIT-PEPE', profesionalId: 'pepe', tipo: 'entrenador', nombre: 'Pepe' });
        await setDoc(doc(db, 'users/beto'), perfil('beto'));
        await setDoc(doc(db, 'users/beto/workouts/w1'), entreno);
      });
    }

    it('solo el admin da de alta profesionales; nadie se nombra a sí mismo', async () => {
      await preparar();
      const zoe = env.authenticatedContext('zoe').firestore();
      const ana = env.authenticatedContext('ana').firestore();
      await assertFails(setDoc(doc(zoe, 'profesionales/zoe'), { uid: 'zoe', activo: true }));
      await assertFails(setDoc(doc(zoe, 'codigos/TIT-ZOE1'), { profesionalId: 'zoe' }));
      await assertSucceeds(setDoc(doc(ana, 'profesionales/zoe'), { uid: 'zoe', activo: true }));
      // pedir ser profesional sí lo puede cualquiera, en estado pendiente
      await assertSucceeds(setDoc(doc(zoe, 'solicitudes/zoe'), { uid: 'zoe', tipo: 'entrenador', nombre: 'Zoe', email: 'z@e.com', fecha: 1, estado: 'pendiente' }));
      await assertFails(setDoc(doc(zoe, 'solicitudes/zoe'), { uid: 'zoe', tipo: 'entrenador', nombre: 'Zoe', email: 'z@e.com', fecha: 1, estado: 'aprobada' }));
      await assertFails(getDocs(collection(zoe, 'solicitudes')));
      await assertSucceeds(getDocs(collection(ana, 'solicitudes')));
    });

    it('sin vínculo el entrenador no ve nada del cliente', async () => {
      await preparar();
      const pepe = env.authenticatedContext('pepe').firestore();
      await assertFails(getDoc(doc(pepe, 'users/beto')));
      await assertFails(getDocs(collection(pepe, 'users/beto/workouts')));
    });

    it('el cliente se vincula con el código y el entrenador pasa a ver sus datos', async () => {
      await preparar();
      const beto = env.authenticatedContext('beto').firestore();
      const pepe = env.authenticatedContext('pepe').firestore();
      const zoe = env.authenticatedContext('zoe').firestore();
      // código equivocado o vínculo a nombre de otro: no
      await assertFails(setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo({ codigo: 'TIT-NADA' })));
      await assertFails(setDoc(doc(zoe, 'vinculos/pepe_beto'), vinculo()));
      await assertSucceeds(setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo()));
      await assertSucceeds(getDoc(doc(pepe, 'users/beto')));
      await assertSucceeds(getDocs(collection(pepe, 'users/beto/workouts')));
      await assertSucceeds(getDocs(query(collection(pepe, 'vinculos'), where('profesionalId', '==', 'pepe'), where('activo', '==', true))));
      await assertSucceeds(getDocs(query(collection(beto, 'vinculos'), where('clienteId', '==', 'beto'), where('activo', '==', true))));
      // ver no es cambiar: el entrenador no toca entrenamientos ni el perfil
      await assertFails(setDoc(doc(pepe, 'users/beto/workouts/w9'), entreno));
      await assertFails(setDoc(doc(pepe, 'users/beto'), { nombre: 'X' }, { merge: true }));
      // otra persona sigue sin ver nada
      await assertFails(getDoc(doc(zoe, 'users/beto')));
      await assertFails(getDocs(query(collection(zoe, 'vinculos'), where('profesionalId', '==', 'pepe'))));
    });

    it('rutinas asignadas: las maneja el entrenador; el cliente no las cambia', async () => {
      await preparar();
      const beto = env.authenticatedContext('beto').firestore();
      const pepe = env.authenticatedContext('pepe').firestore();
      await setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo());
      const r = { nombre: 'Fuerza', ejercicios: [], dias: [1], orden: 0, asignadaPor: 'pepe', nombreAsignador: 'Pepe' };
      await assertSucceeds(setDoc(doc(pepe, 'users/beto/routines/ra'), r));
      await assertFails(setDoc(doc(pepe, 'users/beto/routines/rb'), { ...r, asignadaPor: 'otro' }));
      await assertFails(setDoc(doc(beto, 'users/beto/routines/ra'), { ...r, nombre: 'Cambiada' }));
      await assertFails(setDoc(doc(beto, 'users/beto/routines/rc'), r));
      await assertSucceeds(setDoc(doc(beto, 'users/beto/routines/propia'), { nombre: 'Mía', ejercicios: [], dias: [], orden: 1 }));
      await assertFails(setDoc(doc(pepe, 'users/beto/routines/propia'), { nombre: 'Mía', ejercicios: [], dias: [], orden: 1, asignadaPor: 'pepe' }));
      await assertFails(deleteDoc(doc(pepe, 'users/beto/routines/propia')));
      await assertSucceeds(deleteDoc(doc(pepe, 'users/beto/routines/ra')));
    });

    it('comentarios y objetivos', async () => {
      await preparar();
      const beto = env.authenticatedContext('beto').firestore();
      const pepe = env.authenticatedContext('pepe').firestore();
      await setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo());
      const c = { autorId: 'pepe', autorNombre: 'Pepe', texto: 'Bien ahí', fecha: 1, leido: false };
      await assertSucceeds(setDoc(doc(pepe, 'users/beto/comments/k1'), c));
      await assertFails(setDoc(doc(pepe, 'users/beto/comments/k2'), { ...c, autorId: 'beto' }));
      await assertSucceeds(updateDoc(doc(beto, 'users/beto/comments/k1'), { leido: true }));
      await assertFails(updateDoc(doc(beto, 'users/beto/comments/k1'), { texto: 'otra cosa' }));
      await assertSucceeds(setDoc(doc(beto, 'users/beto/comments/k3'), { ...c, autorId: 'beto', autorNombre: 'Beto' }));
      const o = { tipo: 'frecuencia', titulo: '3 por semana', meta: 3, creadoPor: 'pepe', fecha: 1 };
      await assertSucceeds(setDoc(doc(pepe, 'users/beto/goals/o1'), o));
      await assertFails(setDoc(doc(beto, 'users/beto/goals/o2'), { ...o, creadoPor: 'beto' }));
      await assertSucceeds(getDocs(collection(beto, 'users/beto/goals')));
    });

    it('al cortar el vínculo o dar de baja al entrenador, deja de ver', async () => {
      await preparar();
      const beto = env.authenticatedContext('beto').firestore();
      const pepe = env.authenticatedContext('pepe').firestore();
      await setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo());
      await assertFails(updateDoc(doc(pepe, 'vinculos/pepe_beto'), { activo: true, clienteId: 'zoe' }));
      await assertSucceeds(updateDoc(doc(beto, 'vinculos/pepe_beto'), { activo: false, hasta: 2 }));
      await assertFails(getDoc(doc(pepe, 'users/beto')));
      // se vuelve a vincular, y el admin lo da de baja
      await assertSucceeds(setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo()));
      await assertSucceeds(getDoc(doc(pepe, 'users/beto')));
      await env.withSecurityRulesDisabled(async (x) => { await updateDoc(doc(x.firestore(), 'profesionales/pepe'), { activo: false }); });
      await assertFails(getDoc(doc(pepe, 'users/beto')));
    });

    it('con un entrenador dado de baja no se puede vincular', async () => {
      await preparar(false);
      const beto = env.authenticatedContext('beto').firestore();
      await assertFails(setDoc(doc(beto, 'vinculos/pepe_beto'), vinculo()));
    });
  });
});
