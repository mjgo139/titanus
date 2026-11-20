import { expect, test, type Page } from '@playwright/test';

// Entrenadores y clientes, con datos inventados del modo prueba:
// Marco (marco@ejemplo.com) es admin y entrenador; Ana, Bruno y Carla son sus clientes.

async function captura(page: Page, nombre: string) {
  await expect(page.getByText('Cargando…')).toHaveCount(0);
  const ancho = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth), `${nombre}: la página es más ancha que la pantalla`).toBeLessThanOrEqual(ancho);
  await page.screenshot({ path: `capturas/${test.info().project.name}/${nombre}.png`, fullPage: true, animations: 'disabled' });
}

const ir = (page: Page, nombre: 'Inicio' | 'Entreno' | 'Progreso' | 'Clientes' | 'Perfil') =>
  page.getByRole('link', { name: nombre, exact: true }).filter({ visible: true }).click();

async function entrar(page: Page, email = 'marco@ejemplo.com', ruta = '/') {
  await page.goto(ruta);
  await page.evaluate(() => sessionStorage.removeItem('titanus-prueba-datos'));
  await page.goto(ruta);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('titanus');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /(Buen día|Buenas tardes|Buenas noches),/ })).toBeVisible();
}

test('entrenador: panel de clientes, ficha, comentar, asignar rutina y fijar objetivo', async ({ page }) => {
  await entrar(page);
  // En Inicio avisa quién necesita atención
  await expect(page.getByTestId('aviso-atencion')).toContainText('Bruno');
  await ir(page, 'Clientes');
  await expect(page.getByRole('heading', { name: 'Tus clientes' })).toBeVisible();
  await expect(page.getByTestId('codigo-invitacion')).toContainText('STG-M4RC');
  const clientes = page.getByTestId('cliente');
  await expect(clientes).toHaveCount(3);
  // Primero el que necesita atención
  await expect(clientes.first()).toContainText('Bruno Paz');
  await expect(clientes.first()).toContainText('Inactivo');
  await captura(page, '30-clientes');
  await page.getByRole('radio', { name: 'Atención' }).click();
  await expect(clientes).toHaveCount(1);
  await page.getByRole('radio', { name: 'Todos' }).click();

  await clientes.filter({ hasText: 'Ana Ruiz' }).click();
  await expect(page.getByRole('heading', { name: /Ana Ruiz/ })).toBeVisible();
  await expect(page.getByTestId('objetivo')).toHaveCount(3);
  await captura(page, '31-ficha-resumen');

  // Comentar un entrenamiento
  await page.getByRole('tab', { name: 'Entrenos' }).click();
  await page.getByTestId('entreno-cliente').first().getByRole('button').first().click();
  await page.getByLabel(/Comentario para Ana/).fill('Excelente técnica en el press.');
  await page.getByRole('button', { name: 'Enviar comentario' }).click();
  await expect(page.getByTestId('comentario').filter({ hasText: 'Excelente técnica' })).toBeVisible();
  await captura(page, '32-ficha-entrenos');

  // Asignar una rutina nueva
  await page.getByRole('tab', { name: 'Rutinas' }).click();
  await expect(page.getByTestId('rutina-cliente').first()).toBeVisible();
  await page.getByRole('link', { name: 'Nueva rutina' }).click();
  await page.getByPlaceholder('Ej.: Pecho y tríceps').fill('Brazos de Ana');
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click();
  await page.getByLabel('Buscar ejercicio').fill('curl martillo');
  await page.getByRole('button', { name: /Curl martillo/ }).first().click();
  await page.getByRole('button', { name: 'Guardar y asignar' }).click();
  await expect(page.getByTestId('rutina-cliente').filter({ hasText: 'Brazos de Ana' })).toContainText('Asignada por vos');
  await captura(page, '33-ficha-rutinas');

  await page.getByRole('tab', { name: 'Progreso' }).click();
  await page.getByTestId('progreso-ejercicio').first().getByRole('button').click();
  await captura(page, '34-ficha-progreso');

  // Fijar un objetivo de marca
  await page.getByRole('tab', { name: 'Objetivos' }).click();
  await page.getByRole('button', { name: 'Nuevo objetivo' }).click();
  await page.getByRole('radio', { name: 'Marca' }).click();
  await page.getByLabel('Ejercicio del objetivo').selectOption('press-banca');
  await page.getByLabel('Meta').fill('70');
  await page.getByRole('button', { name: 'Guardar objetivo' }).click();
  await expect(page.getByTestId('objetivo')).toHaveCount(4);
  await expect(page.getByTestId('objetivo').last()).toContainText('Press de banca 70 kg');
  await captura(page, '35-ficha-objetivos');

  await page.getByRole('tab', { name: 'Mensajes' }).click();
  await page.getByLabel(/Mensaje para Ana/).fill('¿Cómo te sentiste esta semana?');
  await page.getByRole('button', { name: 'Enviar comentario' }).click();
  await expect(page.getByTestId('comentario').filter({ hasText: 'esta semana' })).toBeVisible();
  await captura(page, '36-ficha-mensajes');
});

test('cliente: ve a su entrenador, la rutina asignada sin poder cambiarla y responde', async ({ page }) => {
  await entrar(page, 'ana@ejemplo.com');
  await expect(page.getByTestId('aviso-entrenador')).toContainText('1 nuevo');
  // Ana eligió legionaria: ve esas estatuas
  await expect(page.locator('img[src*="avatar-f"]:visible').first()).toBeVisible();
  await captura(page, '37-cliente-inicio');
  await ir(page, 'Entreno');
  // No tiene pestaña de clientes
  await expect(page.getByRole('link', { name: 'Clientes', exact: true })).toHaveCount(0);
  const asignada = page.getByRole('listitem').filter({ hasText: 'Core y movilidad' });
  await expect(asignada.getByTestId('de-tu-entrenador')).toContainText('Marco');
  await asignada.getByRole('link', { name: 'Ver Core y movilidad' }).click();
  await expect(page.getByTestId('rutina-solo-lectura')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar rutina' })).toHaveCount(0);
  await captura(page, '38-cliente-rutina-asignada');

  await ir(page, 'Inicio');
  await page.getByTestId('aviso-entrenador').click();
  await expect(page.getByRole('heading', { name: 'Marco' })).toBeVisible();
  await expect(page.getByTestId('objetivo')).toHaveCount(3);
  await expect(page.getByTestId('comentario-entreno').first()).toContainText('sentadilla');
  await page.getByLabel(/Escribile a Marco/).fill('¡Gracias! El sábado hago core.');
  await page.getByRole('button', { name: 'Enviar comentario' }).click();
  await expect(page.getByTestId('comentario').filter({ hasText: 'El sábado' })).toBeVisible();
  await captura(page, '39-cliente-mi-entrenador');
  // Al volver a Inicio ya no hay mensajes nuevos
  await ir(page, 'Inicio');
  await expect(page.getByTestId('aviso-entrenador')).not.toContainText('nuevo');

  // Cortar el vínculo
  await page.getByTestId('aviso-entrenador').click();
  await page.getByRole('button', { name: 'Dejar de compartir mis datos' }).click();
  await page.getByRole('button', { name: 'Sí, dejar de compartir' }).click();
  await expect(page.getByRole('heading', { name: /Vinculate/ })).toBeVisible();
});

test('invitación: se vincula con el enlace, pide ser entrenador y el admin lo aprueba', async ({ page }) => {
  // Llega con el enlace de invitación y crea su cuenta
  await page.goto('/?codigo=stg-m4rc');
  await page.evaluate(() => sessionStorage.removeItem('titanus-prueba-datos'));
  await page.getByRole('button', { name: 'Crear cuenta' }).first().click();
  await page.getByLabel('Nombre').fill('Lucas Benítez');
  await page.getByLabel('Correo').fill('lucas@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('secreta1');
  await page.getByRole('dialog').getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('button', { name: 'Omitir' }).click();
  await expect(page.getByTestId('aviso-invitacion')).toContainText('STG-M4RC');
  await page.getByTestId('aviso-invitacion').click();
  await expect(page.getByLabel('Código de tu entrenador')).toHaveValue('STG-M4RC');
  await captura(page, '40-vincular');
  await page.getByRole('button', { name: 'Aceptar y vincular' }).click();
  await expect(page.getByRole('heading', { name: 'Marco' })).toBeVisible();

  // Pide ser entrenador
  await ir(page, 'Perfil');
  await page.getByRole('button', { name: /Soy entrenador/ }).click();
  await page.getByLabel('Mensaje para el administrador').fill('Doy clases en un gimnasio de Concepción.');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.getByTestId('solicitud-pendiente')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();

  // El admin aprueba
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByLabel('Correo').fill('marco@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('titanus');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await ir(page, 'Perfil');
  await page.getByRole('link', { name: /Administrar profesionales/ }).click();
  await expect(page.getByTestId('solicitud')).toHaveCount(2);
  await captura(page, '41-admin');
  await page.getByTestId('solicitud').filter({ hasText: 'Lucas' }).getByRole('button', { name: 'Aprobar' }).click();
  await expect(page.getByRole('status')).toContainText('Lucas Benítez ya es entrenador');
  await expect(page.getByTestId('profesional').filter({ hasText: 'Lucas' })).toContainText('STG-');
  // Ahora Marco tiene 4 clientes (Lucas se sumó por el enlace)
  await expect(page.getByTestId('profesional').filter({ hasText: 'Marco' })).toContainText('4 clientes');

  // Lucas entra y ya tiene su panel
  await page.getByRole('button', { name: 'Volver' }).click().catch(() => undefined);
  await ir(page, 'Perfil');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByLabel('Correo').fill('lucas@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('secreta1');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await ir(page, 'Clientes');
  await expect(page.getByText('Todavía no tenés clientes')).toBeVisible();
  await captura(page, '42-panel-vacio');
});

test('una pestaña con datos de una versión anterior igual ve los clientes de ejemplo', async ({ page }) => {
  // Simula lo que guardaba la versión 1.6: solo la cuenta de Marco, sin clientes
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('titanus-prueba-datos', JSON.stringify({
    usuario: null,
    cuentas: [['marco@ejemplo.com', { u: { uid: 'prueba', email: 'marco@ejemplo.com', nombre: 'Marco' }, clave: 'titanus' }]],
    datos: {},
  })));
  await page.reload();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByLabel('Correo').fill('marco@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('titanus');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await ir(page, 'Clientes');
  await page.getByTestId('cliente').filter({ hasText: 'Ana Ruiz' }).click();
  await expect(page.getByRole('heading', { name: /Ana Ruiz/ })).toBeVisible();
  // Y Ana puede entrar
  await ir(page, 'Perfil');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByLabel('Correo').fill('ana@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('titanus');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Ana Ruiz' })).toBeVisible();
  // El botón de Perfil vuelve todo a cero
  await page.getByRole('button', { name: /Volver a los datos de ejemplo/ }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

test('legionaria: estatuas con la cabeza a la vista en Inicio, Entreno y Progreso', async ({ page }) => {
  await entrar(page, 'ana@ejemplo.com');
  await captura(page, '43-legionaria-inicio');
  await ir(page, 'Entreno');
  await expect(page.locator('img[src*="legionario-f"]').first()).toBeVisible();
  await captura(page, '44-legionaria-entreno');
  await ir(page, 'Progreso');
  await expect(page.locator('img[src*="espalda-f"]').first()).toBeVisible();
  await captura(page, '45-legionaria-progreso');
});
