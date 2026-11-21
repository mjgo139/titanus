import { Capacitor, registerPlugin } from '@capacitor/core';

/** Datos que muestran los widgets de Android (ver android/.../Widgets.java) */
export interface DatosWidget {
  racha: number;
  rango: string;
  /** Días entrenados recientes como yyyy-MM-dd separados por coma (el widget arma la semana) */
  fechas: string;
  entreno: string;
  entrenoDetalle: string;
  esHoy: boolean;
  /** Textos del widget "Entrenamiento de hoy" (desde v1.20) */
  etiqueta: string;
  boton: string;
  rutaBoton: string;
  /** Hasta 3 programas, como JSON: [{ id, nombre, hechas, total, siguiente }] */
  programas: string;
}

interface PluginWidget {
  actualizar(d: DatosWidget): Promise<void>;
  rutaPendiente(): Promise<{ ruta?: string | null }>;
}

const Widget = registerPlugin<PluginWidget>('Widget');
/** Solo en la APK que ya trae los widgets (las viejas no tienen el plugin) */
const hayWidgets = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Widget');

let ultimo = '';
export function actualizarWidgets(d: DatosWidget) {
  if (!hayWidgets()) return;
  const clave = JSON.stringify(d);
  if (clave === ultimo) return; // no repetir si nada cambió
  ultimo = clave;
  Widget.actualizar(d).catch(() => { ultimo = ''; });
}

/** Fecha local yyyy-MM-dd (igual que la que compara el widget) */
export { fechaLocal as fechaCorta } from './logica';

/** Si la app se abrió tocando un widget, va a esa pantalla (al abrir y al volver a primer plano) */
export function escucharWidgets(ir: (ruta: string) => void) {
  if (!hayWidgets()) return () => {};
  const revisar = () => {
    if (document.visibilityState !== 'visible') return;
    Widget.rutaPendiente().then((r) => { if (r.ruta) ir(r.ruta); }).catch(() => {});
  };
  revisar();
  document.addEventListener('visibilitychange', revisar);
  return () => document.removeEventListener('visibilitychange', revisar);
}
