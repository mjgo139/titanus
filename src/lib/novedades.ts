export const VERSION = __APP_VERSION__;
export const FECHA_ARMADO = __BUILD_DATE__;
export const COMMIT = __COMMIT__;

export const NOVEDADES: { version: string; fecha: string; cambios: string[] }[] = [
  {
    version: '1.27.0',
    fecha: '22/11/2026',
    cambios: [
      'En modo Mármol, los textos que pisan una foto ("Cada serie cuenta", las tarjetas de programas) ya no tienen esa sombra negra sucia.',
      'Las fichas de los programas ya no se salen de la pantalla del celular ni hay que deslizar de costado.',
      'Perfil: los botones de Apariencia y Sobrecarga quedan alineados aunque el texto ocupe dos líneas.',
      'Las estatuas (legionario o legionaria) salen del género que elegís al empezar; ya no se eligen en Perfil, y el género tiene solo Hombre y Mujer.',
    ],
  },
  {
    version: '1.26.0',
    fecha: '21/11/2026',
    cambios: [
      'Ahora podés poner tu foto de perfil (Perfil → Cambiar foto). Se ve en el Panel del día, en la barra lateral y en Perfil; sin foto sigue la estatua.',
      'La tarjeta de Perfil es igual en todas las apps de la familia: tu foto en el laurel, nombre, correo y los botones Cambiar foto y Cambiar nombre.',
    ],
  },
  {
    version: '1.25.0',
    fecha: '21/11/2026',
    cambios: [
      'El Panel del día ya no muestra el nivel: debajo del saludo va una frase estoica que cambia cada día (sobre esfuerzo y disciplina).',
      'Sin el emblema chiquito en el panel; en la barra lateral, debajo de tu nombre va tu correo.',
    ],
  },
  {
    version: '1.24.0',
    fecha: '21/11/2026',
    cambios: [
      'Panel del día y Tu semana son las mismas piezas que en las otras apps de la familia: la fecha va arriba del saludo y las fichas llevan a Progreso.',
      'Todas las secciones van numeradas (I · NOMBRE, II · APARIENCIA…).',
    ],
  },
  {
    version: '1.23.0',
    fecha: '21/11/2026',
    cambios: [
      'La barra lateral de la PC y las pestañas del celular ahora son las mismas en todas las apps de la familia: marca más grande con brillo, línea fina sobre tu nombre y pestañas con la activa en oro.',
    ],
  },
  {
    version: '1.22.0',
    fecha: '21/11/2026',
    cambios: [
      'Una sola escala de letras para las 4 apps de la familia: 11 · 12,5 · 13,5 · 15 · 16 · 18 · 20 · 26 · 28 (antes había 28 tamaños sueltos).',
      'Íconos en tres tamaños parejos (16 con texto, 20 en botones y filas, 23 en la barra de abajo), del mismo juego que usan las otras apps.',
    ],
  },
  {
    version: '1.21.0',
    fecha: '21/11/2026',
    cambios: [
      'StoaGym ahora toma colores, letras, medidas y piezas de la familia estoica (carpeta familia/), el mismo diseño que van a usar Stoica, Nutrición y Recetas.',
      'Control automático: no se publica si aparece un color escrito a mano fuera de la familia.',
      'Modo Mármol: las marcas de serie calentamiento, fallo y drop usan los tonos del modo claro.',
    ],
  },
  {
    version: '1.20.0',
    fecha: '2026-11-20',
    cambios: [
      'Hasta 3 programas a la vez. Con el cuarto, elegís cuál dejar; Inicio muestra una tarjeta por programa.',
      'Varias rutinas el mismo día: Inicio muestra la próxima pendiente y la lista de todas las de hoy, con ✓ en las hechas.',
      'Widgets: "Entrenamiento de hoy" pasa sola a la siguiente rutina del día ("+1 más hoy") y "Programa" muestra hasta 3.',
    ],
  },
  {
    version: '1.19.1',
    fecha: '2026-11-20',
    cambios: ['Arreglo: los widgets "Entrenamiento de hoy" y "Programa" ya se pueden agregar a la pantalla de inicio.'],
  },
  {
    version: '1.19.0',
    fecha: '2026-11-20',
    cambios: [
      'Widgets para Android: Racha (2×2), Tu semana (4×1), Entrenamiento de hoy (4×2, con botón Entrenar) y Programa (4×2).',
      'Tocar un widget abre la pantalla que corresponde; "Entrenar" arranca directo la rutina del día.',
    ],
  },
  {
    version: '1.18.0',
    fecha: '2026-11-20',
    cambios: [
      'Dirección nueva: https://stoagym.web.app. La anterior sigue funcionando y avisa del cambio.',
      'Los enlaces de invitación de entrenador usan la dirección nueva.',
      'La APK nueva abre stoagym.web.app.',
    ],
  },
  {
    version: '1.17.1',
    fecha: '2026-11-20',
    cambios: ['Pantalla de inicio: al abrir StoaGym se ve el emblema (laurel y mancuerna) sobre negro, y se desvanece suave cuando la app está lista.'],
  },
  {
    version: '1.17.0',
    fecha: '2026-11-20',
    cambios: [
      'TITANUS ahora se llama StoaGym.',
      'Ícono nuevo: el laurel de la familia con una mancuerna, en el teléfono, en el navegador y dentro de la app.',
      'Los códigos nuevos de entrenador empiezan con STG- (los TIT- que ya existen siguen funcionando).',
    ],
  },
  {
    version: '1.16.1',
    fecha: '2026-11-18',
    cambios: ['Ícono con las mismas proporciones que el de Stoica: laurel abierto con hojitas interiores y la T al centro.'],
  },
  {
    version: '1.16.0',
    fecha: '2026-11-18',
    cambios: ['Ícono nuevo de la familia Stoica: laurel dorado y T marfil.', 'La app ahora se llama "Titanus" en el teléfono.'],
  },
  {
    version: '1.15.2',
    fecha: '2026-11-18',
    cambios: ['Las carátulas de los programas se enfocan arriba: los personajes ya no salen con la cabeza cortada.'],
  },
  {
    version: '1.15.1',
    fecha: '2026-11-17',
    cambios: ['Carátulas propias para 8 programas, en versión legionario y legionaria según tu figura (Perfil → Apariencia).'],
  },
  {
    version: '1.15.0',
    fecha: '2026-11-17',
    cambios: [
      'Programas separados por lugar: Gimnasio, Calistenia y En casa, con filtro arriba.',
      'Cuatro programas nuevos: Fundamentos de calistenia, Gladiador de barra, Legión en casa (sin equipo) y Casa con mancuernas.',
      'En la ficha de cada programa, cada ejercicio muestra su animación pequeñita, y se indica el equipo que hace falta.',
    ],
  },
  {
    version: '1.14.2',
    fecha: '2026-11-16',
    cambios: ['En Inicio (PC), "Entrenamiento de hoy" y "Tu semana" tienen la misma altura.'],
  },
  {
    version: '1.14.1',
    fecha: '2026-11-16',
    cambios: [
      'En PC, las mismas medidas que Stoica: contenido hasta 1480 px con los mismos márgenes, barra lateral con renglones de 46 px e íconos más grandes.',
      'Panel del día más amplio (saludo de 40 px), fichas, tarjetas y espacios iguales a Stoica.',
      'Cada página empieza como en Stoica: etiqueta en oro, título grande y una línea de explicación.',
    ],
  },
  {
    version: '1.14.0',
    fecha: '2026-11-16',
    cambios: [
      'TITANUS ahora es de la familia de Stoica: "Panel del día" con laurel de fondo, saludo según la hora y fichas (fecha, racha, entrenamientos).',
      'Títulos de sección al estilo de la familia: "I · Entrenamiento de hoy" en oro con línea fina, también en Entreno, Progreso y Perfil.',
      'Tu semana como en Stoica: día, número grande, hoy subrayado en oro y "días entrenados" con barra.',
      'En PC, tu nombre y rango al pie de la barra lateral.',
    ],
  },
  {
    version: '1.13.1',
    fecha: '2026-11-16',
    cambios: ['Cabecera de la lista renovada: una sola franja con el avance, el nombre y las cifras (carga, series y ejercicios).'],
  },
  {
    version: '1.13.0',
    fecha: '2026-11-16',
    cambios: [
      'La regla de peso y altura se arrastra también con el mouse, con la rueda y con las flechas del teclado.',
      'Ojito para mostrar u ocultar la contraseña al ingresar o crear la cuenta.',
      'Entrenar en PC aprovecha la pantalla: "Orden de hoy" a la izquierda, la animación grande y los controles al lado.',
      'En la lista cada ejercicio lleva su número romano y van uno debajo del otro; en PC la tabla de series queda junto a los datos del ejercicio.',
    ],
  },
  {
    version: '1.12.0',
    fecha: '2026-11-16',
    cambios: [
      'Inicio más limpio: sin la frase y sin los accesos repetidos de la barra de abajo.',
      'Programas en su propia página: arriba de Entreno elegís "Mis entrenos" o "Programas". Todas las tarjetas del mismo tamaño.',
      'Transiciones suaves: las pantallas se precargan y al cambiar de pestaña hay un fundido cruzado.',
      'Mientras algo carga se ve su silueta con un brillo suave (esqueleto), en vez de "Cargando…".',
    ],
  },
  {
    version: '1.11.1',
    fecha: '2026-11-16',
    cambios: [
      'Barra del entrenamiento renovada: selector Foco | Lista, un solo reloj y filo dorado.',
      'La tarjeta del anillo muestra la carga levantada, series y ejercicios (sin reloj repetido).',
    ],
  },
  {
    version: '1.11.0',
    fecha: '2026-11-16',
    cambios: [
      'Programas: planes de varias semanas con objetivo (Abdomen de acero, Más dominadas, De 10 a 30 flexiones, Brazos de centurión, Glúteos de gladiadora, Fuerza base 5×5). Todos gratis.',
      'El programa en curso aparece en Inicio con tu avance y la próxima sesión; cada sesión terminada se marca sola.',
      'Nueva cabecera del entrenamiento: anillo de series en números romanos, tiempo y carga levantada.',
    ],
  },
  {
    version: '1.10.0',
    fecha: '2026-11-16',
    cambios: [
      'Bienvenida "Conocerte": género, nacimiento, peso (regla deslizable), altura, objetivo y experiencia, con un plan recomendado. Se edita en Perfil → Datos personales.',
      'Biblioteca: filtro por equipo, "Tus más usados" y botón (i) con la animación y tus marcas del ejercicio.',
      'Ficha de cada rutina: Comenzar, gráfico por sesión (volumen, repeticiones o duración) y ejercicios serie por serie.',
      'Entrenando: la serie hecha se pinta de verde y cada ejercicio tiene botones de Descanso y Nota.',
    ],
  },
  {
    version: '1.9.0',
    fecha: '2026-11-16',
    cambios: [
      'Un solo editor de ejercicios en toda la app: una fila por serie con peso y reps, igual al editar una rutina, armar el libre o preparar la primera vez.',
      'Las rutinas guardan peso y reps de cada serie; tocando el número de la serie la marcás como calentamiento (C) o al fallo (F).',
    ],
  },
  {
    version: '1.8.3',
    fecha: '2026-11-16',
    cambios: ['La APK abre siempre la última versión publicada (se actualiza sola) y funciona sin conexión después de la primera vez.'],
  },
  {
    version: '1.8.2',
    fecha: '2026-11-16',
    cambios: [
      'Editar rutina: cada ejercicio tiene su peso (kg o lb); se usa la primera vez y después sigue tu progresión.',
      'Editar rutina: los controles van en dos columnas en el celular y ya no se superponen.',
    ],
  },
  {
    version: '1.8.1',
    fecha: '2026-11-16',
    cambios: ['Las estatuas muestran siempre la cabeza, también en los recuadros anchos de la PC.'],
  },
  {
    version: '1.8.0',
    fecha: '2026-11-15',
    cambios: [
      'Estatuas nuevas en alta calidad en la portada, Inicio, Entreno, Progreso, el resumen y el perfil.',
      'Perfil → Apariencia: elegí ver estatuas de legionario o de legionaria.',
    ],
  },
  {
    version: '1.7.1',
    fecha: '2026-11-15',
    cambios: [
      'Modo prueba: una pestaña abierta antes de una actualización ya no pierde las cuentas y clientes de ejemplo.',
      'La ficha del cliente avisa si no puede cargar, en vez de quedarse cargando.',
      'Modo prueba: botón "Volver a los datos de ejemplo" en Perfil.',
    ],
  },
  {
    version: '1.7.0',
    fecha: '2026-11-15',
    cambios: [
      'Entrenadores: panel de clientes con alertas, código de invitación y enlace por WhatsApp.',
      'Ficha de cada cliente: resumen, entrenamientos con comentarios, rutinas asignadas, progreso, objetivos y mensajes.',
      'Clientes: se vinculan con el código, ven "De tu entrenador", objetivos y mensajes, y pueden cortar el vínculo.',
      'Administración: aprobar solicitudes y dar de alta o de baja a los profesionales.',
    ],
  },
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
