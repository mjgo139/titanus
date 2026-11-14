import { expect, test, type Page } from '@playwright/test';

async function captura(page: Page, nombre: string) {
  await expect(page.getByText('Cargando…')).toHaveCount(0);
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
  await expect(page.getByRole('heading', { name: /Hola, Marco/ })).toBeVisible();
}

test('portada y acceso: ingresar, recuperar y registrar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('ENTRENAMIENTO · DISCIPLINA · FUERZA')).toBeVisible();
  await captura(page, '01-portada');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await captura(page, '02-iniciar-sesion');
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('Si existe una cuenta');
  await page.getByRole('button', { name: 'Ya tengo cuenta' }).click();
  await page.getByLabel('Contraseña').fill('mala');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('no coinciden');
  await page.getByRole('button', { name: '¿No tenés cuenta? Creala' }).click();
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Correo').fill('lucia@ejemplo.com');
  await page.getByLabel('Contraseña').fill('secreta1');
  await page.getByRole('dialog').getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Lucía' })).toBeVisible();
  await expect(page.getByTestId('rango')).toHaveText('Recluta · Nivel 1');
  await captura(page, '03-inicio-vacio');
});

test('modo prueba: la sesión sobrevive a una recarga', async ({ page }) => {
  await entrar(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Hola, Marco/ })).toBeVisible();
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
  await hoja.getByLabel('Contraseña').fill('secreta1');
  await page.getByRole('dialog').getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText('Modo invitado')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Tito' })).toBeVisible();
});

test('inicio: rango, frase, racha y entrenamiento de hoy', async ({ page }) => {
  await entrar(page);
  await expect(page.getByTestId('rango')).toContainText('Nivel');
  await expect(page.getByTestId('racha')).not.toHaveText('—');
  await expect(page.getByRole('heading', { name: 'Entrenamiento de hoy' })).toBeVisible();
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
  await page.getByRole('button', { name: 'Hombros', exact: true }).click();
  await captura(page, '07-biblioteca');
  await page.getByRole('button', { name: /Press militar/ }).click();
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click();
  await page.getByRole('button', { name: 'Crear ejercicio propio' }).click();
  await page.getByPlaceholder('Ej.: Remo en T').fill('Plancha con peso');
  await page.getByRole('button', { name: 'Abdomen', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar ejercicio' }).click();
  await expect(page.getByText('Plancha con peso')).toBeVisible();
  await captura(page, '08-editar-rutina');
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.getByRole('heading', { name: 'Hombros y abdomen' })).toBeVisible();
});

test('entrenar estilo Hevy: anterior, tipos de serie, descanso, récord y resumen', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Entreno');
  await page.getByRole('button', { name: 'Empezar rutina' }).first().click();
  await sinSobrecarga(page);
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByTestId('metricas')).toContainText('Duración');
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
  await expect(page.getByRole('heading', { name: /Hola, Marco/ })).toBeVisible();
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
  await page.getByRole('button', { name: /Subir Press de banca/ }).click();
  await expect(page.getByTestId('ejercicio-armado').first()).toContainText('Press de banca');
  await captura(page, '12b-armar-libre');
  await page.getByRole('button', { name: 'Empezar entrenamiento', exact: true }).click();
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByTestId('ejercicio')).toHaveCount(2);
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
  // Lo esencial entra en la pantalla sin bajar: el botón y el cronómetro
  await expect(page.getByRole('button', { name: 'Serie hecha' })).toBeInViewport();
  await expect(page.getByTestId('cronometro')).toBeInViewport();
  await captura(page, '27-foco');
  await page.getByRole('button', { name: 'Serie hecha' }).click();
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible();
  await expect(page.getByTestId('posicion')).toHaveText('Serie 2 de 4');
  await captura(page, '28-foco-descanso');
  for (let k = 0; k < 3; k++) await page.getByRole('button', { name: 'Serie hecha' }).click();
  await expect(page.getByRole('heading', { name: 'Press de banca' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todo' }).click();
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' }).first()).toBeVisible();
  await captura(page, '29-ver-todo');
  await page.getByRole('button', { name: 'Entrenar Peso muerto en modo foco' }).click();
  await expect(page.getByRole('heading', { name: 'Peso muerto' })).toBeVisible();
});
