import { expect, test, type Page } from '@playwright/test';

async function captura(page: Page, nombre: string) {
  await expect(page.getByText('Cargando…')).toHaveCount(0);
  await page.screenshot({ path: `capturas/${test.info().project.name}/${nombre}.png`, fullPage: true, animations: 'disabled' });
}

/** En modo prueba los datos viven en memoria: navegamos con los botones, sin recargar la página */
const ir = (page: Page, nombre: 'Hoy' | 'Rutinas' | 'Progreso' | 'Perfil') =>
  page.getByRole('link', { name: nombre, exact: true }).filter({ visible: true }).click();

async function entrar(page: Page, tema: 'light' | 'dark' = 'light') {
  await page.emulateMedia({ colorScheme: tema });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Volvé al hierro' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Panel del día', { exact: false })).toBeVisible();
}

test('acceso: ingresar, registrar y recuperar', async ({ page }) => {
  await page.goto('/');
  await captura(page, '01-acceso');
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperá el acceso' })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('Si existe una cuenta');
  await page.getByRole('button', { name: 'Ya tengo cuenta' }).click();
  await page.getByLabel('Contraseña').fill('mala');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('no coinciden');
  await page.getByRole('button', { name: '¿No tenés cuenta? Creala' }).click();
  await captura(page, '02-registro');
  await page.getByLabel('Nombre').fill('Lucía');
  await page.getByLabel('Correo').fill('lucia@ejemplo.com');
  await page.getByLabel('Contraseña').fill('secreta1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('heading', { name: /Lucía/ })).toBeVisible();
  await expect(page.getByText('Todavía no tenés rutinas')).toBeVisible();
  await captura(page, '03-hoy-vacio');
});

test('hoy muestra frase, racha y semana', async ({ page }) => {
  await entrar(page);
  await expect(page.getByText('Frase del día')).toBeVisible();
  await expect(page.getByTestId('racha')).not.toHaveText('—');
  await captura(page, '04-hoy');
  await entrar(page, 'dark');
  await captura(page, '05-hoy-oscuro');
});

test('crear rutina con la biblioteca y un ejercicio propio', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Rutinas');
  await expect(page.getByRole('heading', { name: 'Tu plan semanal' })).toBeVisible();
  await captura(page, '06-rutinas');
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
  await page.getByRole('button', { name: 'Más Series' }).first().click();
  await captura(page, '08-editar-rutina');
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.getByRole('heading', { name: 'Hombros y abdomen' })).toBeVisible();
});

test('entrenar: series, descanso, terminar y récord', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Rutinas');
  await page.getByRole('button', { name: 'Entrenar' }).first().click();
  await expect(page.getByText(/En curso/)).toBeVisible();
  await expect(page.getByText(/La última vez/).first()).toBeVisible();
  // Subir el peso de la primera serie para provocar un récord
  const peso = page.getByLabel('Peso serie 1').first();
  const actual = Number(await peso.inputValue());
  await peso.fill(String(actual + 10));
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).first().click();
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar serie 2 como hecha' }).first().click();
  await page.getByRole('radio', { name: 'Al límite' }).first().click();
  await captura(page, '09-entrenar');
  await page.getByRole('button', { name: 'Saltar' }).click();
  await page.getByRole('button', { name: 'Terminar entrenamiento' }).click();
  await page.getByRole('button', { name: 'Guardar y terminar' }).click();
  await expect(page.getByRole('heading', { name: 'Entrenamiento terminado' })).toBeVisible();
  await expect(page.getByText('Récord personal')).toBeVisible();
  await captura(page, '10-celebracion');
  await page.getByText('Récord personal').click();
  await expect(page.getByText('Récords nuevos')).toBeVisible();
  await captura(page, '11-resumen');
  await page.getByRole('button', { name: 'Volver a Hoy' }).click();
  await expect(page.getByText('Hecho', { exact: true })).toBeVisible();
});

test('el entrenamiento en curso se retoma desde Hoy', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Rutinas');
  await page.getByRole('button', { name: 'Entrenar' }).first().click();
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).first().click();
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByText('En curso')).toBeVisible();
  await page.getByRole('button', { name: /Seguir/ }).click();
  await expect(page.getByRole('button', { name: 'Desmarcar serie 1' }).first()).toBeVisible();
});

test('progreso: historial, récords, gráfico y cuerpo', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Progreso');
  await expect(page.getByRole('heading', { name: 'Lo que construiste' })).toBeVisible();
  await captura(page, '12-historial');
  await page.getByRole('radio', { name: 'Récords' }).click();
  await captura(page, '13-records');
  await page.getByRole('link', { name: /Press de banca/ }).click();
  await expect(page.getByRole('figure', { name: /Peso máximo/ })).toBeVisible();
  await captura(page, '14-grafico');
  await ir(page, 'Progreso');
  await page.getByRole('radio', { name: 'Cuerpo' }).click();
  await page.getByRole('button', { name: 'Registrar medidas de hoy' }).click();
  await page.getByLabel(/Peso \(kg\)/).fill('79,5');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('79,5 kg').first()).toBeVisible();
  await captura(page, '15-cuerpo');
});

test('perfil: apariencia, unidades, versión de admin y salir', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Perfil');
  await page.getByRole('radio', { name: 'Libras (lb)' }).click();
  await expect(page.getByTestId('version')).toContainText('commit');
  await captura(page, '16-perfil');
  await page.getByRole('radio', { name: 'Oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await captura(page, '17-perfil-oscuro');
  await page.getByTestId('version').click();
  await expect(page.getByText('Fase 1', { exact: false })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Borrar mi cuenta' }).click();
  await captura(page, '18-borrar-cuenta');
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('heading', { name: 'Volvé al hierro' })).toBeVisible();
});
