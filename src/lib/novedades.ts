export const VERSION = __APP_VERSION__;
export const FECHA_ARMADO = __BUILD_DATE__;
export const COMMIT = __COMMIT__;

export const NOVEDADES: { version: string; fecha: string; cambios: string[] }[] = [
  {
    version: '1.6.2',
    fecha: '2026-11-15',
    cambios: [
      'Vista de foco medida a tu pantalla: la animación se ve completa y "Serie hecha", el cronómetro y "Sigue" entran sin bajar.',
      'La primera vez que empezás una rutina, primero cargás peso y reps de cada serie; el reloj arranca después.',
    ],
  },
  {
    version: '1.6.1',
    fecha: '2026-11-14',
    cambios: [
      'Al armar el entrenamiento libre ya podés poner peso y reps de cada serie, agregar o borrar series.',
      'Transiciones suaves al cambiar de pantalla y al abrir o cerrar las hojas.',
    ],
  },
  {
    version: '1.6.0',
    fecha: '2026-11-14',
    cambios: [
      'Entrenamiento libre: primero lo armás (ejercicios, series y orden) y el reloj arranca recién al tocar "Empezar".',
      'Subir, bajar y quitar ejercicios con botones a la vista en cada tarjeta.',
      'Cada serie tiene su botón de papelera para eliminarla.',
    ],
  },
  {
    version: '1.5.1',
    fecha: '2026-11-14',
    cambios: [
      'Sobrecarga editable al empezar: con − y + elegís cuánto subir (o bajar) en cada ejercicio.',
      'Foco en el celular usa toda la pantalla: animación grande, series del ejercicio como botones y controles más grandes.',
      'Pesos con dos decimales (53,75 kg) en toda la app.',
    ],
  },
  {
    version: '1.5.0',
    fecha: '2026-11-14',
    cambios: [
      'Vista de foco rehecha: serie actual, peso y reps alineados, "Serie hecha" grande, cronómetro y lo que sigue, sin bajar la pantalla.',
      'La sobrecarga progresiva se pregunta al empezar la rutina, ejercicio por ejercicio.',
      'Botón "Ver todo" para ver el entrenamiento completo y volver al foco en cualquier ejercicio.',
    ],
  },
  {
    version: '1.4.0',
    fecha: '2026-11-14',
    cambios: [
      'Vista de foco: la serie actual a pantalla completa, con la animación grande, cronómetro grande y lo que sigue abajo.',
      'Sobrecarga progresiva automática o manual (Perfil): sugiere subir el peso cuando cumplís todas las repeticiones.',
      'Gráfico semanal con valores, fechas, detalle de cada semana y totales del período.',
      'Arreglo: en celulares la barra del entrenamiento ya no achica la pantalla.',
    ],
  },
  {
    version: '1.3.1',
    fecha: '2026-11-14',
    cambios: [
      'Línea "Última vez" en cada ejercicio mientras entrenás (fecha, peso y repeticiones).',
      'ANTERIOR ya no queda vacío si hoy hacés más series que la vez pasada.',
      'Modo prueba: la sesión no se pierde al recargar ni cuando la app se actualiza sola.',
    ],
  },
  {
    version: '1.3.0',
    fecha: '2026-11-14',
    cambios: [
      'Fotos animadas de cada ejercicio (inicio y final del movimiento), de free-exercise-db, dominio público.',
      'PC: Inicio con filas alineadas entre columnas; tarjetas de entrenamiento de igual alto y tabla más pareja.',
      'La columna ANTERIOR compara por tipo de serie: la serie al fallo con la de fallo.',
      'Modo prueba: la rutina Full body aparece como ya hecha durante 8 semanas (datos inventados).',
    ],
  },
  {
    version: '1.2.0',
    fecha: '2026-11-14',
    cambios: [
      'PC: pantallas a dos columnas que aprovechan el ancho (portada, inicio, entreno, progreso, perfil).',
      'Plantilla "Full body principiante" (A lunes, B miércoles, C viernes) lista para cargar.',
      'Rutinas con rango de repeticiones (8–12), series al fallo (1×Máx) y alternativas ("o Jalón").',
      'Ejercicios nuevos: Remo Pendlay, Press declinado, Dominadas neutras y supinas, Extensión de tríceps con mancuernas.',
    ],
  },
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
