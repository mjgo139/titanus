// Genera los íconos de StoaGym (familia estoica: laurel y colores de familia/emblema.mjs + mancuerna propia) para la web y Android.
// Diseño del dueño (icono-mancuerna.svg). Uso: PW_CHROME=/usr/bin/google-chrome node scripts/iconos.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

import { emblema as conFigura, svgIcono, COLORES_ICONO } from '../familia/emblema.mjs';

// Figura propia de StoaGym: la mancuerna (lienzo 512, centro 256,245). El laurel y los colores son de la familia.
const MANCUERNA = '<g transform="translate(256 245) scale(.5)"><rect x="-75" y="-15" width="150" height="30" rx="8"/><rect x="-113" y="-82" width="42" height="164" rx="16"/><rect x="71" y="-82" width="42" height="164" rx="16"/><rect x="-155" y="-58" width="34" height="116" rx="14"/><rect x="121" y="-58" width="34" height="116" rx="14"/><rect x="-177" y="-20" width="22" height="40" rx="8"/><rect x="155" y="-20" width="22" height="40" rx="8"/></g>';
/** Laurel + mancuerna sobre un lienzo de 512 */
export const emblema = conFigura(MANCUERNA);
/** forma: 'cuadrado' (esquinas redondeadas) | 'circulo' | 'lleno' (el teléfono pone la forma) */
export const svg = (forma = 'cuadrado') => svgIcono(MANCUERNA, { forma, titulo: 'StoaGym' });

const navegador = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const pagina = await navegador.newPage();
async function png(forma, tam, ruta) {
  await pagina.setViewportSize({ width: tam, height: tam });
  await pagina.setContent(`<html><body style="margin:0;background:transparent">${svg(forma).replace('<svg ', `<svg width="${tam}" height="${tam}" `)}</body></html>`);
  await pagina.screenshot({ path: ruta, omitBackground: true });
}
await png('lleno', 512, 'public/icono-512.png');
await png('lleno', 192, 'public/icono-192.png');
for (const [d, t] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  await png('lleno', t, `android/app/src/main/res/mipmap-${d}/ic_launcher.png`);
  await png('circulo', t, `android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`);
}
writeFileSync('public/icono.svg', svg('cuadrado'));

// ——— Pantalla de inicio (splash): fondo negro y el emblema al centro, sin el cuadrado ———
const soloEmblema = (w, h, ancho) => {
  // el emblema ocupa el recuadro 62..450 × 100..400 del lienzo de 512
  const esc = ancho / 388;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<g transform="translate(${w / 2 - 256 * esc} ${h / 2 - 250 * esc}) scale(${esc})">${emblema}</g></svg>`;
};
async function splash(w, h, ruta, fondo = true) {
  await pagina.setViewportSize({ width: w, height: h });
  await pagina.setContent(`<html><body style="margin:0;background:${fondo ? COLORES_ICONO.fondo : 'transparent'}">${soloEmblema(w, h, Math.round(Math.min(w, h) * (fondo ? 0.4 : 0.44)))}</body></html>`);
  await pagina.screenshot({ path: ruta, omitBackground: !fondo });
}
// Android 12 en adelante: ícono del splash (transparente; el sistema muestra el centro)
await splash(1024, 1024, 'android/app/src/main/res/drawable-nodpi/splash_icono.png', false);
// Android anterior: imagen completa
for (const [d, w, h] of [['', 480, 320], ['land-mdpi', 480, 320], ['land-hdpi', 800, 480], ['land-xhdpi', 1280, 720], ['land-xxhdpi', 1600, 960], ['land-xxxhdpi', 1920, 1280],
  ['port-mdpi', 320, 480], ['port-hdpi', 480, 800], ['port-xhdpi', 720, 1280], ['port-xxhdpi', 960, 1600], ['port-xxxhdpi', 1280, 1920]]) {
  await splash(w, h, `android/app/src/main/res/drawable${d ? '-' + d : ''}/splash.png`);
}
// Web: el mismo emblema dentro de index.html (se ve apenas abre, antes de que cargue la app)
const html = readFileSync('index.html', 'utf8');
const enLinea = `<svg viewBox="62 100 388 300" width="168" height="130" aria-hidden="true">${emblema}</svg>`;
writeFileSync('index.html', html.replace(/<!--splash-->[\s\S]*?<!--\/splash-->/, `<!--splash-->${enLinea}<!--/splash-->`));
await navegador.close();
console.log('íconos listos');
