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
