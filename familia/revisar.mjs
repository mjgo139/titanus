#!/usr/bin/env node
// Familia estoica · control automático. Uso (desde la raíz de la app):
//   node familia/revisar.mjs            → revisa la carpeta src
//   node familia/revisar.mjs src otra   → revisa esas carpetas
// Falla (código 1) si:
//   1. algún archivo de familia/ fue cambiado dentro de la app (se cambia en el repo familia-estoica);
//   2. hay un color escrito a mano (#abc, #aabbcc, rgb(), rgba(), hsl()…) fuera de familia/.
// Excepción puntual: poner el comentario  familia-ok  en esa misma línea (por ejemplo, los colores del logo de Google).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const errores = [];

// 1. Integridad de la copia
const version = JSON.parse(readFileSync(join(aqui, 'version.json'), 'utf8'));
const hash = (ruta) => createHash('sha256').update(readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
for (const [nombre, esperado] of Object.entries(version.archivos)) {
  const ruta = join(aqui, nombre);
  if (!existsSync(ruta)) errores.push(`familia/${nombre}: falta. Copiá de nuevo la carpeta familia/ del repo mjgo139/familia-estoica.`);
  else if (hash(ruta) !== esperado) errores.push(`familia/${nombre}: fue cambiado dentro de esta app. Los cambios de estilo se hacen en el repo mjgo139/familia-estoica y se copian.`);
}

// 2. Colores sueltos
const EXT = /\.(css|scss|ts|tsx|js|jsx|mjs|vue|svelte|html)$/;
const PRUEBA = /\.(test|spec)\.|\/(tests?|e2e|__tests__)\//;
const COLOR = [/(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b(?![-\w])/, /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/];
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
    if (m) errores.push(`${relative(raiz, ruta)}:${i + 1}: color escrito a mano "${m[0]}". Usá una variable de familia/tokens.css (por ejemplo var(--gold)).`);
  });
}
for (const c of carpetas) if (existsSync(join(raiz, c))) recorrer(join(raiz, c));

if (errores.length) {
  console.error(`✗ Familia estoica v${version.version}: ${errores.length} problema(s)\n  ` + errores.join('\n  '));
  process.exit(1);
}
console.log(`✓ Familia estoica v${version.version}: copia intacta y sin colores sueltos.`);
