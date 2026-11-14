import type { EjercicioEntreno } from './tipos';

/** Entrenamiento en curso: se guarda en el teléfono y solo se sube a Firebase al terminar */
export interface Borrador {
  rutinaId?: string;
  nombre: string;
  inicio: number;
  ejercicios: EjercicioEntreno[];
  actual: number;
}

const clave = (uid: string) => `titanus-borrador-${uid}`;

export function leerBorrador(uid: string): Borrador | null {
  try {
    const t = localStorage.getItem(clave(uid));
    return t ? (JSON.parse(t) as Borrador) : null;
  } catch {
    return null;
  }
}

export function guardarBorrador(uid: string, b: Borrador) {
  try { localStorage.setItem(clave(uid), JSON.stringify(b)); } catch { /* lleno o bloqueado */ }
}

export function borrarBorrador(uid: string) {
  try { localStorage.removeItem(clave(uid)); } catch { /* nada */ }
}
