import type {
  Ejercicio, Entrenamiento, EstadoEjercicio, Perfil, RegistroCuerpo, Rutina,
} from '../lib/tipos';
import type { Comentario, Objetivo, Profesional, Solicitud, TipoProfesional, Vinculo } from '../pro/tipos';

export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  /** Entró como invitado: puede crear su cuenta después sin perder lo registrado */
  invitado?: boolean;
}

/**
 * Todo el acceso a datos pasa por acá. Hay dos versiones:
 *  - RepoMemoria: modo prueba, sin Firebase, con una cuenta de ejemplo.
 *  - RepoFirebase: la real, con Auth y Firestore.
 */
export interface Repo {
  readonly modo: 'prueba' | 'firebase';
  readonly permiteGoogle: boolean;

  escucharSesion(cb: (u: Usuario | null) => void): () => void;
  ingresar(email: string, clave: string): Promise<void>;
  registrar(nombre: string, email: string, clave: string): Promise<void>;
  recuperarClave(email: string): Promise<void>;
  ingresarConGoogle(): Promise<void>;
  ingresarComoInvitado(): Promise<void>;
  salir(): Promise<void>;
  borrarCuenta(): Promise<void>;

  leerPerfil(u: Usuario): Promise<Perfil>;
  /** Arranque rápido: el perfil recién traído del servidor (null si no hay conexión o no aplica) */
  perfilDelServidor?(u: Usuario): Promise<Perfil | null>;
  guardarPerfil(uid: string, cambios: Partial<Perfil>): Promise<void>;
  esAdmin(uid: string): Promise<boolean>;

  leerRutinas(uid: string): Promise<Rutina[]>;
  guardarRutina(uid: string, r: Rutina): Promise<void>;
  borrarRutina(uid: string, id: string): Promise<void>;

  leerPropios(uid: string): Promise<Ejercicio[]>;
  guardarPropio(uid: string, e: Ejercicio): Promise<void>;

  leerEstados(uid: string, ids?: string[]): Promise<Map<string, EstadoEjercicio>>;

  /** Guarda el entrenamiento, los resúmenes por ejercicio y el resumen del perfil en una sola tanda */
  guardarEntrenamiento(
    uid: string,
    e: Entrenamiento,
    estados: EstadoEjercicio[],
    resumen: Perfil['resumen'],
  ): Promise<void>;
  leerHistorial(uid: string, limite: number, antesDe?: number): Promise<Entrenamiento[]>;

  /** Últimas sesiones de una rutina (para su ficha): lee solo esas */
  leerSesionesDeRutina(uid: string, rutinaId: string, limite: number): Promise<Entrenamiento[]>;
  leerCuerpo(uid: string): Promise<RegistroCuerpo[]>;
  guardarCuerpo(uid: string, r: RegistroCuerpo): Promise<void>;

  exportar(uid: string): Promise<unknown>;

  // ── Profesionales y clientes (base reutilizable) ──
  /** Perfil de otra persona: solo si es su cliente (las reglas lo controlan) */
  leerPerfilDe(uid: string): Promise<Perfil | null>;
  leerProfesional(uid: string): Promise<Profesional | null>;
  leerMiSolicitud(uid: string): Promise<Solicitud | null>;
  enviarSolicitud(s: Solicitud): Promise<void>;
  /** Admin */
  leerSolicitudes(): Promise<Solicitud[]>;
  aprobarSolicitud(s: Solicitud, codigo: string): Promise<Profesional>;
  rechazarSolicitud(uid: string): Promise<void>;
  leerProfesionales(): Promise<Profesional[]>;
  cambiarEstadoProfesional(uid: string, activo: boolean): Promise<void>;
  /** El cliente ingresa el código: así da su permiso */
  vincular(cliente: { uid: string; nombre: string }, codigo: string, tipo: TipoProfesional): Promise<Vinculo>;
  leerMisProfesionales(clienteId: string): Promise<Vinculo[]>;
  leerClientes(profesionalId: string): Promise<Vinculo[]>;
  terminarVinculo(id: string): Promise<void>;
  leerComentarios(clienteId: string): Promise<Comentario[]>;
  guardarComentario(clienteId: string, c: Comentario): Promise<void>;
  marcarLeidos(clienteId: string, ids: string[]): Promise<void>;
  leerObjetivos(clienteId: string): Promise<Objetivo[]>;
  guardarObjetivo(clienteId: string, o: Objetivo): Promise<void>;
  borrarObjetivo(clienteId: string, id: string): Promise<void>;
}

export class ErrorApp extends Error {}

export function mensajeError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const mapa: Record<string, string> = {
    'auth/invalid-credential': 'El correo o la contraseña no coinciden.',
    'auth/wrong-password': 'El correo o la contraseña no coinciden.',
    'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
    'auth/invalid-email': 'Ese correo no parece válido.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá un momento y probá de nuevo.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/network-request-failed': 'Sin conexión. Revisá tu internet.',
    'auth/credential-already-in-use': 'Esa cuenta de Google ya existe. Salí del modo invitado e ingresá con ella.',
    'auth/operation-not-allowed': 'Ese modo de acceso no está habilitado todavía.',
    'auth/requires-recent-login': 'Por seguridad, salí y volvé a ingresar antes de borrar la cuenta.',
    'permission-denied': 'No tenés permiso para eso.',
    'pro/codigo': 'Ese código no existe o el profesional ya no está activo.',
    'pro/propio': 'No podés ser cliente de vos mismo.',
  };
  if (mapa[code]) return mapa[code];
  if (e instanceof Error && e.message) return e.message;
  return 'Algo salió mal. Probá de nuevo.';
}
