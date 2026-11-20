# StoaGym (antes TITANUS) · instrucciones para Claude

> **v1.17.0 (decisión del dueño, 20/11/2026): la app se llama StoaGym.** El repositorio (`mjgo139/titanus`), el proyecto de Firebase (`titanus-10398`), la dirección web y el `appId` de Android siguen con el nombre viejo (cambiarlos es aparte). Donde este archivo dice TITANUS, entender StoaGym.

Este archivo resume cómo trabajar en este repositorio. Leelo entero antes de cambiar algo.

## Estado actual

| Dato | Valor |
|---|---|
| Fase | 1 (lo esencial) publicada; v1.1.0 = rediseño romano + Hevy; v1.2.0 = PC a dos columnas + plantillas |
| Proyecto Firebase | `titanus-10398` (plan Spark, gratis) |
| Firestore | modo nativo, edición Standard, región `southamerica-east1` (São Paulo) |
| Auth | correo/contraseña, Google y anónimo ("Continuar como invitado") habilitados. Limpieza automática de anónimos: apagada |
| Web | https://titanus-10398.web.app |
| APK | se arma en cada push y se publica en el Release `apk-ultima`: https://github.com/mjgo139/titanus/releases/tag/apk-ultima (el plan Spark no permite `.apk` en Hosting). Desde v1.8.3 la APK carga `https://titanus-10398.web.app` (`server.url` en `capacitor.config.ts`) y usa el service worker: se actualiza sola; sin conexión la primera vez muestra `public/sin-conexion.html`. Instalar la APK de nuevo solo hace falta si cambia algo nativo (plugins, ícono, permisos). |
| Admin | uids listados en el documento `config/admins` (`{ uids: [...] }`), cargado a mano en la consola. Nunca en el código. |
| Secreto de deploy | `FIREBASE_SERVICE_ACCOUNT` en GitHub → Settings → Secrets → Actions (lo carga el dueño). La cuenta `firebase-adminsdk-fbsvc@…` necesita los roles Administrador de Firebase y Consumidor de Service Usage (ya asignados) |

## Comandos

| Para qué | Comando |
|---|---|
| Probar en modo prueba (sin Firebase) | `npm run demo` → http://localhost:5173 (cuenta `marco@ejemplo.com` / `titanus`) |
| Modo prueba en la web publicada | abrir `https://titanus-10398.web.app/?prueba=1` (`?prueba=0` para salir) |
| Pruebas de lógica | `npm test` |
| Pruebas de pantallas + capturas | `npm run test:e2e` (capturas en `capturas/celular` y `capturas/pc`). Fuera de GitHub, indicar Chrome con `PW_CHROME=/usr/bin/google-chrome` |
| Pruebas de reglas | `npm run test:reglas` (necesita Java y descarga el emulador) |
| Armar | `npm run build` |

## Estructura

- `src/lib/` lógica pura con pruebas (`logica.ts`, `entreno.ts`, `biblioteca.ts`, `frases.ts`).
- `src/data/repo.ts` interfaz única de datos. `memoria.ts` = modo prueba; `firebase.ts` = real.
- `src/screens/` pantallas: `Acceso` (portada), `Hoy` (Inicio), `Entreno` (libre + rutinas), `Entrenar` (en vivo, estilo Hevy), `Resumen`, `Progreso`, `DetalleEjercicio`, `Perfil`. `src/ui/` piezas comunes.
- `src/pro/` **base reutilizable "profesional y sus clientes"** (sirve para entrenadores hoy y nutricionistas mañana): `tipos.ts`, `logica.ts` (con pruebas), `especialidades.ts` (palabras y prefijo de código por tipo; `TIPO_APP = 'entrenador'`), `piezas.tsx` (medallón, estado, comentarios, objetivos), pantallas genéricas `PanelClientes`, `FichaCliente` (pestañas que define cada especialidad), `MiProfesional` (lado del cliente), `Admin`, `SeccionPerfil`, `AvisoHoy`. Lo propio del gimnasio está en `src/pro/entrenador/` (`Ficha.tsx` con las secciones y `medir.ts` para objetivos).
- `src/assets/` estatuas del dueño (v1.8.0, WebP 600–900 px): `busto` (portada), `espalda`, `legionario`, `capa`, `avatar` y sus versiones `-f` de legionaria. Se eligen con `estatuas(perfil.figura)` en `src/ui/estatuas.ts`; `perfil.figura` = `hombre` | `mujer` (Perfil → Apariencia).
- Firestore: `users/{uid}` + subcolecciones `routines`, `customExercises`, `workouts`, `exerciseStats`, `bodyLogs`, `comments`, `goals`. Colecciones de la plataforma: `profesionales/{uid}` y `codigos/{codigo}` (solo los escribe el admin), `solicitudes/{uid}` (las crea el usuario), `vinculos/{profId_clienteId}` (lo crea el cliente con un código válido = su permiso; cualquiera de los dos lo corta). Reglas en `firestore.rules`: un profesional **activo** con vínculo **activo** puede leer los datos del cliente, escribir rutinas con `asignadaPor` = él, comentarios y objetivos; nunca entrenamientos ni perfil.
- Para ahorrar lecturas: el perfil guarda `resumen` (días entrenados) y `exerciseStats` guarda la última vez y los puntos del gráfico. El entrenamiento en curso se guarda en el teléfono y se sube una sola vez al terminar.

## Dirección de diseño (decidida por el dueño el 14/11/2026, manda sobre la sección "Estilo visual" de abajo)

- **La esencia es su diseño propio (TITANUS_app.html):** fondo negro con vetas y oro (`#f2c55c`, botones con degradé dorado), estatuas romanas, marca y títulos en **Cinzel**, rango y nivel ("Legionario · Nivel 5"), "Continuar como invitado".
- **Hermana de Stoica, no copia:** se mantienen Playfair para números, números romanos, frases estoicas y celebraciones breves. El modo claro se llama **"Mármol"** y usa la piedra/bronce de Stoica. El oscuro **"Noche romana"** es el predeterminado.
- **Sin** Mente ni Hábitos. Pestañas: Inicio · Entreno · Progreso · Perfil.
- **Seguimiento estilo Hevy:** duración/volumen/series en vivo, tabla SERIE · ANTERIOR · KG · REPS · ✓, tipos de serie (calentamiento C, fallo F, drop D), descanso por ejercicio, notas, 1RM (Epley), libre, minimizar, repetir y guardar como rutina.
- **PC (≥1024px):** desde v1.14.1 las **medidas de Stoica**: `main` hasta 1480px con márgenes 48px (`lg:px-12`), tarjetas radio 16 y relleno 18/20, panel del día relleno 30/34 y saludo 40px, fichas de 32px (12,5px negrita), separación 20/24px, barra lateral con renglones de 46px (14,5px, íconos 22, radio 10). Cabecera de página `CabeceraPagina` (etiqueta oro + título 36px + línea). Celular sigue con máximo 480px.
- **Plantillas** en `src/lib/plantillas.ts` (Full body principiante A/B/C). Las rutinas admiten `repsMax` (rango), `alFallo` (series 1×Máx), `nota` (alternativa) y `peso` (kg planificado, v1.8.2: se usa solo si ese ejercicio no tiene historial). **Editor único (v1.9.0):** `src/screens/TarjetaEjercicio.tsx` (`TarjetaEjercicio`, `TablaSeries`, `AccionesEjercicio`, `textoDescanso`) se usa en Editar rutina, armado del libre, "Prepará tu rutina" y rutinas del entrenador: una fila por serie (tipo C/F tocando el número · peso · reps · papelera) + "Agregar serie". La rutina guarda `detalle: SerieRutina[]`; `conFilas` mantiene sincronizados `series/reps/alFallo/peso` y `filasDeRutina` arma las filas de rutinas viejas. No crear otro editor distinto. Hay prueba a 360 px que falla si los controles se pisan.
- **Animaciones de ejercicios (v1.3.0):** fotos de free-exercise-db (dominio público) en `public/ejercicios/<id>-0.webp` y `-1.webp`, alternadas con CSS (`Animacion` en `src/screens/Miniatura.tsx`). El mapeo id propio → id de free-exercise-db se hizo a mano; ejercicios nuevos de la biblioteca necesitan sus fotos o muestran la sigla. Para GIFs reales: ExerciseDB/AscendAPI (pago, prohíbe guardarlos) o un paquete con licencia. No usar datasets con GIFs de Gymvisual sin licencia propia.
- **Vista de foco (v1.5.0, `src/screens/Foco.tsx`):** predeterminada al entrenar. Lo esencial debe entrar sin bajar la pantalla (hay prueba): serie, peso/reps, "Serie hecha", cronómetro y "Sigue". Botón "Ver todo" → lista; desde la lista, "Foco" en cada ejercicio vuelve al foco. Al marcar pasa sola a la siguiente serie pendiente.
- **Foco en celular (v1.6.2):** la columna mide lo que queda de pantalla (`visualViewport`); la animación es lo único que se achica y usa `object-contain` (se ve entera). Prueba a 412×690 exige serie hecha, cronómetro y Sigue 100 % visibles.
- **Primera vez con una rutina (v1.6.2):** si algún ejercicio no tiene historial, `iniciarDesdeRutina` pone `preparando` y se muestra "Prepará tu rutina" (peso y reps por serie) antes del reloj.
- **Entrenamiento libre (v1.6.0):** se arma primero (`borrador.preparando`), sin reloj; "Empezar entrenamiento" pone `inicio`. Cada tarjeta tiene ↑ ↓ 🗑 a la vista y cada serie su papelera.
- **Sobrecarga progresiva (`src/lib/sobrecarga.ts`):** doble progresión. Perfil → `sobrecarga {modo: auto|manual|apagada, superior, inferior}` (kg). Auto carga el peso nuevo al empezar la rutina; manual pregunta al empezar (hoja "Sobrecarga progresiva", una vez por entrenamiento), nunca durante la serie.
- **Regla de ancho:** las pruebas de pantallas fallan si algo es más ancho que la pantalla del celular.
- **Modo prueba:** la cuenta de ejemplo y el invitado ven la plantilla Full body hecha 8 semanas (`datosDePrueba`).
- **Profesionales (v1.7.0):** la app sigue sirviendo para usarla solo. El dueño (admin) aprueba en Perfil → Administrar profesionales; al aprobar se genera el código (`TIT-XXXX`). El entrenador invita con el código o el enlace `/?codigo=TIT-XXXX` (WhatsApp). El cliente acepta viendo los permisos. Rutinas asignadas: el cliente no las edita (ve "De tu entrenador"), pero sí ajusta peso/reps al entrenar. Estado del cliente: al día < 4 días, atención 4–7, inactivo > 7. Modo prueba: Marco es entrenador (`TIT-M4RC`) con Ana (`ana@ejemplo.com` / `titanus`), Bruno (inactivo) y Carla (nueva), y una solicitud pendiente de Diego. Para otra especialidad: agregar su tipo en `especialidades.ts`, su carpeta como `entrenador/` y cambiar `TIPO_APP`.
- **Ideas de Hevy (v1.10.0), siempre con la estética propia:** bienvenida `src/screens/Conocerte.tsx` (se muestra si `!perfil.conocido`; guarda `genero` → `figura`, `nacimiento`, `altura`, `objetivo`, `nivel` y el peso en `bodyLogs`; `/conocerte?editar=1` desde Perfil; las cuentas de ejemplo tienen `conocido: true`). Biblioteca con filtro de equipo, "Tus más usados" (por `exerciseStats`) y (i). Ficha de rutina `src/screens/VerRutina.tsx` en `/rutinas/:id/ver` con `leerSesionesDeRutina` (índice compuesto `workouts: rutinaId + inicio` en `firestore.indexes.json`). Serie hecha en verde (`.serie-hecha`) y chips Descanso/Nota.
- **Programas (v1.11.0):** catálogo en `src/lib/programas.ts` (semanas → sesiones → `EjercicioRutina`), pantallas en `src/screens/Programas.tsx` (`ListaProgramas` en Entreno, `ProgramaEnCurso` en Inicio, ficha `/programas/:id`). Uno activo a la vez en `perfil.programa {id, inicio, hechas[]}`; una sesión se entrena como rutina con id `prog:<programa>:sN-M` y al guardar el entrenamiento se marca en la misma escritura del perfil. Cada programa tiene `acceso: 'gratis' | 'pro'`: hoy todos gratis (decisión del dueño), la estructura queda lista para cobrar. Para agregar uno: sumarlo a `PROGRAMAS` con ejercicios de la biblioteca (hay prueba que lo verifica). **v1.15.0:** cada programa tiene `lugar` (`gimnasio` | `calistenia` | `casa`, ver `LUGARES`; la página los separa en secciones con filtro `filtro-lugar`, hay prueba de ≥2 por lugar) y `equipo` (texto). La ficha muestra la animación pequeña de cada ejercicio (`ejercicio-programa`). **Carátulas propias (v1.15.1):** `public/programas/<id>-h.webp` (hombre) y `<id>-m.webp` (mujer), 720×960 WebP calidad 76, y `portada: { h: true, m: true }` en el programa; `portadaDe(p, figura)` elige la de la figura, si falta usa la otra y si no hay ninguna, la estatua. Punto de recorte por archivo en `FOCO_PORTADA` (`Programas.tsx`): **siempre desde arriba (y 0 %)** para que no se corten las cabezas (decisión del dueño, v1.15.2); solo las flexiones bajan a 18 %. No se precargan con el service worker (`globIgnores: programas/**`): se guardan al verlas (`CacheFirst`, caché `caratulas`). Hay prueba de que los archivos existen. Faltan: abdomen-acero (h/m), calistenia-gladiador (h/m), casa-mancuernas-h, gluteos-gladiadora-h, calistenia-fundamentos-m.
- **Cabecera del entrenamiento (v1.11.1):** propia, no copiada de Hevy. Barra de arriba: minimizar (botón redondo), selector **Foco | Lista** (aria "Modo foco" / "Ver todo"), **el único reloj** (`reloj-entreno`) y Terminar, con filo dorado (`.barra-entreno`). Cabecera de la lista (v1.13.1): **una sola franja** `hero` (`metricas`) con anillo en romanos, "Entrenamiento en curso" + nombre editable y, a la derecha, Carga levantada · Series n/total · Ejercicios n/total separados por líneas finas (en celular las cifras van debajo). No volver al título suelto + caja aparte. No volver a poner un segundo reloj ni la palabra "Campaña".
- **Inicio y navegación (v1.12.0, decisión del dueño):** Inicio sin frase estoica y sin la grilla de accesos (repetía la barra de pestañas): saludo, avisos, programa en curso, Hoy + racha, Entrenamiento de hoy y Tu semana. Programas en su propia página `/programas` (`PaginaProgramas`), con el selector `NavEntreno` ("Mis entrenos | Programas") arriba de las dos; tarjetas de programa de alto fijo (hay prueba). Pantallas precargadas al iniciar (`precargar` en `App.tsx`), fundido cruzado con View Transitions al tocar pestañas (`navegarSuave` en `Marco.tsx`) y **esqueletos** en vez de "Cargando…" (`Cargando forma="pagina|lista|tarjeta|linea"`). No volver a poner textos de "Cargando" sueltos.
- **Entrenar en PC (v1.13.0):** la pantalla `/entrenar` usa hasta 1480px. `src/screens/OrdenEntreno.tsx` ("Orden de hoy", números romanos con hilo) va a la izquierda en Lista (≥1024px, fijo al bajar; tocar lleva a la tarjeta) y en Foco (≥1440px, tres columnas: orden · animación 3:2 · controles). En Lista las tarjetas van **en una sola columna** con su número romano (`numero-ejercicio`); en PC cada tarjeta divide datos (izq.) y tabla de series (der.). No volver a la grilla de dos columnas de tarjetas (no se entiende el orden).
- **Regla de Conocerte:** se mueve con eventos de puntero (dedo y mouse), rueda y flechas (`role="slider"`, `data-testid="regla"`); no usar scroll nativo (en PC no se podía arrastrar).
- **Contraseña:** botón ojito "Mostrar/Ocultar contraseña" en Acceso; en pruebas usar `getByLabel('Contraseña', { exact: true })`.
- **Familia estoica (v1.14.0, decisión del dueño):** TITANUS y Stoica (https://stoica-app.web.app) son una línea de apps que deben parecerse **sin perder** el negro y oro, la estructura ni las estatuas. Piezas comunes en `src/ui/familia.tsx`: `Laurel` (mismo dibujo que Stoica; `fondo` = marca de agua `.laurel-fondo`), `Grupo` (título de sección "I · TEXTO ——", clase `.grupo`) y `Ficha` (chip `.ficha`). `Seccion` de `piezas.tsx` usa `Grupo`. Inicio arranca con el **"Panel del día"** (`.panel-dia`, `data-testid="panel-dia"`): estatua-avatar, saludo según la hora (Buen día / Buenas tardes / Buenas noches), rango y fichas de fecha, racha y entrenamientos. "Tu semana" y "Entrenamiento de hoy" miden lo mismo en PC (212px, `tarjeta-hoy` / `tu-semana`, hay prueba: tarjetas lado a lado siempre del mismo alto). "Tu semana" igual que Stoica (día corto, número Playfair, hoy subrayado en oro, "n/7 días entrenados" con barra). Barra lateral PC: persona al pie (`persona-lateral`). Las pruebas buscan el saludo con `/(Buen día|Buenas tardes|Buenas noches), Nombre/`.
- **Ícono y nombre (v1.17.0, reemplaza lo de v1.16):** ícono del dueño `icono-mancuerna.svg`: el laurel de la familia (4 hojas por lado + 2 interiores) con una **mancuerna marfil** al centro sobre `#14120E`; se genera con `scripts/iconos.mjs`. Dentro de la app, la marca usa el componente `Emblema` (`familia.tsx`, el mismo dibujo) + "StoaGym" en Cinzel, en lugar de la corona. Nombre visible **StoaGym** en todos lados. Códigos de entrenador nuevos `STG-XXXX` (los `TIT-` viejos siguen valiendo). Antes (v1.16):  ícono **idéntico en proporciones al de Stoica** (cuadrado negro `#14120E` entero, sin esquinas: el teléfono pone la forma; laurel dorado `#C9A66B` abierto con 4 hojas por lado + 2 hojitas interiores; letra "T" Playfair marfil `#F3EDDF` de 100px al centro). Se genera con `PW_CHROME=/usr/bin/google-chrome node scripts/iconos.mjs` → `public/icono.svg`, `icono-192/512.png` y `android/.../mipmap-*/ic_launcher(_round).png`. Nombre visible **"Titanus"** (manifest `name/short_name`, `appName` de Capacitor, `strings.xml`, `<title>`); la marca dentro de la app sigue en Cinzel. Cambiar el ícono de la APK obliga a reinstalarla.
- **Pantalla de inicio (v1.17.1, decisión del dueño):** al abrir, fondo `#14120E` con el emblema solo (sin el cuadrado), igual que su app de nutrición. Android: `Theme.SplashScreen` con `windowSplashScreenBackground` + `windowSplashScreenAnimatedIcon=@drawable/splash_icono` (drawable-nodpi) y `splash.png` para Android viejo. Web/APK: `#inicio` dentro de `index.html` (SVG en línea entre `<!--splash-->`), que `quitarInicio()` en `main.tsx` desvanece tras ≥0,8 s. Todo lo genera `scripts/iconos.mjs`. Manifest `theme_color/background_color` = `#14120E`. Hay prueba (`00-pantalla-inicio`).
- Rangos por entrenamientos: Recluta 0, Legionario 10, Decurión 30, Centurión 60, Tribuno 120, Legado 200, César 365. Nivel = total/5 + 1.

## Reglas de trabajo

- Commits en español: `vX.Y.Z - qué cambia`. **Nunca** agregar líneas `Co-Authored-By` ni `Claude-Session`.
- Al cambiar algo visible, subir la versión en `package.json` y agregar la entrada en `src/lib/novedades.ts`.
- Después del push, seguir el run de "Publicar" y avisar: qué cambió, el commit, el estado del run y qué probar.
- Capturas y datos de prueba siempre inventados.

---

# Pedido original (completo)

Quiero crear una app de gimnasio llamada **TITANUS**, completa y publicada en producción. Trabajá de forma autónoma por fases, con pruebas automáticas, y publicá solo cuando todas las pruebas pasen.

## Cómo trabajar conmigo

- No programo. Respondeme en español con voseo paraguayo, claro y directo, y explicá cada término técnico en una frase.
- Primero el resultado y después el detalle. Usá tablas cuando compares opciones.
- Cuando tenga que hacer algo yo, dame pasos así: "📍 Estás en: …" y después "## Paso N" con sub-pasos numerados y enlaces directos.
- **Seguridad, sin excepciones:**
  - Nunca escribas ni me pidas contraseñas, claves, tokens ni credenciales.
  - No crees claves de cuentas de servicio, no toques permisos (IAM) y no ingreses datos de pago.
  - Cada vez que haga falta algo de eso, dame los pasos y lo hago yo, por ejemplo cargar un secreto en GitHub.
  - Nunca subas datos personales reales a GitHub.
- En cada funcionalidad decime el costo aproximado en Firebase según la cantidad de usuarios (100, 1.000 y 10.000). Priorizá quedarse en el plan gratis.
- Si algo es ambiguo y cuesta rehacerlo, preguntame antes. Si es rápido de cambiar, decidí vos y avisame.

## Estilo visual (obligatorio)

Usá exactamente el estilo de la guía de Stoica (PDF "Stoica-guia-de-estilo.pdf", ya volcado en `src/index.css`):

- **Colores y fondo:**
  - Modo claro: fondo piedra cálida `#ECE6DB`, tarjetas `#FAF7F1` con radio 16px, borde fino `#E0D7C5` y sombra suave.
  - Un solo color de acción, bronce `#7E5D22`.
  - Modo oscuro: fondo `#14120E` y bronce `#C9A66B`.
  - Verde `#3F6E38` para "hecho" y rojo ladrillo `#9C3F2E` para "no hecho".
- **Letras:** títulos y números en **Playfair Display**, textos en **Inter**, etiquetas pequeñas en MAYÚSCULAS espaciadas.
- **Botones e íconos:** botón principal tipo píldora de 52px en bronce, con texto en mayúsculas. Botones secundarios solo con borde. Íconos de línea fina con puntas redondeadas.
- **Pantallas:**
  - Celular primero, con contenido de máximo 480px de ancho y barra de pestañas abajo.
  - En PC, barra lateral oscura de 248px y contenido centrado.
  - Modos claro, oscuro y sistema.
- **Ritmo de cada pantalla:** etiqueta pequeña arriba, título grande y una línea de explicación.
- **Detalles:**
  - Rachas y récords en números grandes, a veces romanos.
  - Frases estoicas de disciplina y esfuerzo (Séneca, Marco Aurelio, Epicteto) en el inicio.
  - Celebraciones breves y elegantes (medalla, laurel).
- **Variables de color:** copialas de la página 12 del PDF.

## Tecnología

- Vite + React 18 + TypeScript + Tailwind.
- PWA instalable que funcione sin conexión. Usá `registerType: 'autoUpdate'`, y que el service worker active la versión nueva solo (`skipWaiting` + `clientsClaim`) y recargue la página al cambiar, para que las actualizaciones lleguen siempre.
- Firebase:
  - Auth con correo y con Google.
  - Firestore con reglas estrictas, cada usuario solo lee y escribe lo suyo.
  - Cloud Functions v2 en Node 20, solo si hacen falta, por ejemplo para notificaciones.
  - Hosting para publicar.
  - Cloud Messaging para recordatorios.
- **Modo prueba en memoria:** que la app funcione completa sin Firebase, con una cuenta de ejemplo y datos inventados, para probar y para las pruebas automáticas.
- APK de Android con Capacitor, armada por GitHub Actions.
- Pruebas:
  - vitest para la lógica.
  - Pruebas de las reglas de Firestore con el emulador.
  - Playwright para las pantallas, en celular y en PC. Que saque capturas de cada pantalla.
- Número de versión con "novedades" en Perfil → Ajustes, visible solo para el admin. Tiene que mostrar versión, fecha de armado y commit, para confirmar que llegó la última versión.

## Qué tiene que hacer la app

**Fase 1 (lo esencial):**

1. Acceso: registro, ingreso, olvidé mi contraseña y Google.
2. **Hoy:**
   - Saludo y frase del día.
   - El entrenamiento que toca hoy.
   - Racha de semanas entrenadas.
   - Calendario de la semana.
3. **Rutinas:**
   - Crear rutinas por día (por ejemplo "Pecho y tríceps").
   - Agregar ejercicios desde una biblioteca con unos 60 ejercicios comunes en español, agrupados por músculo, o crear ejercicios propios.
4. **Entrenar:**
   - Registrar series (peso, repeticiones y sensación).
   - Que se vea lo que hice la última vez.
   - Temporizador de descanso entre series, con sonido suave y vibración.
   - Botón "terminar entrenamiento" con resumen.
5. **Progreso:**
   - Historial de entrenamientos.
   - Gráfico por ejercicio (peso máximo y volumen).
   - Récords personales con celebración.
   - Peso corporal y medidas.
6. **Perfil:**
   - Nombre y apariencia (claro, oscuro, sistema).
   - Unidades (kg o lb).
   - Recordatorios.
   - Exportar mis datos.
   - Borrar mi cuenta.

**Fase 2 (motivación):**

7. Diario después de entrenar: cómo me sentí y qué mejorar.
8. Logros y "salón de trofeos" con medallas por constancia y récords.
9. Grupos: crear un grupo con código de invitación, ver la racha de los demás y hacer desafíos (por ejemplo "12 entrenamientos en 30 días").
10. Recordatorio de entrenar, y aviso si lleva varios días sin entrenar.

**Fase 3 (administración):**

11. Panel de admin, solo para mi cuenta, con usuarios activos, entrenamientos por día y retención. Datos agrupados, sin ver lo personal de nadie.

Al terminar cada fase:
- corré todas las pruebas;
- mostrame capturas;
- publicá;
- decime qué cambió y cuánto puede costar.

## Publicación automática

- Repositorio en GitHub `mjgo139/titanus`, rama `main`.
- Workflow de GitHub Actions "Publicar" que en cada push a `main` corra, en este orden:
  1. pruebas web;
  2. pruebas de reglas con el emulador;
  3. armado de la APK;
  4. deploy a Firebase (hosting, reglas, índices y functions).
- **Si una prueba falla, no se publica.**
- Para Firebase dame los pasos para que yo:
  1. cree el proyecto `titanus-10398` en https://console.firebase.google.com;
  2. active Auth (correo y Google), Firestore y Hosting;
  3. genere la credencial para GitHub Actions y la cargue como secreto del repositorio (yo, no vos);
  4. pase al plan Blaze solo si las Functions lo exigen, con una alerta de presupuesto de USD 1.
- Dejá un archivo `CLAUDE.md` en el repositorio con todo lo de este mensaje, para que cualquier sesión nueva sepa cómo trabajar.


