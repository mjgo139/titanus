/**
 * Widget de escritorio para Windows (Rainmeter), común a las apps de la familia (familia v1.10.0).
 * Basado en el de StoaHabit v2.10.0: misma forma de llegar los datos, sin claves ni contraseñas.
 *
 * - En Perfil, "Activar y descargar" crea un código secreto al azar (`perfil.escritorio`, 24 letras).
 * - Mientras la app está abierta, la app escribe `escritorio/{codigo}` = { uid, t, actualizado } solo si cambió.
 * - El widget lee ese documento por la API REST de Firestore cada 15 minutos (sin sesión): quien no tiene el código
 *   no puede leerlo ni listar. "Cambiar el enlace" o "Desactivar" lo invalida al instante.
 * - El paquete `<App>.rmskin` se arma en el navegador con el código adentro: la persona no copia nada.
 *
 * Formato del resumen `t` (versión 2, para StoaGym y StoaFit):
 *   cabecera: "2|Nombre|AAAA-MM-DD|HH:MM|lunesGrilla|resumen de hoy|barra 0-100|unidad de la racha"
 *   filas (máx. 8): "id|nombre|estado|racha|color|subtítulo|35 días|% 30 días|derecha|ruta|tarjeta"
 *     estado: 1 hecho hoy · 0 pendiente hoy · - hoy no toca
 *     color: Oro | Verde | Serie1 | Serie2 | Serie3 | Serie4 (variables del skin)
 *     35 días: 5 semanas lunes→domingo que terminan esta semana (1 cumplido · 0 no · p hoy pendiente · f futuro · - no toca)
 *     tarjeta: 1 si se puede ver como tarjeta con la grilla, 0 si solo va en la lista.
 *     unidad: qué cuenta la racha de la fila (si está vacía, la de la cabecera).
 * Campos nuevos, SIEMPRE al final (los widgets instalados siguen andando).
 */
import { COLORES_ICONO, svgEmblemaSolo } from './emblema.mjs';

export const MAX_FILAS_ESCRITORIO = 8;
export const LARGO_CODIGO = 24;
export const DIAS_GRILLA = 35;
export const TARJETAS = 8;

export type EstadoHoy = '1' | '0' | '-';
export type ColorFila = 'Oro' | 'Verde' | 'Serie1' | 'Serie2' | 'Serie3' | 'Serie4';

export interface FilaEscritorio {
  id: string;
  nombre: string;
  estado: EstadoHoy;
  racha: number;
  color: ColorFila;
  subtitulo: string;
  /** 35 letras (o vacío si no hay historia) */
  dias: string;
  /** % de los últimos 30 días */
  pct: number;
  /** Texto corto a la derecha en la lista (p. ej. "LUN · JUE" o "520 kcal") */
  derecha: string;
  /** Ruta de la app que abre al tocar (p. ej. "/rutinas/abc/ver") */
  ruta: string;
  tarjeta: boolean;
  /** Qué cuenta la racha de esta fila ("SEMANAS", "DÍAS", "VECES"); si falta, la de la cabecera */
  unidad?: string;
}

export interface ResumenEscritorio {
  nombre: string;
  /** AAAA-MM-DD */
  hoy: string;
  /** Línea de resumen de la lista, en mayúsculas (p. ej. "HOY · 1 DE 2 RUTINAS") */
  resumen: string;
  /** Barra de avance del día, 0 a 100 */
  barra: number;
  /** "SEMANAS" o "DÍAS" */
  unidadRacha: string;
  filas: FilaEscritorio[];
}

/** Código secreto al azar (letras y números, sin confundibles). */
export function nuevoCodigoEscritorio(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const azar = crypto.getRandomValues(new Uint8Array(LARGO_CODIGO));
  return Array.from(azar, (n) => letras[n % letras.length]).join('');
}

/** Sin los separadores del formato ni comillas (el widget lee el texto tal cual). */
export function limpio(t: string, max: number): string {
  const s = t.replace(/[|~"\\\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** AAAA-MM-DD → fecha local al mediodía (evita saltos por horario de verano) */
function aFecha(clave: string): Date {
  const [a, m, d] = clave.split('-').map(Number);
  return new Date(a, m - 1, d, 12);
}
export function claveDe(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function sumarDiasClave(clave: string, n: number): string {
  const d = aFecha(clave);
  d.setDate(d.getDate() + n);
  return claveDe(d);
}

/** Lunes de la semana de `hoy` menos 4 semanas: la grilla termina el domingo de esta semana. */
export function inicioGrilla(hoy: string): string {
  const desdeLunes = (aFecha(hoy).getDay() + 6) % 7;
  return sumarDiasClave(hoy, -desdeLunes - 28);
}

/** Las 35 fechas de la grilla, de lunes a domingo. */
export function fechasGrilla(hoy: string): string[] {
  const lunes = inicioGrilla(hoy);
  return Array.from({ length: DIAS_GRILLA }, (_, i) => sumarDiasClave(lunes, i));
}

/** Texto para subir. `clave` no tiene la hora: se compara para escribir solo si cambió algo. */
export function armarTextoEscritorio(r: ResumenEscritorio, hora: string): { clave: string; texto: string } {
  const lunes = inicioGrilla(r.hoy);
  const filas = r.filas.slice(0, MAX_FILAS_ESCRITORIO).map((f) =>
    [limpio(f.id, 40), limpio(f.nombre, 30), f.estado, Math.max(0, Math.round(f.racha)), f.color, limpio(f.subtitulo, 40),
      f.dias.slice(0, DIAS_GRILLA), Math.max(0, Math.min(100, Math.round(f.pct))), limpio(f.derecha, 16), limpio(f.ruta, 80), f.tarjeta ? 1 : 0, limpio(f.unidad ?? '', 12)].join('|'));
  const pre = `2|${limpio(r.nombre || 'estoico', 24)}|${r.hoy}`;
  const pos = `${lunes}|${limpio(r.resumen, 48)}|${Math.max(0, Math.min(100, Math.round(r.barra)))}|${limpio(r.unidadRacha, 12)}`;
  return { clave: [`${pre}|${pos}`, ...filas].join('~'), texto: [`${pre}|${hora}|${pos}`, ...filas].join('~') };
}

/** Hora corta para el pie del widget. */
export function horaCorta(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------------------------
// Paquete .rmskin (un zip con un pie de 16 bytes que Rainmeter reconoce al hacer doble clic)
// ---------------------------------------------------------------------------------------------

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = TABLA_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function unir(partes: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of partes) { out.set(p, i); i += p.length; }
  return out;
}

/** Zip sin comprimir (alcanza: son archivos chicos). */
export function armarZip(archivos: Array<{ nombre: string; datos: Uint8Array }>): Uint8Array {
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let pos = 0;
  const enc = new TextEncoder();
  for (const a of archivos) {
    const nombre = enc.encode(a.nombre);
    const crc = crc32(a.datos);
    const cab = new DataView(new ArrayBuffer(30));
    cab.setUint32(0, 0x04034b50, true);
    cab.setUint16(4, 20, true);
    cab.setUint16(12, 0x21, true); // fecha 1980-01-01
    cab.setUint32(14, crc, true);
    cab.setUint32(18, a.datos.length, true);
    cab.setUint32(22, a.datos.length, true);
    cab.setUint16(26, nombre.length, true);
    partes.push(new Uint8Array(cab.buffer), nombre, a.datos);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(14, 0x21, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, a.datos.length, true);
    cen.setUint32(24, a.datos.length, true);
    cen.setUint16(28, nombre.length, true);
    cen.setUint32(42, pos, true);
    central.push(new Uint8Array(cen.buffer), nombre);
    pos += 30 + nombre.length + a.datos.length;
  }
  const largoCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, largoCentral, true);
  fin.setUint32(16, pos, true);
  return unir([...partes, ...central, new Uint8Array(fin.buffer)]);
}

/** .rmskin = zip + 8 bytes con el largo del zip (little-endian) + "\0RMSKIN\0". */
export function armarRmskin(archivos: Array<{ nombre: string; datos: Uint8Array }>): Uint8Array {
  const zip = armarZip(archivos);
  const pie = new DataView(new ArrayBuffer(16));
  pie.setUint32(0, zip.length, true);
  new Uint8Array(pie.buffer).set([0, 0x52, 0x4d, 0x53, 0x4b, 0x49, 0x4e, 0], 8);
  return unir([zip, new Uint8Array(pie.buffer)]);
}

/** Rainmeter lee los .ini y los .lua en UTF-16 LE con BOM (con UTF-8 se rompen las tildes). */
export function utf16le(texto: string): Uint8Array {
  const t = texto.replace(/\r?\n/g, '\r\n');
  const out = new Uint8Array(2 + t.length * 2);
  out[0] = 0xff;
  out[1] = 0xfe;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    out[2 + i * 2] = c & 0xff;
    out[3 + i * 2] = c >> 8;
  }
  return out;
}

/** Color ("#rrggbb" o "rgb(…)") en el formato de Rainmeter: "r,g,b" o "r,g,b,a". */
export function aRainmeter(color: string, alfa?: number): string {
  const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  const base = m ? `${m[1]},${m[2]},${m[3]}` : (() => { const n = parseInt(color.replace('#', ''), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; })();
  return alfa === undefined ? base : `${base},${alfa}`;
}

// ---------------------------------------------------------------------------------------------
// Configuración de cada app y skins
// ---------------------------------------------------------------------------------------------

export interface AppEscritorio {
  /** Nombre visible y de la carpeta de Rainmeter: "StoaGym" */
  nombre: string;
  /** Proyecto de Firebase */
  proyecto: string;
  /** Dirección de la app (sin barra final) */
  url: string;
  /** Figura del emblema (FIGURAS.mancuerna…) */
  figura: string;
  /** Para el menú: "Siguiente rutina" / "Siguiente meta" */
  singular: string;
  /** Texto del botón de la tarjeta cuando está pendiente hoy: "Entrenar ◇" */
  accionPendiente: string;
  /** Descripción para Rainmeter */
  informacion: string;
}

export interface ColoresWidget {
  verde: string;
  rojo: string;
  series: [string, string, string, string];
}

const FILAS = Array.from({ length: MAX_FILAS_ESCRITORIO }, (_, i) => i + 1);
const urlResumen = (proyecto: string, codigo: string) =>
  `https://firestore.googleapis.com/v1/projects/${proyecto}/databases/(default)/documents/escritorio/${codigo}`;

function variablesComunes(c: ColoresWidget) {
  return `Fondo=${aRainmeter(COLORES_ICONO.fondo, 242)}
Oro=${aRainmeter(COLORES_ICONO.laurel)}
Marfil=${aRainmeter(COLORES_ICONO.figura)}
Gris=${aRainmeter(COLORES_ICONO.figura, 120)}
Tenue=${aRainmeter(COLORES_ICONO.figura, 40)}
Linea=${aRainmeter(COLORES_ICONO.laurel, 70)}
Verde=${c.verde}
Rojo=${c.rojo}
Serie1=${c.series[0]}
Serie2=${c.series[1]}
Serie3=${c.series[2]}
Serie4=${c.series[3]}`;
}

const MEDIDAS = `[MeasureDatos]
Measure=WebParser
URL=#Url#
UpdateRate=900
CodePage=65001
RegExp=(?siU)"t": \\{\\s*"stringValue": "(.*)"\\s*\\}
OnConnectErrorAction=[!CommandMeasure MeasureLua "Estado('sin-conexion')"]
OnRegExpErrorAction=[!CommandMeasure MeasureLua "Estado('sin-datos')"]

[MeasureTexto]
Measure=WebParser
URL=[MeasureDatos]
StringIndex=1`;

/** Widget "Hoy": la lista (<App>/<App>.ini). */
export function skinIni(a: AppEscritorio, codigo: string, c: ColoresWidget): string {
  const filas = FILAS.map((i) => `
[MeterH${i}Marca]
Meter=String
MeterStyle=EstiloTexto
X=18
Y=0
FontSize=10
FontColor=#Gris#
Text=◇
Hidden=1

[MeterH${i}Nombre]
Meter=String
MeterStyle=EstiloTexto
X=40
Y=0
W=170
ClipString=1
FontSize=10
FontColor=#Marfil#
Text=
Hidden=1
MouseOverAction=[!SetOption MeterH${i}Nombre InlineSetting "Underline"][!UpdateMeter MeterH${i}Nombre][!Redraw]
MouseLeaveAction=[!SetOption MeterH${i}Nombre InlineSetting ""][!UpdateMeter MeterH${i}Nombre][!Redraw]
LeftMouseUpAction=["#App#"]

[MeterH${i}Derecha]
Meter=String
MeterStyle=EstiloDerecha
X=(#Ancho#-18)
Y=0
StringAlign=Right
Text=
Hidden=1
`).join('');
  return `; ${a.nombre} · widget de escritorio para Rainmeter (lo armó la app; no hace falta tocar nada)
; Lee tu resumen de hoy cada 15 minutos. Clic derecho → "Actualizar ahora" para pedirlo ya.

[Rainmeter]
Update=1000
DynamicWindowSize=1
AccurateText=1
ContextTitle=Abrir ${a.nombre}
ContextAction=["#App#"]
ContextTitle2=Actualizar ahora
ContextAction2=[!CommandMeasure MeasureDatos "Update"]
ContextTitle3=Agregar tarjeta (con las últimas 5 semanas)
ContextAction3=[!ActivateConfig "${a.nombre}\\Tarjeta1" "Tarjeta.ini"]

[Metadata]
Name=${a.nombre}
Author=${a.nombre}
Information=${a.informacion}
Version=1.0
License=Uso personal

[Variables]
Ancho=300
${variablesComunes(c)}
App=${a.url}
Url=${urlResumen(a.proyecto, codigo)}

[EstiloTexto]
FontFace=Segoe UI
AntiAlias=1
SolidColor=0,0,0,1

[EstiloDerecha]
FontFace=Georgia
FontSize=10
StringStyle=Bold
FontColor=#Oro#
AntiAlias=1

${MEDIDAS}

[MeasureLua]
Measure=Script
ScriptFile=#@#hoy.lua

[MeterFondo]
Meter=Shape
Shape=Rectangle 0,0,#Ancho#,150,16 | Fill Color #Fondo# | StrokeWidth 1 | Stroke Color #Linea#

[MeterEmblema]
Meter=Image
ImageName=#@#emblema.png
X=16
Y=16
W=40
PreserveAspectRatio=1
LeftMouseUpAction=["#App#"]

[MeterMarca]
Meter=String
X=64
Y=16
FontFace=Georgia
FontSize=14
StringStyle=Bold
FontColor=#Oro#
AntiAlias=1
Text=${a.nombre}
LeftMouseUpAction=["#App#"]

[MeterResumen]
Meter=String
MeterStyle=EstiloTexto
X=65
Y=42
W=220
ClipString=1
FontSize=8
StringStyle=Bold
FontColor=#Gris#
Text=CARGANDO…

[MeterBarra]
Meter=Shape
X=18
Y=72
Shape=Rectangle 0,0,(#Ancho#-36),4,2 | Fill Color #Linea# | StrokeWidth 0
Shape2=Rectangle 0,0,0,4,2 | Fill Color #Oro# | StrokeWidth 0
${filas}
[MeterPie]
Meter=String
MeterStyle=EstiloTexto
X=18
Y=120
FontSize=8
FontColor=#Gris#
Text=
LeftMouseUpAction=["#App#"]
`;
}

const LUA_COMUN = `local function v(nombre) return SKIN:GetVariable(nombre) or '' end
local function poner(meter, opcion, valor) SKIN:Bang('!SetOption', meter, opcion, valor) end

local function u8(cp)
  if cp < 128 then return string.char(cp) end
  if cp < 2048 then return string.char(192 + math.floor(cp / 64), 128 + cp % 64) end
  return string.char(224 + math.floor(cp / 4096), 128 + math.floor(cp / 64) % 64, 128 + cp % 64)
end
local function decodificar(s)
  s = s:gsub('\\\\u(%x%x%x%x)', function(h) return u8(tonumber(h, 16)) end)
  s = s:gsub('\\\\(.)', '%1')
  return s
end
-- Parte respetando campos vacíos ("a||b" → {"a", "", "b"})
local function partir(s, sep)
  local t = {}
  if s == nil or s == '' then return t end
  local desde = 1
  while true do
    local i = string.find(s, sep, desde, true)
    if not i then t[#t + 1] = s:sub(desde); break end
    t[#t + 1] = s:sub(desde, i - 1)
    desde = i + 1
  end
  return t
end
local function romano(n)
  if n <= 0 then return '0' end
  if n > 3999 then return tostring(n) end
  local tabla = { {1000,'M'},{900,'CM'},{500,'D'},{400,'CD'},{100,'C'},{90,'XC'},{50,'L'},{40,'XL'},{10,'X'},{9,'IX'},{5,'V'},{4,'IV'},{1,'I'} }
  local r = ''
  for _, p in ipairs(tabla) do while n >= p[1] do r = r .. p[2]; n = n - p[1] end end
  return r
end
local function diaNumero(f)
  local a, m, d = (f or ''):match('(%d+)-(%d+)-(%d+)')
  if not a then return nil end
  return math.floor(os.time({ year = tonumber(a), month = tonumber(m), day = tonumber(d), hour = 12 }) / 86400)
end
`;

/** Script del widget "Hoy" (hoy.lua). Lua 5.1 de Rainmeter. */
export function skinLua(a: AppEscritorio): string {
  return `-- ${a.nombre} · acomoda la lista con el resumen que manda la app.
local FILAS = ${MAX_FILAS_ESCRITORIO}
local APP = '${a.nombre.toUpperCase()}'
local ultimo, dia = nil, nil
${LUA_COMUN}
function Initialize() end

function Estado(cual)
  poner('MeterResumen', 'Text', cual == 'sin-conexion' and 'SIN CONEXIÓN · REINTENTA EN 15 MIN' or ('ABRÍ ' .. APP .. ' PARA ACTUALIZAR'))
  SKIN:Bang('!UpdateMeter', 'MeterResumen')
  SKIN:Bang('!Redraw')
end

function Pintar(texto, hoy)
  local partes = partir(texto, '~')
  local cab = partir(partes[1] or '', '|')
  local fecha = cab[3] or ''
  local esHoy = (fecha == hoy)
  local y = 88
  local total = 0
  for i = 1, FILAS do
    local f = partes[i + 1]
    local m = 'MeterH' .. i
    if f then
      local c = partir(f, '|')
      local estado = esHoy and (c[3] or '-') or '-'
      total = total + 1
      if estado == '1' then
        poner(m .. 'Marca', 'Text', '◆'); poner(m .. 'Marca', 'FontColor', v('Oro'))
      elseif estado == '0' then
        poner(m .. 'Marca', 'Text', '◇'); poner(m .. 'Marca', 'FontColor', v('Oro'))
      else
        poner(m .. 'Marca', 'Text', '·'); poner(m .. 'Marca', 'FontColor', v('Gris'))
      end
      poner(m .. 'Nombre', 'Text', c[2] or '')
      poner(m .. 'Nombre', 'FontColor', estado == '-' and v('Gris') or v('Marfil'))
      poner(m .. 'Nombre', 'LeftMouseUpAction', '["' .. v('App') .. (c[10] or '') .. '"]')
      poner(m .. 'Derecha', 'Text', c[9] or '')
      for _, s in ipairs({ 'Marca', 'Nombre', 'Derecha' }) do
        poner(m .. s, 'Y', tostring(y))
        SKIN:Bang('!ShowMeter', m .. s)
      end
      y = y + 26
    else
      for _, s in ipairs({ 'Marca', 'Nombre', 'Derecha' }) do SKIN:Bang('!HideMeter', m .. s) end
    end
  end
  if texto == '' then
    poner('MeterResumen', 'Text', 'CARGANDO…')
  elseif esHoy then
    poner('MeterResumen', 'Text', cab[6] or '')
  else
    poner('MeterResumen', 'Text', 'HOY · ABRÍ ' .. APP .. ' PARA ACTUALIZAR')
  end
  local ancho = (tonumber(v('Ancho')) or 300) - 36
  local barra = esHoy and (tonumber(cab[7] or '0') or 0) or 0
  poner('MeterBarra', 'Shape2', 'Rectangle 0,0,' .. math.floor(ancho * barra / 100) .. ',4,2 | Fill Color ' .. v('Oro') .. ' | StrokeWidth 0')
  local pie = 'Abrir ' .. '${a.nombre}'
  if cab[4] and cab[4] ~= '' then pie = 'Actualizado ' .. (esHoy and '' or (fecha .. ' ')) .. cab[4] .. ' · abrir ${a.nombre}' end
  poner('MeterPie', 'Text', pie)
  poner('MeterPie', 'Y', tostring(y + 8))
  poner('MeterFondo', 'Shape', 'Rectangle 0,0,' .. v('Ancho') .. ',' .. (y + 36) .. ',16 | Fill Color ' .. v('Fondo') .. ' | StrokeWidth 1 | Stroke Color ' .. v('Linea'))
  SKIN:Bang('!UpdateMeter', '*')
  SKIN:Bang('!Redraw')
end

function Update()
  local medida = SKIN:GetMeasure('MeasureTexto')
  local t = medida and medida:GetStringValue() or ''
  local hoy = os.date('%Y-%m-%d')
  if t ~= ultimo or hoy ~= dia then
    ultimo, dia = t, hoy
    Pintar(decodificar(t), hoy)
  end
  return 0
end
`;
}

/** Tarjeta con las últimas 5 semanas: Tarjeta{n}/Tarjeta.ini. `indice` = cuál muestra al principio. */
export function skinTarjetaIni(a: AppEscritorio, codigo: string, indice: number, c: ColoresWidget): string {
  const letras = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => `
[MeterDia${i + 1}]
Meter=String
MeterStyle=EstiloChico
X=${27 + i * 36 + 15}
Y=82
StringAlign=Center
Text=${l}
`).join('');
  const siguiente = indice < TARJETAS ? `\nContextTitle4=Agregar otra tarjeta\nContextAction4=[!ActivateConfig "${a.nombre}\\Tarjeta${indice + 1}" "Tarjeta.ini"]` : '';
  return `; ${a.nombre} · tarjeta con las últimas 5 semanas (lo armó la app; no hace falta tocar nada)
; Clic derecho → "Siguiente" para elegir qué muestra esta tarjeta.

[Rainmeter]
Update=1000
AccurateText=1
ContextTitle=Siguiente ${a.singular}
ContextAction=[!CommandMeasure MeasureLua "Mover(1)"]
ContextTitle2=Anterior
ContextAction2=[!CommandMeasure MeasureLua "Mover(-1)"]
ContextTitle3=Actualizar ahora
ContextAction3=[!CommandMeasure MeasureDatos "Update"]${siguiente}

[Metadata]
Name=${a.nombre} · tarjeta
Author=${a.nombre}
Information=${a.informacion}
Version=1.0
License=Uso personal

[Variables]
Indice=${indice}
Ancho=300
${variablesComunes(c)}
Accion=${a.accionPendiente}
App=${a.url}
Url=${urlResumen(a.proyecto, codigo)}

[EstiloChico]
FontFace=Segoe UI
FontSize=8
StringStyle=Bold
FontColor=#Gris#
AntiAlias=1

${MEDIDAS}

[MeasureLua]
Measure=Script
ScriptFile=#@#tarjeta.lua

[MeterFondo]
Meter=Shape
Shape=Rectangle 0,0,#Ancho#,326,16 | Fill Color #Fondo# | StrokeWidth 1 | Stroke Color #Linea#
LeftMouseUpAction=["#App#"]

[MeterCirculo]
Meter=Shape
X=16
Y=16
Shape=Ellipse 22,22,22 | Fill Color 0,0,0,1 | StrokeWidth 1.5 | Stroke Color #Oro#

[MeterInicial]
Meter=String
X=38
Y=27
StringAlign=Center
FontFace=Georgia
FontSize=14
StringStyle=Bold
FontColor=#Oro#
AntiAlias=1
Text=

[MeterNombre]
Meter=String
X=72
Y=17
W=150
ClipString=1
FontFace=Segoe UI
FontSize=13
StringStyle=Bold
FontColor=#Marfil#
AntiAlias=1
Text=${a.nombre}

[MeterSub]
Meter=String
MeterStyle=EstiloChico
X=72
Y=43
W=140
ClipString=1
FontColor=#Oro#
Text=CARGANDO…

[MeterRacha]
Meter=String
X=284
Y=10
StringAlign=Right
FontFace=Georgia
FontSize=20
StringStyle=Bold
FontColor=#Oro#
AntiAlias=1
Text=

[MeterRachaTexto]
Meter=String
MeterStyle=EstiloChico
X=284
Y=48
StringAlign=Right
Text=RACHA
${letras}
[MeterGrilla]
Meter=Shape
X=27
Y=100
Shape=Rectangle 0,0,246,174 | Fill Color 0,0,0,1 | StrokeWidth 0

[MeterRaya]
Meter=Shape
X=16
Y=286
Shape=Line 0,0,268,0 | StrokeWidth 1 | Stroke Color #Linea#

[MeterPie]
Meter=String
MeterStyle=EstiloChico
X=18
Y=297
Text=

[MeterAccion]
Meter=String
X=284
Y=294
StringAlign=Right
FontFace=Segoe UI
FontSize=10
StringStyle=Bold
FontColor=#Oro#
AntiAlias=1
SolidColor=0,0,0,1
Text=Ver detalle ›
LeftMouseUpAction=["#App#"]
`;
}

/** Script de la tarjeta (tarjeta.lua). Lua 5.1 de Rainmeter. */
export function skinTarjetaLua(a: AppEscritorio): string {
  return `-- ${a.nombre} · tarjeta: racha y las últimas 5 semanas.
local APP = '${a.nombre.toUpperCase()}'
local ultimo, dia = nil, nil
local items = {}
${LUA_COMUN}
function Initialize() end

function Estado(cual)
  poner('MeterSub', 'Text', cual == 'sin-conexion' and 'SIN CONEXIÓN' or ('ABRÍ ' .. APP .. ' PARA ACTUALIZAR'))
  SKIN:Bang('!UpdateMeter', 'MeterSub')
  SKIN:Bang('!Redraw')
end

local function indice()
  local n = #items
  if n == 0 then return 0 end
  local i = tonumber(v('Indice')) or 1
  return ((i - 1) % n) + 1
end

function Mover(paso)
  local n = #items
  if n == 0 then return end
  local i = ((indice() - 1 + paso) % n) + 1
  SKIN:Bang('!SetVariable', 'Indice', tostring(i))
  SKIN:Bang('!WriteKeyValue', 'Variables', 'Indice', tostring(i))
  ultimo = nil
end

local function celdas(dias, hoyIdx)
  local s = {}
  local function agregar(x) s[#s + 1] = x end
  local verde, rojo, gris, tenue, oro, marfil = v('Verde'), v('Rojo'), v('Gris'), v('Tenue'), v('Oro'), v('Marfil')
  for i = 1, 35 do
    local c = dias:sub(i, i)
    local col, fila = (i - 1) % 7, math.floor((i - 1) / 7)
    local x, y = col * 36, fila * 36
    if c == '1' then
      agregar('Rectangle ' .. x .. ',' .. y .. ',30,30,7 | Fill Color ' .. verde .. ',70 | StrokeWidth 1.5 | Stroke Color ' .. verde)
      agregar('Line ' .. (x + 8) .. ',' .. (y + 16) .. ',' .. (x + 13) .. ',' .. (y + 21) .. ' | StrokeWidth 2 | Stroke Color ' .. marfil)
      agregar('Line ' .. (x + 13) .. ',' .. (y + 21) .. ',' .. (x + 22) .. ',' .. (y + 10) .. ' | StrokeWidth 2 | Stroke Color ' .. marfil)
    elseif c == '0' then
      agregar('Rectangle ' .. x .. ',' .. y .. ',30,30,7 | Fill Color ' .. rojo .. ',45 | StrokeWidth 1.5 | Stroke Color ' .. rojo)
      agregar('Line ' .. (x + 10) .. ',' .. (y + 10) .. ',' .. (x + 20) .. ',' .. (y + 20) .. ' | StrokeWidth 1.8 | Stroke Color ' .. marfil)
      agregar('Line ' .. (x + 20) .. ',' .. (y + 10) .. ',' .. (x + 10) .. ',' .. (y + 20) .. ' | StrokeWidth 1.8 | Stroke Color ' .. marfil)
    elseif c == 'p' then
      agregar('Rectangle ' .. x .. ',' .. y .. ',30,30,7 | Fill Color 0,0,0,1 | StrokeWidth 1.5 | Stroke Color ' .. gris)
    elseif c == '-' then
      agregar('Rectangle ' .. x .. ',' .. y .. ',30,30,7 | Fill Color ' .. tenue .. ' | StrokeWidth 0')
    else
      agregar('Rectangle ' .. x .. ',' .. y .. ',30,30,7 | Fill Color 0,0,0,1 | StrokeWidth 1 | Stroke Color ' .. tenue)
    end
    if i == hoyIdx then
      agregar('Rectangle ' .. (x - 3) .. ',' .. (y - 3) .. ',36,36,9 | Fill Color 0,0,0,0 | StrokeWidth 2 | Stroke Color ' .. oro)
    end
  end
  return s
end

local maxFormas = 0

local function Pintar(texto, hoy)
  local partes = partir(texto, '~')
  local cab = partir(partes[1] or '', '|')
  items = {}
  for i = 2, #partes do
    local c = partir(partes[i], '|')
    if c[11] ~= '0' then items[#items + 1] = c end
  end
  local fecha, lunes = cab[3] or '', cab[5] or ''
  local esHoy = (fecha == hoy)
  local h = items[indice()]
  if not h then
    poner('MeterNombre', 'Text', '${a.nombre}')
    poner('MeterSub', 'Text', texto == '' and 'CARGANDO…' or ('ABRÍ ' .. APP .. ' PARA EMPEZAR'))
    poner('MeterRacha', 'Text', '')
    poner('MeterInicial', 'Text', '')
    SKIN:Bang('!UpdateMeter', '*')
    SKIN:Bang('!Redraw')
    return
  end
  local color = v(h[5] or 'Oro')
  if color == '' then color = v('Oro') end
  local nombre = h[2] or ''
  local ruta = v('App') .. (h[10] or '')
  poner('MeterNombre', 'Text', nombre)
  poner('MeterNombre', 'LeftMouseUpAction', '["' .. ruta .. '"]')
  poner('MeterInicial', 'Text', string.upper(nombre:sub(1, 1)))
  poner('MeterInicial', 'FontColor', color)
  poner('MeterCirculo', 'Shape', 'Ellipse 22,22,22 | Fill Color ' .. color .. ',30 | StrokeWidth 1.5 | Stroke Color ' .. color)
  poner('MeterSub', 'Text', h[6] or '')
  poner('MeterSub', 'FontColor', color)
  poner('MeterRacha', 'Text', romano(tonumber(h[4] or '0') or 0))
  local unidad = h[12]
  if unidad == nil or unidad == '' then unidad = cab[8] or 'DÍAS' end
  poner('MeterRachaTexto', 'Text', unidad) -- debajo del número romano: "SEMANAS", "VECES" o "DÍAS" (no se pisa con el subtítulo)
  local hoyIdx = 0
  if esHoy and lunes ~= '' then
    local a, b = diaNumero(lunes), diaNumero(hoy)
    if a and b then hoyIdx = b - a + 1 end
  end
  local formas = celdas(h[7] or '', hoyIdx)
  poner('MeterGrilla', 'Shape', 'Rectangle 0,0,246,174 | Fill Color 0,0,0,1 | StrokeWidth 0')
  for k, f in ipairs(formas) do poner('MeterGrilla', 'Shape' .. (k + 1), f) end
  for k = #formas + 2, maxFormas + 1 do poner('MeterGrilla', 'Shape' .. k, 'Rectangle 0,0,0,0 | StrokeWidth 0') end
  if #formas > maxFormas then maxFormas = #formas end
  local pie = '30 DÍAS · ' .. (h[8] or '0') .. '%'
  if not esHoy and fecha ~= '' then pie = pie .. ' · DEL ' .. fecha:sub(9, 10) .. '/' .. fecha:sub(6, 7) end
  poner('MeterPie', 'Text', pie)
  local pendiente = esHoy and h[3] == '0'
  poner('MeterAccion', 'Text', pendiente and v('Accion') or 'Ver detalle ›')
  poner('MeterAccion', 'LeftMouseUpAction', '["' .. ruta .. '"]')
  SKIN:Bang('!UpdateMeter', '*')
  SKIN:Bang('!Redraw')
end

function Update()
  local medida = SKIN:GetMeasure('MeasureTexto')
  local t = medida and medida:GetStringValue() or ''
  local hoy = os.date('%Y-%m-%d')
  if t ~= ultimo or hoy ~= dia then
    ultimo, dia = t, hoy
    Pintar(decodificar(t), hoy)
  end
  return 0
end
`;
}

function rmskinIni(a: AppEscritorio): string {
  return `[rmskin]
Name=${a.nombre}
Author=${a.nombre}
Version=1.0
MinimumRainmeter=4.5.0
MinimumWindows=10.0
LoadType=Skin
Load=${a.nombre}\\Tarjeta1\\Tarjeta.ini
`;
}

/** Lee los colores de la familia que la página ya tiene cargados (verde, rojo ladrillo y las series). */
export function coloresDeLaFamilia(): ColoresWidget {
  const estilo = getComputedStyle(document.documentElement);
  const c = document.createElement('canvas').getContext('2d')!;
  const leer = (nombre: string) => {
    c.fillStyle = COLORES_ICONO.laurel;
    const v = estilo.getPropertyValue(nombre).trim();
    if (v) c.fillStyle = v;
    return aRainmeter(String(c.fillStyle));
  };
  return { verde: leer('--verde'), rojo: leer('--miss'), series: [leer('--serie-1'), leer('--serie-2'), leer('--serie-4'), leer('--serie-6')] };
}

/** Dibuja el emblema de la app como PNG para el widget. */
async function emblemaPng(figura: string, lado = 120): Promise<Uint8Array> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgEmblemaSolo(figura, lado))}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = lado;
  c.height = Math.round((lado * img.height) / img.width) || lado;
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo dibujar el emblema.'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

/** Lista de archivos del paquete (sin el emblema, que necesita el navegador). */
export function archivosEscritorio(a: AppEscritorio, codigo: string, c: ColoresWidget): Array<{ nombre: string; datos: Uint8Array }> {
  const base = `Skins/${a.nombre}`;
  const archivos = [
    { nombre: 'RMSKIN.ini', datos: utf16le(rmskinIni(a)) },
    { nombre: `${base}/Hoy/Hoy.ini`, datos: utf16le(skinIni(a, codigo, c)) },
    { nombre: `${base}/@Resources/hoy.lua`, datos: utf16le(skinLua(a)) },
    { nombre: `${base}/@Resources/tarjeta.lua`, datos: utf16le(skinTarjetaLua(a)) },
  ];
  for (let n = 1; n <= TARJETAS; n++) archivos.push({ nombre: `${base}/Tarjeta${n}/Tarjeta.ini`, datos: utf16le(skinTarjetaIni(a, codigo, n, c)) });
  return archivos;
}

/** Arma el paquete <App>.rmskin con el código adentro, listo para doble clic. */
export async function paqueteEscritorio(a: AppEscritorio, codigo: string): Promise<Blob> {
  const archivos = archivosEscritorio(a, codigo, coloresDeLaFamilia());
  archivos.push({ nombre: `Skins/${a.nombre}/@Resources/emblema.png`, datos: await emblemaPng(a.figura) });
  const bytes = armarRmskin(archivos);
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
}

/** Baja un archivo desde el navegador. */
export function bajarArchivo(b: Blob, nombre: string) {
  const url = URL.createObjectURL(b);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ---------------------------------------------------------------------------------------------
// Subir el resumen solo si cambió
// ---------------------------------------------------------------------------------------------

/**
 * Sube el resumen si cambió desde la última vez (marca en localStorage `claveLocal`).
 * `guardar` escribe `escritorio/{codigo}` = { uid, t, actualizado } con el repositorio de cada app.
 */
export async function subirResumenEscritorio(
  claveLocal: string, codigo: string, texto: { clave: string; texto: string },
  guardar: (codigo: string, t: string) => Promise<void>, forzar = false,
) {
  const marca = `${codigo}:${texto.clave}`;
  let anterior = '';
  try { anterior = localStorage.getItem(claveLocal) ?? ''; } catch { /* sin almacenamiento */ }
  if (!forzar && anterior === marca) return;
  await guardar(codigo, texto.texto);
  try { localStorage.setItem(claveLocal, marca); } catch { /* a lo sumo se escribe de nuevo */ }
}
