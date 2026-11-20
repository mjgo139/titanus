// Genera los íconos de StoaGym (familia Stoica: laurel dorado + mancuerna marfil) para la web y Android.
// Diseño del dueño (icono-mancuerna.svg). Uso: PW_CHROME=/usr/bin/google-chrome node scripts/iconos.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const hojas = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
const interiores = [[27, 41, 25], [28, 60, 8], [105, 41, -25], [104, 60, -8]];
const elipse = (rx, ry) => ([x, y, g]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${g} ${x} ${y})"/>`;
/** Laurel + mancuerna sobre un lienzo de 512 */
export const emblema = `<g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(110.8 115) scale(2.2)">
  <g fill="none" stroke="#C9A66B" stroke-width="2" stroke-linecap="round"><path d="M58 108C26 98 12 66 20 24"/><path d="M74 108c32-10 46-42 38-84"/></g>
  <g fill="#C9A66B">${hojas.map(elipse(4.6, 10.5)).join('')}${interiores.map(elipse(3.6, 7.6)).join('')}</g></g></g>
<g transform="translate(256 245) scale(.5)" fill="#F3EDDF"><rect x="-75" y="-15" width="150" height="30" rx="8"/><rect x="-113" y="-82" width="42" height="164" rx="16"/><rect x="71" y="-82" width="42" height="164" rx="16"/><rect x="-155" y="-58" width="34" height="116" rx="14"/><rect x="121" y="-58" width="34" height="116" rx="14"/><rect x="-177" y="-20" width="22" height="40" rx="8"/><rect x="155" y="-20" width="22" height="40" rx="8"/></g>`;

/** forma: 'cuadrado' (esquinas redondeadas) | 'circulo' | 'lleno' (el teléfono pone la forma) */
export function svg(forma = 'cuadrado') {
  const fondo = forma === 'circulo' ? '<circle cx="256" cy="256" r="256" fill="#14120E"/>'
    : forma === 'lleno' ? '<rect width="512" height="512" fill="#14120E"/>'
    : '<rect width="512" height="512" rx="112" fill="#14120E"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>StoaGym</title>${fondo}${emblema}</svg>`;
}

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
await navegador.close();
console.log('íconos listos');
