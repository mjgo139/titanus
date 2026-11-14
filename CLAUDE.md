# TITANUS · instrucciones para Claude

Este archivo resume cómo trabajar en este repositorio. Leelo entero antes de cambiar algo.

## Estado actual

| Dato | Valor |
|---|---|
| Fase | 1 (lo esencial) publicada como v1.0.0 |
| Proyecto Firebase | `titanus-10398` (plan Spark, gratis) |
| Firestore | modo nativo, edición Standard, región `southamerica-east1` (São Paulo) |
| Auth | correo/contraseña y Google habilitados |
| Web | https://titanus-10398.web.app |
| APK | se arma en cada push y se publica en el Release `apk-ultima`: https://github.com/mjgo139/titanus/releases/tag/apk-ultima (el plan Spark no permite `.apk` en Hosting) |
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
- `src/screens/` pantallas. `src/ui/` piezas comunes (encabezado, hoja que sube, celebración, gráfico).
- Firestore: `users/{uid}` + subcolecciones `routines`, `customExercises`, `workouts`, `exerciseStats`, `bodyLogs`. Reglas en `firestore.rules`.
- Para ahorrar lecturas: el perfil guarda `resumen` (días entrenados) y `exerciseStats` guarda la última vez y los puntos del gráfico. El entrenamiento en curso se guarda en el teléfono y se sube una sola vez al terminar.

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


