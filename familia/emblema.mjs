// Familia estoica · dibujo del ícono y de la pantalla de inicio (sin dependencias).
// Cada app pone su figura al centro (lienzo 512×512, centro en 256,245). Ejemplo en GUIA.md.

/** Colores del ícono: iguales en las 4 apps (los mismos que --icono-* de tokens.css) */
export const COLORES_ICONO = { fondo: '#14120E', laurel: '#C9A66B', figura: '#F3EDDF' };

const hojas = [[13, 34, -25], [12, 54, -50], [17, 73, -65], [28, 89, -80], [119, 34, 25], [120, 54, 50], [115, 73, 65], [104, 89, 80]];
const interiores = [[27, 41, 25], [28, 60, 8], [105, 41, -25], [104, 60, -8]];
const elipse = (rx, ry) => ([x, y, g]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${g} ${x} ${y})"/>`;

/** Laurel del ícono sobre un lienzo de 512 */
export const laurel = `<g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(110.8 115) scale(2.2)">
  <g fill="none" stroke="${COLORES_ICONO.laurel}" stroke-width="2" stroke-linecap="round"><path d="M58 108C26 98 12 66 20 24"/><path d="M74 108c32-10 46-42 38-84"/></g>
  <g fill="${COLORES_ICONO.laurel}">${hojas.map(elipse(4.6, 10.5)).join('')}${interiores.map(elipse(3.6, 7.6)).join('')}</g></g></g>`;

/** Laurel + figura (la figura se pinta marfil) */
export const emblema = (figura) => `${laurel}\n<g fill="${COLORES_ICONO.figura}">${figura}</g>`;

/**
 * SVG completo del ícono.
 * forma: 'cuadrado' (esquinas redondeadas) | 'circulo' | 'lleno' (el teléfono pone la forma)
 */
export function svgIcono(figura, { forma = 'cuadrado', titulo = '' } = {}) {
  const f = COLORES_ICONO.fondo;
  const fondo = forma === 'circulo' ? `<circle cx="256" cy="256" r="256" fill="${f}"/>`
    : forma === 'lleno' ? `<rect width="512" height="512" fill="${f}"/>`
    : `<rect width="512" height="512" rx="112" fill="${f}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${titulo ? `<title>${titulo}</title>` : ''}${fondo}${emblema(figura)}</svg>`;
}

/** Solo el emblema, sin fondo, recortado (para la pantalla de inicio) */
export function svgEmblemaSolo(figura, ancho) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="62 100 388 300" width="${ancho}" height="${Math.round(ancho * 300 / 388)}">${emblema(figura)}</svg>`;
}

/**
 * Figuras de cada app (lienzo de 512, centro 256,245), tal como las diseñó el dueño.
 * Se usan con emblema(), svgIcono() y svgEmblemaSolo(): por ejemplo svgIcono(FIGURAS.check, { forma: 'lleno' }).
 */
export const FIGURAS = {
  /** StoaGym · entrenamiento */
  mancuerna: '<g transform="translate(256 245) scale(.5)"><rect x="-75" y="-15" width="150" height="30" rx="8"/><rect x="-113" y="-82" width="42" height="164" rx="16"/><rect x="71" y="-82" width="42" height="164" rx="16"/><rect x="-155" y="-58" width="34" height="116" rx="14"/><rect x="121" y="-58" width="34" height="116" rx="14"/><rect x="-177" y="-20" width="22" height="40" rx="8"/><rect x="155" y="-20" width="22" height="40" rx="8"/></g>',
  /** StoaFit · nutrición (agrandada ×1,42 como el laurel) */
  manzana: `<g transform="translate(256 256) scale(1.42) translate(-256 -256)"><g transform="translate(198.5 184) scale(1.15)"><path d="M50 36C41 28 22 27 15 44c-7 17 2 43 15 52 6 4 12 4 16 2 2.5-1.2 5.5-1.2 8 0 4 2 10 2 16-2 13-9 22-35 15-52-7-17-26-16-35-8Z"/><path fill="none" stroke="${COLORES_ICONO.figura}" stroke-width="5" stroke-linecap="round" d="M50 36c0-9 2-16 7-21"/><path fill="${COLORES_ICONO.laurel}" d="M57 19c4-10 14-14 24-12-2 10-12 16-24 12Z"/></g></g>`,
  /** StoaHabit · hábitos: círculo marfil con el check del color del fondo */
  check: `<g transform="translate(256 245) scale(.5)"><circle r="126"/><path d="M-54 2 L-16 40 L58 -38" fill="none" stroke="${COLORES_ICONO.fondo}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/></g>`,
};
