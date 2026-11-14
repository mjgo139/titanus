export const VERSION = __APP_VERSION__;
export const FECHA_ARMADO = __BUILD_DATE__;
export const COMMIT = __COMMIT__;

export const NOVEDADES: { version: string; fecha: string; cambios: string[] }[] = [
  {
    version: '1.1.0',
    fecha: '2026-11-14',
    cambios: [
      'Nueva identidad: noche romana con oro, estatuas y rango/nivel del legionario. Modo claro "Mármol", hermano de Stoica.',
      'Entrenamiento al estilo Hevy: duración, volumen y series en vivo; tabla SERIE · ANTERIOR · KG · REPS.',
      'Tipos de serie (calentamiento, fallo, drop), descanso por ejercicio, notas y 1RM estimado.',
      'Entrenamiento libre, minimizar y volver, repetir un entrenamiento y guardar como rutina.',
      'Progreso con resumen de 4 semanas, gráfico semanal, calendario mensual y logros.',
      'Entrar como invitado y crear la cuenta después sin perder nada.',
    ],
  },
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
