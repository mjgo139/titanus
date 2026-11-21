// Genera las imágenes de los widgets de Android: el emblema (transparente) y las vistas previas.
// Uso: PW_CHROME=/usr/bin/google-chrome node scripts/widgets.mjs
import { chromium } from 'playwright';

const hojas = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
const interiores = [[27, 41, 25], [28, 60, 8], [105, 41, -25], [104, 60, -8]];
const el = (rx, ry) => ([x, y, g]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${g} ${x} ${y})"/>`;
const emblema = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="62 100 388 300">
<g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(110.8 115) scale(2.2)">
<g fill="none" stroke="#C9A66B" stroke-width="2" stroke-linecap="round"><path d="M58 108C26 98 12 66 20 24"/><path d="M74 108c32-10 46-42 38-84"/></g>
<g fill="#C9A66B">${hojas.map(el(4.6, 10.5)).join('')}${interiores.map(el(3.6, 7.6)).join('')}</g></g></g>
<g transform="translate(256 245) scale(.5)" fill="#F3EDDF"><rect x="-75" y="-15" width="150" height="30" rx="8"/><rect x="-113" y="-82" width="42" height="164" rx="16"/><rect x="71" y="-82" width="42" height="164" rx="16"/><rect x="-155" y="-58" width="34" height="116" rx="14"/><rect x="121" y="-58" width="34" height="116" rx="14"/><rect x="-177" y="-20" width="22" height="40" rx="8"/><rect x="155" y="-20" width="22" height="40" rx="8"/></g></svg>`;

const base = `<style>
*{box-sizing:border-box;margin:0} body{background:transparent;font-family:Roboto,Arial,sans-serif}
.w{background:linear-gradient(315deg,#0b0a08,#1c1712);border:2px solid #6B5230;border-radius:44px;color:#F7F1E7;padding:28px;display:flex}
.et{color:#F2C55C;font-size:20px;font-weight:700;letter-spacing:.14em}
.serif{font-family:Georgia,serif;font-weight:700}
.mu{color:#C9BDA7} .oro{color:#F2C55C}
.btn{background:linear-gradient(#FFE7A0,#E6B84E 55%,#B77C22);color:#0B0B0B;border-radius:40px;height:80px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:30px}
.dia{flex:1;height:60px;margin:0 6px;border-radius:50%;border:2px solid #3B3226;display:flex;align-items:center;justify-content:center;color:#9D917C;font-weight:700;font-size:24px;aspect-ratio:1}
.dia.h{background:linear-gradient(#FFE7A0,#E6B84E 55%,#B77C22);border:0;color:#0B0B0B} .dia.hoy{border:3px solid #F2C55C;color:#F2C55C}
</style>`;
const E = (w, h) => emblema(w, h);
const vistas = {
  racha: [360, 360, `<div class="w" style="width:360px;height:360px;flex-direction:column;align-items:center;justify-content:center">${E(112, 68)}
    <div class="serif oro" style="font-size:72px;line-height:1.1">VIII</div><div style="font-size:24px">semanas seguidas</div>
    <div class="et" style="color:#9D917C;font-size:17px;margin-top:6px">LEGIONARIO · NIVEL 5</div></div>`],
  semana: [760, 200, `<div class="w" style="width:760px;height:200px;align-items:center;padding:24px 28px"><div style="flex:1">
    <div class="et">TU SEMANA</div><div style="display:flex;margin-top:14px">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => `<div class="dia ${[0, 2].includes(i) ? 'h' : i === 3 ? 'hoy' : ''}">${d}</div>`).join('')}</div></div>
    <div style="margin-left:24px;text-align:center"><span class="serif" style="font-size:56px">2</span><span class="serif mu" style="font-size:30px">/7</span><div class="mu" style="font-size:20px">días</div></div></div>`],
  hoy: [760, 380, `<div class="w" style="width:760px;height:380px;flex-direction:column"><div style="display:flex;align-items:center">${E(68, 44)}
    <div class="et" style="flex:1;margin-left:16px">HOY TOCA</div><div class="serif mu" style="font-size:24px;font-weight:400">Racha · VIII</div></div>
    <div class="serif" style="font-size:44px;margin-top:16px">A · Full body</div><div class="mu" style="font-size:26px;margin-top:4px">7 ejercicios · 50 min</div>
    <div style="flex:1"></div><div class="btn">Entrenar</div></div>`],
  programa: [760, 380, `<div class="w" style="width:760px;height:380px;flex-direction:column"><div style="display:flex;align-items:center">${E(68, 44)}
    <div class="et" style="flex:1;margin-left:16px">TUS PROGRAMAS</div></div>
    <div style="margin-top:18px"><div style="display:flex;align-items:center"><div class="serif" style="font-size:32px;flex:1">Más dominadas</div><div class="serif oro" style="font-size:26px">25 %</div></div>
    <div style="height:10px;border-radius:5px;background:#3B3226;margin-top:8px"><div style="width:25%;height:100%;border-radius:5px;background:linear-gradient(90deg,#B77C22,#FFD67A)"></div></div>
    <div class="mu" style="font-size:22px;margin-top:6px">Sesión 4 de 12 · Tirón</div></div><div style="margin-top:18px"><div style="display:flex;align-items:center"><div class="serif" style="font-size:32px;flex:1">Abdomen de acero</div><div class="serif oro" style="font-size:26px">50 %</div></div>
    <div style="height:10px;border-radius:5px;background:#3B3226;margin-top:8px"><div style="width:50%;height:100%;border-radius:5px;background:linear-gradient(90deg,#B77C22,#FFD67A)"></div></div>
    <div class="mu" style="font-size:22px;margin-top:6px">Sesión 7 de 12 · Núcleo</div></div></div>`],
};

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const pag = await nav.newPage();
const R = 'android/app/src/main/res/drawable-nodpi';
await pag.setViewportSize({ width: 388, height: 300 });
await pag.setContent(`<html><body style="margin:0;background:transparent">${emblema(388, 300)}</body></html>`);
await pag.screenshot({ path: `${R}/widget_emblema.png`, omitBackground: true });
for (const [n, [w, h, html]] of Object.entries(vistas)) {
  await pag.setViewportSize({ width: w, height: h });
  await pag.setContent(`<html><head>${base}</head><body>${html}</body></html>`);
  await pag.screenshot({ path: `${R}/widget_vista_${n}.png`, omitBackground: true });
}
await nav.close();
console.log('imágenes de widgets listas');
