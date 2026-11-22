// Familia estoica · landing: puerta con código, avance del recorrido y apps del cofre.
import { APPS, HUELLA, huellaDe } from './config.js';

const CLAVE = 'familia-estoica.acceso';
const $ = (s) => document.querySelector(s);
const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

let stoa = null; // la escena 3D (si el navegador la soporta)
let objetivo = 0; // avance según el scroll (0 a 1)

// ——— Tarjetas de las apps ———
const fila = $('#apps-fila');
for (const a of APPS) {
  const el = document.createElement('a');
  el.className = 'app';
  el.href = a.url;
  el.target = '_blank';
  el.rel = 'noopener';
  el.dataset.app = a.id;
  el.innerHTML = `<img src="img/${a.id}-icono.svg" alt="" width="64" height="64" />
    <span class="app-textos"><span class="app-nombre">${a.nombre}</span><span class="app-tema">${a.tema}</span><span class="app-lema">${a.lema}</span></span>
    <span class="app-ir">Abrir ↗</span>`;
  fila.append(el);
}
const abrirApp = (id) => {
  const a = APPS.find((x) => x.id === id);
  if (a) window.open(a.url, '_blank', 'noopener');
};

// ——— Escena 3D ———
async function iniciarEscena() {
  try {
    const { crearStoa } = await import('./stoa.js');
    stoa = crearStoa($('#escena'), { alAbrirApp: abrirApp });
  } catch (e) {
    console.warn('Sin 3D:', e);
    document.body.classList.add('sin-3d');
  }
}

// ——— Avance y capítulos ———
const capitulos = [...document.querySelectorAll('.capitulo')];
const marcas = [...document.querySelectorAll('#riel span')];
const appsCaja = $('#apps');
const avanceRiel = $('#riel-avance');

function leerScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  objetivo = max > 0 && !document.body.classList.contains('bloqueado') ? limitar(scrollY / max) : 0;
}
addEventListener('scroll', leerScroll, { passive: true });
addEventListener('resize', leerScroll);

let mostrado = 0;
function cuadro() {
  // Con 3D, el texto sigue al avance suavizado de la cámara; sin 3D, al scroll directo
  mostrado = stoa ? stoa.avance() : objetivo;
  if (stoa) stoa.irA(objetivo);
  for (const c of capitulos) {
    const d = +c.dataset.desde, h = +c.dataset.hasta, borde = 0.035;
    const o = d === 0 ? 1 - limitar((mostrado - h + borde) / borde) : Math.min(limitar((mostrado - d) / borde), 1 - limitar((mostrado - h + borde) / borde));
    c.style.opacity = o.toFixed(3);
    const dy = (1 - o) * 24;
    c.style.translate = `0 ${dy.toFixed(1)}px`;
  }
  const final = mostrado > 0.955 || (!stoa && objetivo > 0.9);
  appsCaja.classList.toggle('visible', final);
  appsCaja.setAttribute('aria-hidden', String(!final));
  avanceRiel.style.height = `${(mostrado * 100).toFixed(2)}%`;
  for (const m of marcas) m.classList.toggle('pasado', mostrado >= parseFloat(m.style.getPropertyValue('--en')) - 0.01);
  requestAnimationFrame(cuadro);
}

// ——— Puerta ———
const puerta = $('#puerta');
function abrirPuerta(inmediato = false) {
  puerta.classList.add('abierta');
  puerta.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('bloqueado');
  scrollTo(0, 0);
  if (inmediato) puerta.style.transition = 'none';
  stoa?.entrar();
}

const guardada = (() => { try { return localStorage.getItem(CLAVE); } catch { return null; } })();
if (HUELLA && guardada === HUELLA) {
  abrirPuerta(true);
} else if (!HUELLA) {
  $('#puerta-texto').textContent = 'Muy pronto. La stoa todavía está cerrada.';
  $('#puerta-form').hidden = true;
} else {
  setTimeout(() => $('#codigo').focus({ preventScroll: true }), 400);
}

$('#puerta-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const campo = $('#codigo');
  const error = $('#puerta-error');
  const boton = e.target.querySelector('button');
  if (!campo.value.trim()) { error.textContent = 'Escribí tu código.'; error.hidden = false; return; }
  boton.disabled = true;
  const h = await huellaDe(campo.value);
  boton.disabled = false;
  if (h === HUELLA) {
    try { localStorage.setItem(CLAVE, h); } catch { /* nada */ }
    error.hidden = true;
    abrirPuerta();
  } else {
    error.textContent = 'Ese código no abre la stoa.';
    error.hidden = false;
    const caja = $('.puerta-caja');
    caja.classList.remove('sacudir'); void caja.offsetWidth; caja.classList.add('sacudir');
    campo.select();
  }
});

await iniciarEscena();
leerScroll();
requestAnimationFrame(cuadro);
