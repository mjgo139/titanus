export const VERSION = __APP_VERSION__;
export const FECHA_ARMADO = __BUILD_DATE__;
export const COMMIT = __COMMIT__;

export const NOVEDADES: { version: string; fecha: string; cambios: string[] }[] = [
  {
    version: '1.0.0',
    fecha: '2026-11-14',
    cambios: [
      'Fase 1: acceso con correo y Google, Hoy con frase del día, racha y semana.',
      'Rutinas por día con biblioteca de 60 ejercicios y ejercicios propios.',
      'Entrenar: series con peso, repeticiones y sensación, la última vez y descanso con sonido.',
      'Progreso: historial, gráfico por ejercicio, récords y medidas del cuerpo.',
      'Perfil: apariencia, unidades, recordatorios, exportar datos y borrar cuenta.',
    ],
  },
];
