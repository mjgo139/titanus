import { expect, test, type Page } from '@playwright/test';

async function captura(page: Page, nombre: string) {
  await expect(page.getByText('Cargando…')).toHaveCount(0);
  await page.screenshot({ path: `capturas/${test.info().project.name}/${nombre}.png`, fullPage: true, animations: 'disabled' });
}

/** En modo prueba los datos viven en memoria: navegamos con los botones, sin recargar la página */
const ir = (page: Page, nombre: 'Inicio' | 'Entreno' | 'Progreso' | 'Perfil') =>
  page.getByRole('link', { name: nombre, exact: true }).filter({ visible: true }).click();

async function entrar(page: Page, tema: 'light' | 'dark' = 'dark') {
  await page.emulateMedia({ colorScheme: tema });
  await page.goto('/');
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
  await expect(page.getByTestId('metricas')).toContainText('Duración');
  await expect(page.getByRole('button', { name: /Copiar serie anterior 1/ }).first()).toContainText('kg ×');
  // Récord: subir el peso de la segunda serie (la primera es de calentamiento)
  const peso = page.getByLabel('Peso serie 2').first();
  await peso.fill(String(Number(await peso.inputValue()) + 10));
  await page.getByRole('button', { name: 'Marcar serie 1 como hecha' }).first().click();
  await expect(page.getByRole('timer', { name: 'Descanso' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar serie 2 como hecha' }).first().click();
  await page.getByLabel('Notas de Press de banca').fill('Buen agarre');
  await page.getByRole('button', { name: 'Tipo de la serie 3' }).first().click();
  await page.getByRole('button', { name: 'Al fallo' }).click();
  await page.getByRole('button', { name: 'Agregar serie' }).first().click();
  expect(await page.getByTestId('serie').count()).toBeGreaterThan(4);
  await captura(page, '09-entrenar');
  await page.getByRole('button', { name: 'Saltar' }).click();
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
  await expect(page.getByText('Empezá agregando un ejercicio')).toBeVisible();
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click();
  await page.getByLabel('Buscar ejercicio').fill('dominadas');
  await page.getByRole('button', { name: /Dominadas/ }).click();
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

test('progreso: resumen, calendario, historial, repetir, récords y medidas', async ({ page }) => {
  await entrar(page);
  await ir(page, 'Progreso');
  await expect(page.getByRole('heading', { name: 'Tu evolución' })).toBeVisible();
  await expect(page.getByLabel('Calendario de entrenamientos')).toBeVisible();
  await captura(page, '14-progreso');
  await page.getByRole('radio', { name: 'Historial' }).click();
  await captura(page, '15-historial');
  await page.getByTestId('entreno-historial').first().getByRole('button').click();
  await captura(page, '16-detalle-entreno');
  await page.getByRole('button', { name: 'Repetir entrenamiento' }).click();
  await expect(page.getByTestId('metricas')).toBeVisible();
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
