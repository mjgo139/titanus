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
  programa: string;
  programaId: string;
  programaSiguiente: string;
  programaHechas: number;
  programaTotal: number;
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
export function fechaCorta(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
