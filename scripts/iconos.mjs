// Genera los íconos de TITANUS (familia Stoica: laurel dorado + letra marfil) en PNG para la web y Android.
// Uso: PW_CHROME=/usr/bin/google-chrome node scripts/iconos.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const fuente = readFileSync('node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2').toString('base64');
const hojas = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
const laurel = `<g transform="translate(256 262) scale(2.62) translate(-66 -66)">
  <g fill="none" stroke="#C9A66B" stroke-width="3.4" stroke-linecap="round"><path d="M58 108C26 98 12 66 20 24"/><path d="M74 108c32-10 46-42 38-84"/></g>
  <g fill="#C9A66B">${hojas.map(([x, y, g]) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="10.5" transform="rotate(${g} ${x} ${y})"/>`).join('')}</g></g>`;

/** forma: 'cuadrado' (redondeado) | 'circulo' | 'lleno' (sin bordes, para el fondo del sistema) */
export function svg(forma = 'cuadrado', conFuente = true) {
  const fondo = forma === 'circulo' ? '<circle cx="256" cy="256" r="256" fill="#14120E"/>'
    : forma === 'lleno' ? '<rect width="512" height="512" fill="#14120E"/>'
    : '<rect width="512" height="512" rx="112" fill="#14120E"/>';
  const estilo = conFuente ? `<style>@font-face{font-family:P;src:url(data:font/woff2;base64,${fuente})}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${estilo}${fondo}${laurel}
  <text x="256" y="314" text-anchor="middle" font-family="${conFuente ? 'P' : "'Playfair Display', Georgia, serif"}" font-size="176" font-weight="700" fill="#F3EDDF">T</text></svg>`;
}

const navegador = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const pagina = await navegador.newPage();
async function png(forma, tam, ruta) {
  await pagina.setViewportSize({ width: tam, height: tam });
  await pagina.setContent(`<html><body style="margin:0;background:transparent">${svg(forma).replace('<svg ', `<svg width="${tam}" height="${tam}" `)}</body></html>`);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: ruta, omitBackground: true });
}
await png('cuadrado', 512, 'public/icono-512.png');
await png('cuadrado', 192, 'public/icono-192.png');
for (const [d, t] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  await png('cuadrado', t, `android/app/src/main/res/mipmap-${d}/ic_launcher.png`);
  await png('circulo', t, `android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`);
}
writeFileSync('public/icono.svg', svg('cuadrado'));
await navegador.close();
console.log('íconos listos');
