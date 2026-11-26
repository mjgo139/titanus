import { expect, test, type Page } from '@playwright/test';

async function captura(page: Page, nombre: string) {
  await expect(page.getByText('Cargando…')).toHaveCount(0);
  await expect(page.locator('#inicio')).toHaveCount(0, { timeout: 8000 }); // la pantalla de inicio ya se fue
  // Nada puede ser más ancho que la pantalla (si no, el celular achica toda la página)
  const ancho = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth), `${nombre}: la página es más ancha que la pantalla`).toBeLessThanOrEqual(ancho);
  await page.screenshot({ path: `capturas/${test.info().project.name}/${nombre}.png`, fullPage: true, animations: 'disabled' });
}

/** En modo prueba los datos viven en memoria: navegamos con los botones, sin recargar la página */
const ir = (page: Page, nombre: 'Inicio' | 'Entreno' | 'Progreso' | 'Perfil') =>
  page.getByRole('link', { name: nombre, exact: true }).filter({ visible: true }).click();

/** Si aparece la pregunta de sobrecarga al empezar, seguir sin cambios */
async function sinSobrecarga(page: Page) {
  await page.locator('[data-testid=vista-foco], [data-testid=hoja-sobrecarga]').first().waitFor({ timeout: 4000 }).catch(() => undefined);
  const b = page.getByRole('button', { name: 'Empezar sin cambios' });
  if (await b.isVisible().catch(() => false)) await b.click();
}

async function entrar(page: Page, tema: 'light' | 'dark' = 'dark') {
  await page.emulateMedia({ colorScheme: tema });
  await page.goto('/');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /(Buen día|Buenas tardes|Buenas noches), Marco/ })).toBeVisible();
}

test('portada y acceso: ingresar, recuperar y registrar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('ENTRENAMIENTO · DISCIPLINA · FUERZA')).toBeVisible();
  await captura(page, '01-portada');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
  await captura(page, '02-iniciar-sesion');
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('Si existe una cuenta');
  await page.getByRole('button', { name: '¿Ya tenés cuenta? Iniciá sesión' }).click();
  await page.getByLabel('Contraseña', { exact: true }).fill('mala');
  // El ojito muestra y oculta la contraseña
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click();
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('no coinciden');
  await page.getByRole('button', { name: '¿No tenés cuenta? Creá una' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Correo').fill('lucia@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('secreta1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  // Bienvenida "Conocerte": seis preguntas
  await expect(page.getByTestId('conocerte')).toBeVisible();
  await page.getByRole('radio', { name: /Mujer/ }).click();
  await captura(page, '02b-conocerte-genero');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Año').selectOption('1999');
  await expect(page.getByText(/Tenés \d+ años/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Peso corporal', { exact: true }).fill('64.5');
  await page.getByRole('button', { name: 'Más Peso corporal' }).click();
  await expect(page.getByLabel('Peso corporal', { exact: true })).toHaveValue('64.6');
  // La regla se arrastra con el mouse (PC): 50 px a la izquierda = +0,5 kg
  const regla = (await page.getByTestId('regla').boundingBox())!;
  await page.mouse.move(regla.x + regla.width / 2, regla.y + regla.height / 2);
  await page.mouse.down();
  await page.mouse.move(regla.x + regla.width / 2 - 25, regla.y + regla.height / 2, { steps: 4 });
  await page.mouse.move(regla.x + regla.width / 2 - 50, regla.y + regla.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByLabel('Peso corporal', { exact: true })).toHaveValue('65.1');
  // y con las flechas del teclado
  await page.getByTestId('regla').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByLabel('Peso corporal', { exact: true })).toHaveValue('65');
  await captura(page, '02c-conocerte-peso');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Altura', { exact: true }).fill('168');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /Ganar fuerza/ }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /Principiante/ }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Recomendado para vos')).toBeVisible();
  await captura(page, '02d-conocerte-plan');
  await page.getByRole('button', { name: 'Entrar a StoaGym' }).click();
  await expect(page.getByRole('heading', { name: /(Buen día|Buenas tardes|Buenas noches), Lucía/ })).toBeVisible();
  // Eligió mujer: ve las estatuas de legionaria y sus datos quedan en Perfil
  await expect(page.locator('img[src*="avatar-f"]:visible').first()).toBeVisible();
  await expect(page.getByTestId('frase-del-dia')).toBeVisible();
  await captura(page, '03-inicio-vacio');
  await ir(page, 'Perfil');
  await expect(page.getByTestId('datos-personales')).toContainText('168 cm');
  await expect(page.getByTestId('datos-personales')).toContainText('Ganar fuerza');
});

test('modo prueba: la sesión sobrevive a una recarga', async ({ page }) => {
  await entrar(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: /(Buen día|Buenas tardes|Buenas noches), Marco/ })).toBeVisible();
});

test('invitado: entra sin cuenta y después crea su cuenta sin perder nada', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar como invitado' }).click();
  await expect(page.getByText('Estás como invitado.')).toBeVisible();
  await ir(page, 'Perfil');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  const hoja = page.getByRole('dialog');
  await hoja.getByLabel('Nombre').fill('Tito');
  await hoja.getByLabel('Correo').fill('tito@ejemplo.com');
  await hoja.getByLabel('Contraseña', { exact: true }).fill('secreta1');
  await page.getByRole('dialog').getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText('Modo invitado')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Tito' })).toBeVisible();
});

test('inicio: rango, racha, entrenamiento de hoy y semana (sin frase ni accesos)', async ({ page }) => {
  await entrar(page);
  await expect(page.getByTestId('frase-del-dia')).toContainText('—');
  await expect(page.getByTestId('racha')).not.toHaveText('—');
  await expect(page.getByRole('heading', { name: 'Entrenamiento de hoy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu semana' })).toBeVisible();
  await expect(page.locator('blockquote')).toHaveCount(0);
  await expect(page.getByText('Tus mejores marcas')).toHaveCount(0);
  if (test.info().project.name === 'pc') {
    // Las dos tarjetas de Inicio miden lo mismo
    await expect.poll(async () => {
      const a = (await page.getByTestId('tarjeta-hoy').boundingBox())!;
      const b = (await page.getByTestId('tu-semana').boundingBox())!;
      return Math.round(Math.abs(a.height - b.height) + Math.abs(a.y - b.y));
    }).toBeLessThan(3);
  }
  await captura(page, '04-inicio');
  await entrar(page, 'light');
  await page.evaluate(() => localStorage.setItem('titanus-tema', 'claro'));
  await ir(page, 'Perfil');
  await page.getByRole('radio', { name: 'Mármol' }).click();
  await ir(page, 'Inicio');
  await captura(page, '05-inicio-marmol');
});

test('entreno: crear rutina con biblioteca y ejercicio propio', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await expect(page.getByRole('heading', { name: 'Entrenamiento', exact: true })).toBeVisible();
  await captura(page, '06-entreno');
  await page.getByRole('link', { name: /Nueva/ }).click();
  await page.getByPlaceholder('Ej.: Pecho y tríceps').fill('Hombros y abdomen');
  await page.getByRole('button', { name: 'Dom' }).click();
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click();
  await expect(page.getByText('Tus más usados')).toBeVisible();
  await page.getByRole('button', { name: 'Hombros', exact: true }).click();
  await page.getByRole('button', { name: 'Barra', exact: true }).click();
  await captura(page, '07-biblioteca');
  await page.getByRole('button', { name: 'Información de Press militar' }).click();
  await expect(page.getByTestId('info-ejercicio')).toContainText('Sesiones');
  await captura(page, '07b-info-ejercicio');
  await page.getByTestId('info-ejercicio').getByRole('button', { name: 'Agregar ejercicio' }).click();
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click();
  await page.getByRole('button', { name: 'Crear ejercicio propio' }).click();
  await page.getByPlaceholder('Ej.: Remo en T').fill('Plancha con peso');
  await page.getByRole('button', { name: 'Abdomen', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar ejercicio' }).click();
  await expect(page.getByText('Plancha con peso')).toBeVisible();
  await captura(page, '08-editar-rutina');
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.getByRole('heading', { name: 'Hombros y abdomen' })).toBeVisible();
  // primera vez: antes del reloj se cargan peso y reps de cada serie
  await page.getByRole('listitem').filter({ hasText: 'Hombros y abdomen' }).getByRole('button', { name: /Empezar rutina/ }).click();
  await expect(page.getByTestId('armado')).toBeVisible();
  await expect(page.getByText('Primera vez con esta rutina')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Terminar', exact: true })).toHaveCount(0);
  await page.getByLabel('Peso serie 1 de Plancha con peso').fill('10');
  await captura(page, '08b-preparar-rutina');
  await page.getByRole('button', { name: 'Empezar entrenamiento', exact: true }).click();
  await expect(page.getByTestId('vista-foco')).toBeVisible();
});

test('entrenar estilo Hevy: anterior, tipos de serie, descanso, récord y resumen', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('button', { name: 'Empezar rutina' }).first().click();
  await sinSobrecarga(page);
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByTestId('metricas')).toContainText('Carga levantada');
  await expect(page.getByTestId('reloj-entreno')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Copiar serie anterior 1/ }).first()).toContainText('kg ×');
  await expect(page.getByTestId('ultima-vez').first()).toContainText('Última vez');
  for (const j of [1, 2, 3, 4]) await expect(page.getByRole('button', { name: `Copiar serie anterior ${j}` }).first()).not.toHaveText('—');
  // Récord: subir el peso de la segunda serie (la primera es de calentamiento)
  const peso = page.getByLabel('Peso serie 2').first();
  await peso.fill(String(Number(await peso.inputValue()) + 10));
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).first().click();
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar serie 2 como hecha' }).first().click();
  await captura(page, '09-entrenar');
  await page.getByRole('button', { name: 'Saltar' }).click();
  await page.getByRole('button', { name: 'Nota de Sentadilla' }).click();
  await page.getByLabel('Notas de Sentadilla').fill('Buena profundidad');
  await page.getByRole('button', { name: 'Tipo de la serie 3' }).first().click();
  await page.getByRole('button', { name: 'Al fallo' }).click();
  await page.getByRole('button', { name: 'Agregar serie' }).first().click();
  expect(await page.getByTestId('serie').count()).toBeGreaterThan(4);
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await captura(page, '10-guardar');
  await page.getByRole('button', { name: 'Guardar y terminar' }).click();
  await expect(page.getByText('Récord personal')).toBeVisible();
  await captura(page, '11-celebracion');
  await page.getByText('Récord personal').click();
  await expect(page.getByRole('heading', { name: 'Récords nuevos' })).toBeVisible();
  await captura(page, '12-resumen');
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('heading', { name: /(Buen día|Buenas tardes|Buenas noches), Marco/ })).toBeVisible();
});

test('entrenamiento libre: minimizar, volver y guardar como rutina', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('button', { name: 'Empezar entrenamiento libre' }).click();
  // primero se arma: la biblioteca se abre sola y el reloj no corre
  await page.getByLabel('Buscar ejercicio').fill('dominadas');
  await page.getByRole('button', { name: /Dominadas/ }).first().click();
  await expect(page.getByTestId('armado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Terminar', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click();
  await page.getByLabel('Buscar ejercicio').fill('press de banca');
  await page.getByRole('button', { name: /Press de banca/ }).first().click();
  await page.getByRole('button', { name: /Más series de Press de banca/ }).click();
  await page.getByLabel('Peso serie 1 de Press de banca').fill('42.5');
  await page.getByLabel('Repeticiones serie 1 de Press de banca').fill('8');
  await page.getByRole('button', { name: /Subir Press de banca/ }).click();
  await expect(page.getByTestId('ejercicio-armado').first()).toContainText('Press de banca');
  await captura(page, '12b-armar-libre');
  await page.getByRole('button', { name: 'Empezar entrenamiento', exact: true }).click();
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByTestId('ejercicio')).toHaveCount(2);
  await expect(page.getByLabel('Peso serie 1').first()).toHaveValue('42.5');
  // borrar una serie y quitar un ejercicio, a la vista
  const antes = await page.getByTestId('serie').count();
  await page.getByRole('button', { name: /Eliminar serie 1 de Press de banca/ }).click();
  await expect(page.getByTestId('serie')).toHaveCount(antes - 1);
  await page.getByRole('button', { name: /Quitar Press de banca/ }).click();
  await page.getByRole('button', { name: 'Sí, quitar' }).click();
  await expect(page.getByTestId('ejercicio')).toHaveCount(1);
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).click();
  await page.getByRole('button', { name: 'Minimizar' }).click();
  await expect(page.getByTestId('en-curso')).toBeVisible();
  await captura(page, '13-en-curso');
  await page.getByTestId('en-curso').click();
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar y terminar' }).click();
  await page.getByRole('button', { name: 'Guardar como rutina' }).click();
  await expect(page.getByRole('status')).toContainText('Rutina guardada');
  await page.getByRole('button', { name: 'Volver al inicio' }).click();
  await ir(page, 'Entreno');
  await expect(page.getByRole('heading', { name: /Entrenamiento de la/ })).toBeVisible();
});

test('ejercicio: ver la animación de cómo se hace', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Progreso');
  await page.getByRole('radio', { name: 'Récords' }).click();
  await page.getByRole('link', { name: /Sentadilla/ }).first().click();
  await expect(page.getByRole('img', { name: 'Cómo se hace: Sentadilla' })).toBeVisible();
  await captura(page, '25-ejercicio-animacion');
});

test('progreso: resumen, calendario, historial, repetir, récords y medidas', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Progreso');
  await expect(page.getByRole('heading', { name: 'Tu evolución' })).toBeVisible();
  await expect(page.getByTestId('totales-periodo')).toContainText('Promedio semanal');
  await expect(page.getByTestId('detalle-semana')).toContainText('Semana del');
  await expect(page.getByLabel('Calendario de entrenamientos')).toBeVisible();
  await captura(page, '14-progreso');
  await page.getByRole('radio', { name: 'Historial' }).click();
  await captura(page, '15-historial');
  await page.getByTestId('entreno-historial').first().getByRole('button').click();
  await captura(page, '16-detalle-entreno');
  await page.getByRole('button', { name: 'Repetir entrenamiento' }).click();
  await expect(page.getByTestId('vista-foco')).toBeVisible();
  await page.getByRole('button', { name: 'Descartar entrenamiento' }).click();
  await page.getByRole('button', { name: 'Sí, descartar' }).click();
  await ir(page, 'Progreso');
  await page.getByRole('radio', { name: 'Récords' }).click();
  await captura(page, '17-records');
  await page.getByRole('link', { name: /Press de banca/ }).click();
  await page.getByRole('radio', { name: '1RM' }).click();
  await expect(page.getByRole('figure', { name: /1RM estimado/ })).toBeVisible();
  await captura(page, '18-ejercicio');
  await ir(page, 'Progreso');
  await page.getByRole('radio', { name: 'Medidas' }).click();
  await page.getByRole('button', { name: 'Registrar medidas de hoy' }).click();
  await page.getByLabel(/Peso \(kg\)/).fill('79,5');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('79,5 kg').first()).toBeVisible();
  await captura(page, '19-medidas');
});

test('perfil: rango, apariencia, unidades, versión de admin y salir', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Perfil');
  await expect(page.getByTestId('completados')).not.toHaveText('0');
  await page.getByRole('radio', { name: 'Automática' }).click();
  await expect(page.getByText('la rutina ya arranca con más peso')).toBeVisible();
  await page.getByRole('radio', { name: 'Libras (lb)' }).click();
  // Las estatuas salen del género elegido al empezar; ya no se eligen en Perfil
  await expect(page.getByRole('radio', { name: 'Legionaria' })).toHaveCount(0);
  await expect(page.getByTestId('version')).toContainText('commit');
  await captura(page, '20-perfil');
  await page.getByRole('radio', { name: 'Mármol' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await captura(page, '21-perfil-marmol');
  await page.getByTestId('version').click();
  await expect(page.getByText('Hevy', { exact: false }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Borrar mi cuenta' }).click();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Continuar como invitado' })).toBeVisible();
});

test('plantilla Full body principiante: ver, cargar y entrenar el día A', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('button', { name: 'Ver y cargar' }).first().click();
  await expect(page.getByRole('dialog').getByText('Remo Pendlay')).toBeVisible();
  await captura(page, '22-plantilla');
  await page.getByRole('button', { name: 'Cargar las 3 rutinas' }).click();
  await expect(page.getByRole('status')).toContainText('3 rutinas cargadas');
  await expect(page.getByRole('heading', { name: 'A · Full body' })).toHaveCount(2);
  await captura(page, '23-rutinas-cargadas');
  await page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'A · Full body' }) }).last().getByRole('button', { name: 'Empezar rutina' }).click();
  await sinSobrecarga(page);
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByTestId('objetivo').first()).toContainText('3×6 + 1 al fallo');
  await expect(page.getByRole('button', { name: 'Tipo de la serie 4' }).first()).toHaveText('F');
  await captura(page, '24-entrenar-full-body');
});

test('vista de foco: sobrecarga al empezar, serie, cronómetro grande, lo que sigue y ver todo', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'A · Full body' }) }).getByRole('button', { name: 'Empezar rutina' }).click();
  await expect(page.getByTestId('hoja-sobrecarga')).toContainText('Sentadilla');
  await expect(page.getByTestId('sobrecarga-valor-sentadilla')).toContainText('80');
  // Se puede ajustar cuánto subir: +1,25 kg más en sentadilla y −1,25 en press de banca
  await page.getByRole('button', { name: 'Subir más Sentadilla' }).click();
  await expect(page.getByTestId('sobrecarga-valor-sentadilla')).toContainText('81,25');
  await page.getByRole('button', { name: 'Bajar Press de banca' }).click();
  await expect(page.getByTestId('sobrecarga-valor-press-banca')).toContainText('53,75');
  await captura(page, '26-sobrecarga-al-empezar');
  await page.getByRole('button', { name: 'Aplicar y empezar' }).click();
  await expect(page.getByTestId('vista-foco')).toBeVisible();
  await expect(page.getByTestId('posicion')).toHaveText('Serie 1 de 4');
  await expect(page.getByLabel('Peso', { exact: true })).toHaveValue('81.25');
  await expect(page.getByTestId('a-continuacion')).toContainText('Serie 2');
  // Lo esencial entra COMPLETO sin bajar, también en un celular bajo (barra del navegador incluida)
  if (test.info().project.name === 'celular') await page.setViewportSize({ width: 412, height: 690 });
  await expect(page.getByRole('button', { name: 'Serie hecha' })).toBeInViewport({ ratio: 1 });
  await expect(page.getByTestId('cronometro')).toBeInViewport({ ratio: 1 });
  await expect(page.getByTestId('a-continuacion')).toBeInViewport({ ratio: 1 });
  if (test.info().project.name === 'celular') {
    const caja = await page.getByTestId('animacion-foco').boundingBox();
    expect(caja!.height).toBeGreaterThan(110);
  }
  if (test.info().project.name === 'pc') {
    // PC grande (1920 px): tres columnas, con el orden de hoy a la vista
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByTestId('orden-entreno')).toBeVisible();
    await expect(page.getByTestId('orden-entreno').locator('[aria-current="step"]')).toContainText('Sentadilla');
  }
  await captura(page, '27-foco');
  await page.getByRole('button', { name: 'Serie hecha' }).click();
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible();
  await expect(page.getByTestId('posicion')).toHaveText('Serie 2 de 4');
  await captura(page, '28-foco-descanso');
  for (let k = 0; k < 3; k++) await page.getByRole('button', { name: 'Serie hecha' }).click();
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' }).first()).toBeVisible();
  // Cada ejercicio lleva su número y van uno debajo del otro, en orden
  await expect(page.getByTestId('numero-ejercicio').nth(0)).toHaveText('I');
  await expect(page.getByTestId('numero-ejercicio').nth(1)).toHaveText('II');
  const t1 = (await page.getByTestId('ejercicio').nth(0).boundingBox())!;
  const t2 = (await page.getByTestId('ejercicio').nth(1).boundingBox())!;
  expect(t2.y).toBeGreaterThan(t1.y + t1.height - 1);
  if (test.info().project.name === 'pc') {
    await expect(page.getByTestId('orden-entreno')).toBeVisible();
    await expect(page.getByTestId('orden-entreno').locator('[aria-current="step"]')).toContainText('Press de banca');
  }
  await captura(page, '29-ver-todo');
  await page.getByRole('button', { name: 'Entrenar Peso muerto en modo foco' }).click();
  await expect(page.getByRole('heading', { name: 'Peso muerto' })).toBeVisible();
});

test('editar rutina en un celular angosto: el mismo editor por serie, sin nada superpuesto', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular');
  await page.setViewportSize({ width: 360, height: 760 });
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('link', { name: /Editar A · Full body/ }).click();
  const tarjeta = page.getByTestId('ejercicio-armado').first();
  await expect(tarjeta.getByLabel('Peso serie 1 de Sentadilla')).toBeVisible();
  // Ningún control se pisa con otro
  const cajas = await tarjeta.locator('button, input').evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().toJSON()));
  expect(cajas.length).toBeGreaterThanOrEqual(10);
  for (let a = 0; a < cajas.length; a++) for (let b = a + 1; b < cajas.length; b++) {
    const x = cajas[a], y = cajas[b];
    const pisa = x.left < y.right - 1 && y.left < x.right - 1 && x.top < y.bottom - 1 && y.top < x.bottom - 1;
    expect(pisa, `controles ${a} y ${b} superpuestos`).toBe(false);
  }
  // Peso y reps por serie, agregar una serie y marcar una de calentamiento
  await tarjeta.getByLabel('Peso serie 1 de Sentadilla').fill('62.5');
  await tarjeta.getByLabel('Repeticiones serie 2 de Sentadilla').fill('8');
  await tarjeta.getByRole('button', { name: 'Más series de Sentadilla' }).click();
  await tarjeta.getByRole('button', { name: /Tipo de la serie 1 de Sentadilla/ }).click();
  await expect(tarjeta.getByRole('button', { name: /Tipo de la serie 1 de Sentadilla: calentamiento/ })).toBeVisible();
  await captura(page, '08c-editar-rutina-angosto');
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await page.getByRole('link', { name: /Editar A · Full body/ }).click();
  const otra = page.getByTestId('ejercicio-armado').first();
  await expect(otra.getByLabel('Peso serie 1 de Sentadilla')).toHaveValue('62.5');
  await expect(otra.getByLabel('Repeticiones serie 2 de Sentadilla')).toHaveValue('8');
  await expect(otra.getByTestId('serie-armado')).toHaveCount(5);
});

test('ficha de rutina: gráfico por sesión, ejercicios serie por serie y comenzar', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('link', { name: 'Abrir A · Full body' }).click();
  await expect(page.getByRole('heading', { name: 'A · Full body' })).toBeVisible();
  await expect(page.getByTestId('grafico-rutina')).toContainText('Volumen por sesión');
  await expect(page.getByTestId('ejercicio-rutina')).toHaveCount(7);
  await captura(page, '08d-ficha-rutina');
  await page.getByRole('radio', { name: 'Duración' }).click();
  await expect(page.getByTestId('grafico-rutina')).toContainText('Duración por sesión');
  await page.getByRole('button', { name: 'Comenzar rutina' }).click();
  await sinSobrecarga(page);
  await expect(page.getByRole('button', { name: 'Terminar', exact: true })).toBeVisible();
});

test('programas: tarjetas, empezar uno, hacer una sesión y ver el avance', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  // Los programas no están en "Mis entrenos": tienen su propia página
  await expect(page.getByTestId('programa')).toHaveCount(0);
  await page.getByRole('link', { name: 'Programas' }).first().click();
  await expect(page.getByTestId('programa')).toHaveCount(10);
  await expect(page.getByTestId('acceso-programa').first()).toHaveText('Gratis');
  // Separados por lugar: Gimnasio, Calistenia y En casa
  await expect(page.getByTestId('seccion-gimnasio')).toBeVisible();
  await expect(page.getByTestId('seccion-calistenia').getByTestId('programa')).toHaveCount(3);
  await expect(page.getByTestId('seccion-casa').getByTestId('programa')).toHaveCount(2);
  await page.getByTestId('filtro-lugar').getByRole('button', { name: /En casa/ }).click();
  await expect(page.getByTestId('programa')).toHaveCount(2);
  await expect(page.getByTestId('seccion-gimnasio')).toHaveCount(0);
  await captura(page, '06b2-programas-en-casa');
  await page.getByTestId('filtro-lugar').getByRole('button', { name: 'Todos' }).click();
  // Todas las tarjetas del mismo tamaño
  const altos = await page.getByTestId('programa').evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().height)));
  expect(new Set(altos).size).toBe(1);
  await captura(page, '06b-programas');
  await page.getByTestId('programa').filter({ has: page.getByRole('heading', { name: 'Más dominadas', exact: true }) }).click();
  await expect(page.getByRole('heading', { name: 'Más dominadas' })).toBeVisible();
  await expect(page.getByTestId('semana-programa')).toHaveCount(4);
  // Cada ejercicio de la sesión muestra su animación pequeñita
  await expect(page.getByTestId('ejercicio-programa').first().getByRole('img', { name: /Cómo se hace/ })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar programa' }).click();
  await expect(page.getByTestId('avance-programa')).toContainText('Sesión 1 de 12');
  await captura(page, '06c-programa');
  await page.getByRole('button', { name: /Empezar: semana 1/ }).click();
  // Primera vez con algunos ejercicios: se preparan pesos y reps
  await page.locator('[data-testid=armado], [data-testid=vista-foco], [data-testid=hoja-sobrecarga]').first().waitFor();
  if (await page.getByTestId('armado').isVisible()) await page.getByRole('button', { name: 'Empezar entrenamiento', exact: true }).click();
  await sinSobrecarga(page);
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).first().click();
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar y terminar' }).click();
  await ir(page, 'Inicio');
  await expect(page.getByTestId('programa-en-curso')).toContainText('Sesión 2 de 12');
  await ir(page, 'Entreno');
  await page.getByRole('link', { name: 'Programas' }).first().click();
  // El programa en curso va primero, con su avance
  await expect(page.getByTestId('programa').first()).toContainText('Más dominadas');
  await captura(page, '06d-programa-en-inicio');
});

test('pantalla de inicio: emblema sobre negro al abrir y después se desvanece', async ({ page }) => {
  await page.goto('/');
  const inicio = page.locator('#inicio');
  await expect(inicio.locator('svg')).toBeVisible();
  await expect(inicio).toHaveCSS('background-color', 'rgb(20, 18, 14)');
  await page.screenshot({ path: `capturas/${test.info().project.name}/00-pantalla-inicio.png` });
  await expect(inicio).toHaveCount(0, { timeout: 8000 });
});

test('widget "Entrenamiento de hoy": /?empezar=hoy arranca la rutina del día', async ({ page }) => {
  await entrar(page);
  await expect(page.getByTestId('tarjeta-hoy')).toBeVisible();
  await expect(page.getByTestId('esqueleto')).toHaveCount(0);
  const hayHoy = await page.getByTestId('tarjeta-hoy').getByRole('button', { name: /^Empezar (?!entrenamiento libre)/ }).count() > 0; // los días sin rutina solo hay "Empezar entrenamiento libre"
  await page.goto('/?empezar=hoy');
  if (hayHoy) await expect(page).toHaveURL(/\/entrenar/);
  else await expect(page).toHaveURL(/\/$/);
});

test('programas: hasta 3 a la vez; con el cuarto elijo cuál dejar', async ({ page }) => {
  await entrar(page);
  const empezarPrograma = async (nombre: string) => {
    await page.goto('/programas');
    await page.getByTestId('programa').filter({ has: page.getByRole('heading', { name: nombre, exact: true }) }).click();
    await page.getByRole('button', { name: 'Empezar programa' }).click();
  };
  for (const n of ['Más dominadas', 'Abdomen de acero', 'Legión en casa']) {
    await empezarPrograma(n);
    await expect(page.getByTestId('avance-programa')).toBeVisible();
  }
  await page.goto('/');
  await expect(page.getByTestId('programa-en-curso')).toHaveCount(3);
  await captura(page, '06e-tres-programas');
  // El cuarto pide elegir cuál dejar
  await empezarPrograma('Fuerza base 5×5');
  await expect(page.getByTestId('elegir-dejar').getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: /Dejar «Abdomen de acero»/ }).click();
  await expect(page.getByTestId('avance-programa')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('programa-en-curso')).toHaveCount(3);
  await expect(page.getByText('Abdomen de acero')).toHaveCount(0);
});


// Familia v1.6.0: tarjeta de perfil igual en las apps, cambiar foto y nombre; la foto aparece en el Panel del día
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
test('perfil: tarjeta, cambiar foto y nombre', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Perfil');
  const tarjeta = page.getByTestId('tarjeta-perfil');
  await expect(tarjeta).toContainText('Marco');
  await tarjeta.getByLabel('Elegir foto de perfil').setInputFiles({ name: 'yo.png', mimeType: 'image/png', buffer: PNG_1PX });
  await expect(tarjeta.getByTestId('foto-perfil')).toBeVisible();
  await tarjeta.getByRole('button', { name: 'Cambiar nombre' }).click();
  await page.getByRole('dialog').getByLabel('Nombre').fill('Marco Aurelio');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(tarjeta).toContainText('Marco Aurelio');
  await captura(page, '21b-perfil-foto');
  await ir(page, 'Inicio');
  await expect(page.getByTestId('panel-dia').getByTestId('foto-perfil')).toBeVisible();
});

// v1.27.0: ningún programa se sale de la pantalla del celular (360 px) ni pide deslizar de costado
test('programas: ninguna ficha es más ancha que la pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await entrar(page);
  await page.goto('/programas');
  await expect(page.getByTestId('programa').first()).toBeVisible();
  const enlaces = await page.getByTestId('programa').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(enlaces.length).toBeGreaterThanOrEqual(6);
  for (const h of enlaces) {
    await page.goto(h!);
    await expect(page.getByRole('button', { name: /Empezar programa|Empezar:/ }).first()).toBeVisible();
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho, h!).toBeLessThanOrEqual(360);
  }
});

test('perfil: widget para Windows (Rainmeter): activar, bajar el .rmskin, cambiar el enlace y desactivar', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Perfil');
  const fila = page.getByTestId('widget-escritorio');
  await expect(fila).toContainText('Widget para Windows');
  await fila.click();
  const hoja = page.getByRole('dialog', { name: 'Widget para Windows' });
  await expect(hoja).toContainText('Rainmeter');
  await captura(page, '20b-widget-windows');
  const bajada = page.waitForEvent('download');
  await hoja.getByRole('button', { name: 'Activar y descargar' }).click();
  const archivo = await bajada;
  expect(archivo.suggestedFilename()).toBe('StoaGym.rmskin');
  const datos = (await import('node:fs')).readFileSync((await archivo.path())!);
  expect(datos.subarray(-7).toString('latin1')).toBe('RMSKIN\0'); // pie de Rainmeter
  expect(datos.subarray(0, 4).toString('latin1')).toBe('PK\u0003\u0004'); // es un zip
  await expect(fila).toContainText('Activado');
  const otra = page.waitForEvent('download');
  await hoja.getByRole('button', { name: 'Cambiar el enlace' }).click();
  await otra;
  await hoja.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('Widget de escritorio desactivado')).toBeVisible();
  await expect(fila).not.toContainText('Activado');
});
