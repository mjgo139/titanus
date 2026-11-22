#!/usr/bin/env node
// Familia estoica · control automático. Uso (desde la raíz de la app):
//   node familia/revisar.mjs            → revisa la carpeta src
//   node familia/revisar.mjs src otra   → revisa esas carpetas
// Falla (código 1) si:
//   1. algún archivo de familia/ fue cambiado dentro de la app (se cambia en el repo familia-estoica);
//   2. hay un color escrito a mano (#abc, #aabbcc, rgb(), rgba(), hsl()…) fuera de familia/;
//   3. hay un tamaño de letra fuera de la escala de la familia (text-[14px], font-size: 14px, text-sm…);
//   4. un <Icono> usa un tamaño que no es 16, 20, 22, 23, 32 o 44;
//   5. la app arma su propia barra lateral (ancho 248) en vez de usar BarraLateral de la familia.
// Excepción puntual: poner el comentario  familia-ok  en esa misma línea (por ejemplo, los colores del logo de Google).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const errores = [];

// 1. Integridad de la copia
const version = JSON.parse(readFileSync(join(aqui, 'version.json'), 'utf8'));
const BINARIO = /\.(webp|png|jpe?g|avif)$/;
const hash = (ruta) => createHash('sha256').update(BINARIO.test(ruta) ? readFileSync(ruta) : readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
for (const [nombre, esperado] of Object.entries(version.archivos)) {
  const ruta = join(aqui, nombre);
  if (!existsSync(ruta)) errores.push(`familia/${nombre}: falta. Copiá de nuevo la carpeta familia/ del repo mjgo139/familia-estoica.`);
  else if (hash(ruta) !== esperado) errores.push(`familia/${nombre}: fue cambiado dentro de esta app. Los cambios de estilo se hacen en el repo mjgo139/familia-estoica y se copian.`);
}

// 2. Colores sueltos
const EXT = /\.(css|scss|ts|tsx|js|jsx|mjs|vue|svelte|html)$/;
const PRUEBA = /\.(test|spec)\.|\/(tests?|e2e|__tests__)\//;
const COLOR = [/(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![-\w])/, /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/];
const ESCALA = new Set(['11', '11.5', '12.5', '13.5', '15', '16', '18', '20', '26', '28', '36', '40', '48', '64']);
const ICONOS = new Set(['16', '20', '22', '23', '32', '44']);
const LETRA = [/text-\[([0-9.]+)px\]/g, /font-size:\s*([0-9.]+)px/g, /fontSize:\s*'?([0-9.]+)(?:px)?'?/g];
const TW = /(?<![-\w[])text-(xs|sm|base|lg|[2-9]?xl)(?![-\w])/;
const ICONO = /<Icono\b[^>]*?\bsize=\{([0-9.]+)\}/g;
const raiz = process.cwd();
const carpetas = process.argv.slice(2).length ? process.argv.slice(2) : ['src'];

function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === 'familia' || n.startsWith('.')) continue;
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else if (EXT.test(n) && !PRUEBA.test(ruta.replace(/\\/g, '/'))) revisar(ruta);
  }
}
function revisar(ruta) {
  readFileSync(ruta, 'utf8').split('\n').forEach((linea, i) => {
    if (linea.includes('familia-ok')) return;
    const m = COLOR.map((r) => linea.match(r)).find(Boolean);
    const donde = `${relative(raiz, ruta)}:${i + 1}`;
    if (m) errores.push(`${donde}: color escrito a mano "${m[0]}". Usá una variable de familia/tokens.css (por ejemplo var(--gold)).`);
    for (const r of LETRA) for (const x of linea.matchAll(r)) if (!ESCALA.has(x[1])) errores.push(`${donde}: tamaño de letra ${x[1]} fuera de la escala (11 · 11,5 · 12,5 · 13,5 · 15 · 16 · 18 · 20 · 26 · 28 · 36 · 40 · 48 · 64).`);
    if (/(?:w|pl|left)-\[248px\]/.test(linea)) errores.push(`${donde}: barra lateral propia (248 px). Usá <BarraLateral> y <Pestanas> de familia/react.tsx, y la clase .con-lateral.`);
    const tw = linea.match(TW);
    if (tw && /className|class=/.test(linea)) errores.push(`${donde}: "${tw[0]}" usa la escala de Tailwind; usá la de la familia (text-texto, text-sec… o text-[15px]).`);
    for (const x of linea.matchAll(ICONO)) if (!ICONOS.has(x[1])) errores.push(`${donde}: ícono de ${x[1]} px; solo 16 (con texto), 20 (botones y filas), 22–23 (navegación), 32 o 44 (decorativos).`);
  });
}
for (const c of carpetas) if (existsSync(join(raiz, c))) recorrer(join(raiz, c));

if (errores.length) {
  console.error(`✗ Familia estoica v${version.version}: ${errores.length} problema(s)\n  ` + errores.join('\n  '));
  process.exit(1);
}
console.log(`✓ Familia estoica v${version.version}: copia intacta, sin colores sueltos y con la escala de letras e íconos.`);
