# familia/ · copia del diseño de la familia estoica

Esta carpeta es una **copia exacta** del repo `mjgo139/familia-estoica`. **No se edita acá.**
Si una app necesita un color o una pieza nueva, se agrega en ese repo, se sella la versión y se vuelve a copiar la carpeta a las 4 apps.

| Archivo | Qué tiene |
|---|---|
| `familia.css` | Importa todo en orden (tokens → base → piezas → movimiento) |
| `tokens.css` | **Todos** los colores, la escala de letras, los tamaños de íconos y las medidas (Noche romana y Mármol) |
| `base.css` | Fondo con vetas, letra base |
| `piezas.css` | `.tarjeta`, `.panel-dia`, `.grupo`, `.ficha`, `.btn`, `.btn-sec`, `.campo`, `.chip`, `.hero`… |
| `movimiento.css` | Animaciones y fundido entre pantallas |
| `tailwind-preset.js` | Colores de Tailwind atados a las variables |
| `iconos.tsx` | Juego único de íconos (`Icono`, `TAM`) |
| `react.tsx` | `Laurel`, `Grupo`, `Ficha`, `CabeceraPagina`, `Emblema`, `romano` |
| `emblema.mjs` | Dibujo del ícono y de la pantalla de inicio con la figura de cada app |
| `revisar.mjs` | Control: falla si esta carpeta cambió o si hay colores escritos a mano |
| `version.json` | Versión y huellas de cada archivo |

Guía completa: `GUIA.md` en el repo `mjgo139/familia-estoica`.
