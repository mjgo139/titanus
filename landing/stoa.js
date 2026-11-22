// Familia estoica · "La Stoa": un viaje en cinco actos (Three.js, todo dibujado con código).
//   I  La stoa de noche · II El umbral (portal) · III El túnel · IV El cosmos (estatua gigante) · V La isla con el cofre
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { APPS } from './config.js';

const PASO = 5.5; // distancia entre columnas
const N_COL = 21; // columnas por lado
const X_COL = 4.2;
const Z_FIN = 2 - (N_COL - 1) * PASO; // última columna (-108)
const Z_PORTAL = -116;
const TUNEL = { desde: -116.6, hasta: -410, radio: 7 };
const COSMOS = new THREE.Vector3(0, 0, -480); // estatua gigante
const ISLA = new THREE.Vector3(0, 0, -578); // isla con el cofre

const suave = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a + (b - a) * t;
/** Sube entre a y b, se mantiene, y baja entre c y d */
const tramo = (a, b, c, d, v) => suave(a, b, v) * (1 - suave(c, d, v));

/** Interpolación monótona (Fritsch–Carlson): la velocidad no salta entre tramos */
function monotona(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const hh = xs[i + 1] - xs[i], t = (x - xs[i]) / hh, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * hh * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * hh * m[i + 1];
  };
}

/** Ruido de valor 3D para los shaders (nebulosa y túnel) */
const RUIDO_GLSL = `
  float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float ruido(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * ruido(p); p *= 2.03; a *= 0.5; } return v; }
  vec3 paleta(float t){ return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 1.0, 1.0) * t + vec3(0.0, 0.33, 0.67))); }
`;

/** Textura de mármol hecha en un lienzo (ruido + vetas) */
function marmol(tam, base, vena, { baldosas = 0, junta = '' } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, tam, tam);
  const img = g.getImageData(0, 0, tam, tam);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = vena;
  for (let v = 0; v < 9; v++) {
    g.globalAlpha = 0.08 + Math.random() * 0.18;
    g.lineWidth = 0.6 + Math.random() * 2.2;
    g.beginPath();
    let x = Math.random() * tam, y = Math.random() * tam;
    g.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      const nx = x + (Math.random() - 0.3) * tam * 0.45, ny = y + (Math.random() - 0.5) * tam * 0.45;
      g.quadraticCurveTo((x + nx) / 2 + (Math.random() - 0.5) * 60, (y + ny) / 2 + (Math.random() - 0.5) * 60, nx, ny);
      x = nx; y = ny;
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  if (baldosas) {
    g.strokeStyle = junta;
    g.lineWidth = 3;
    const t = tam / baldosas;
    for (let i = 0; i <= baldosas; i++) {
      g.beginPath(); g.moveTo(i * t, 0); g.lineTo(i * t, tam); g.stroke();
      g.beginPath(); g.moveTo(0, i * t); g.lineTo(tam, i * t); g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Inscripción dorada para el friso */
function inscripcion() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#2a241b';
  g.fillRect(0, 0, c.width, c.height);
  g.font = '700 64px Cinzel, Georgia, serif';
  g.fillStyle = '#d9b265';
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText('DISCIPLINA · MEDIDA · CONSTANCIA · SERENIDAD ·', c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Brillo radial (luna, halos) */
function halo(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, color);
  r.addColorStop(0.25, color.replace(/[\d.]+\)$/, '0.45)'));
  r.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ícono de una app pasado a textura (SVG → lienzo de 512) */
function iconoTextura(id) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, 512, 512);
    tex.needsUpdate = true;
  };
  img.src = `img/${id}-icono.svg`;
  return tex;
}

/** Columna dórica con estrías */
function geometriaFuste() {
  const g = new THREE.CylinderGeometry(0.4, 0.48, 6.2, 96, 8, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const f = 1 - 0.045 * Math.pow(Math.max(0, Math.cos(a * 20)), 0.5);
    p.setX(i, x * f);
    p.setZ(i, z * f);
  }
  g.computeVertexNormals();
  return g;
}

export function crearStoa(canvas, { alAbrirApp }) {
  const movil = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !movil, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('WebGL no disponible');
  renderer.setPixelRatio(Math.min(devicePixelRatio, movil ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const NOCHE = new THREE.Color(0x0a0806);
  scene.background = NOCHE.clone();
  scene.fog = new THREE.FogExp2(0x0a0806, 0.03);

  const camara = new THREE.PerspectiveCamera(56, 1, 0.1, 900);

  // ——— Luz general ———
  const hemi = new THREE.HemisphereLight(0x5a6a90, 0x1a1008, 0.55);
  scene.add(hemi);
  const luna = new THREE.DirectionalLight(0xa9bcff, 0.7);
  luna.position.set(-30, 40, -20);
  scene.add(luna);

  // ——— Cielo que viaja con la cámara: noche → nebulosa → amanecer ———
  const cieloMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: false, depthWrite: false,
    uniforms: { uCosmos: { value: 0 }, uAlba: { value: 0 }, uTiempo: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `${RUIDO_GLSL}
      uniform float uCosmos; uniform float uAlba; uniform float uTiempo; varying vec3 vP;
      void main(){
        float h = clamp(vP.y, -0.3, 1.0);
        vec3 noche = mix(vec3(0.16, 0.10, 0.05), vec3(0.012, 0.016, 0.035), smoothstep(0.0, 0.45, h));
        float n = fbm(vP * 2.2 + vec3(0.0, uTiempo * 0.015, 0.0));
        float n2 = fbm(vP * 4.5 - vec3(uTiempo * 0.02));
        vec3 neb = vec3(0.015, 0.01, 0.04);
        neb += vec3(0.35, 0.12, 0.55) * pow(n, 2.6) * 1.6;
        neb += vec3(0.05, 0.35, 0.45) * pow(n2, 3.0) * 1.3;
        neb += vec3(0.95, 0.65, 0.25) * pow(max(0.0, n * n2 * 2.2 - 0.35), 2.0);
        vec3 alba = mix(vec3(0.55, 0.26, 0.16), vec3(0.03, 0.03, 0.09), smoothstep(-0.1, 0.4, h));
        alba += vec3(0.45, 0.22, 0.08) * pow(max(0.0, 1.0 - abs(h + 0.02) * 4.0), 3.0);
        alba += neb * 0.2 * smoothstep(0.1, 0.6, h);
        alba *= 0.62;
        vec3 c = mix(noche, neb, uCosmos);
        c = mix(c, alba, uAlba);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const cielo = new THREE.Group();
  cielo.add(new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), cieloMat));
  const nEst = movil ? 900 : 2000;
  const est = new Float32Array(nEst * 3);
  for (let i = 0; i < nEst; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(560);
    if (i < nEst * 0.6) v.y = Math.abs(v.y);
    est.set([v.x, v.y, v.z], i * 3);
  }
  const gEst = new THREE.BufferGeometry();
  gEst.setAttribute('position', new THREE.BufferAttribute(est, 3));
  const matEst = new THREE.PointsMaterial({ color: 0xfff3dc, size: 1.5, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85, depthWrite: false });
  cielo.add(new THREE.Points(gEst, matEst));
  scene.add(cielo);

  // ==================== ACTO I · LA STOA ====================
  const stoa = new THREE.Group();
  scene.add(stoa);

  const lunaHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,236,200,1)'), fog: false, depthWrite: false, transparent: true }));
  lunaHalo.position.set(-70, 55, -180);
  lunaHalo.scale.set(26, 26, 1);
  lunaHalo.material.color.setScalar(0.75);
  stoa.add(lunaHalo);

  const texSuelo = marmol(1024, '#3a3128', '#b9a47e', { baldosas: 4, junta: 'rgba(10,8,6,.85)' });
  texSuelo.repeat.set(2.4, 30);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(11, 130), new THREE.MeshStandardMaterial({ map: texSuelo, roughness: 0.28, metalness: 0.15 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(0, 0, -55);
  stoa.add(suelo);
  const tierra = new THREE.Mesh(new THREE.CircleGeometry(260, 48), new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 1 }));
  tierra.rotation.x = -Math.PI / 2;
  tierra.position.set(0, -0.02, -60);
  stoa.add(tierra);

  const texPiedra = marmol(512, '#cfc4b0', '#8a7b62');
  texPiedra.repeat.set(1, 2);
  const piedra = new THREE.MeshStandardMaterial({ map: texPiedra, color: 0xe8dcc6, roughness: 0.62, metalness: 0.02 });
  const fuste = geometriaFuste();
  const partes = [
    { g: new THREE.CylinderGeometry(0.62, 0.68, 0.32, 40), y: 0.16 },
    { g: fuste, y: 0.32 + 3.1 },
    { g: new THREE.CylinderGeometry(0.66, 0.42, 0.36, 40), y: 6.52 + 0.18 },
    { g: new THREE.BoxGeometry(1.5, 0.24, 1.5), y: 6.88 + 0.12 },
  ];
  const m4 = new THREE.Matrix4();
  for (const parte of partes) {
    const inst = new THREE.InstancedMesh(parte.g, piedra, N_COL * 2);
    let k = 0;
    for (let i = 0; i < N_COL; i++) for (const lado of [-1, 1]) { m4.makeTranslation(lado * X_COL, parte.y, 2 - i * PASO); inst.setMatrixAt(k++, m4); }
    stoa.add(inst);
  }
  const largo = (N_COL - 1) * PASO + 3;
  const zMedio = (2 + Z_FIN) / 2;
  const texFriso = inscripcion();
  texFriso.repeat.set(largo / 16, 1);
  for (const lado of [-1, 1]) {
    const arq = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.72, largo), piedra);
    arq.position.set(lado * X_COL, 7.48, zMedio);
    const friso = new THREE.Mesh(new THREE.PlaneGeometry(largo, 0.6), new THREE.MeshStandardMaterial({ map: texFriso, roughness: 0.5, metalness: 0.3, emissive: 0x2a1a05, emissiveIntensity: 0.4 }));
    friso.position.set(lado * (X_COL - 0.71), 7.48, zMedio);
    friso.rotation.y = lado * -Math.PI / 2;
    const cornisa = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, largo + 0.6), piedra);
    cornisa.position.set(lado * X_COL, 7.98, zMedio);
    const muro = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.05, largo), piedra);
    muro.position.set(lado * (X_COL + 1.35), 0.52, zMedio);
    const remate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, largo), piedra);
    remate.position.set(lado * (X_COL + 1.35), 1.1, zMedio);
    stoa.add(arq, friso, cornisa, muro, remate);
  }
  const madera = new THREE.MeshStandardMaterial({ color: 0x1d140c, roughness: 0.9 });
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(10, largo), madera);
  techo.rotation.x = Math.PI / 2;
  techo.position.set(0, 8.12, zMedio);
  stoa.add(techo);
  const vigas = new THREE.InstancedMesh(new THREE.BoxGeometry(9.4, 0.32, 0.36), madera, N_COL);
  for (let i = 0; i < N_COL; i++) { m4.makeTranslation(0, 7.95, 2 - i * PASO); vigas.setMatrixAt(i, m4); }
  stoa.add(vigas);

  // Montañas lejanas
  const gMontes = new THREE.CylinderGeometry(190, 190, 1, 256, 1, true);
  const pm = gMontes.attributes.position;
  for (let i = 0; i < pm.count; i++) {
    if (pm.getY(i) > 0) {
      const a = Math.atan2(pm.getZ(i), pm.getX(i));
      pm.setY(i, Math.max(3, 10 + 9 * Math.sin(a * 3 + 1) + 6 * Math.sin(a * 7 + 2.3) + 3 * Math.sin(a * 17) + 1.5 * Math.sin(a * 41)));
    } else pm.setY(i, -2);
  }
  const montes = new THREE.Mesh(gMontes, new THREE.MeshBasicMaterial({ color: 0x07060a, fog: false, side: THREE.BackSide }));
  montes.position.z = -60;
  stoa.add(montes);

  // ——— Braseros y fuego (stoa + isla) ———
  const bronce = new THREE.MeshStandardMaterial({ color: 0x8a6a35, roughness: 0.35, metalness: 0.9 });
  const texHalo = halo('rgba(255,170,80,1)');
  const fuegoBases = [];
  function brasero(padre, x, z, real) {
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.1, 12), bronce);
    pie.position.set(x, 0.55, z);
    const cuenco = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bronce);
    cuenco.position.set(x, 1.32, z);
    const brasa = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    brasa.rotation.x = -Math.PI / 2;
    brasa.position.set(x, 1.3, z);
    const brillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHalo, color: 0xff8a30, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
    brillo.position.set(x, 1.75, z);
    brillo.scale.set(2.6, 2.6, 1);
    padre.add(pie, cuenco, brasa, brillo);
    const w = padre.localToWorld(new THREE.Vector3(x, 1.32, z));
    fuegoBases.push({ x: w.x, y: w.y, z: w.z, semilla: Math.random() * 100, real });
  }
  for (let z = -3, i = 0; z > Z_FIN; z -= 11, i++) brasero(stoa, (i % 2 ? 1 : -1) * 3.05, z, true);

  // ——— Estatuas atléticas en la stoa ———
  const cargador = new GLTFLoader();
  cargador.setMeshoptDecoder(MeshoptDecoder);
  const marmolEstatua = new THREE.MeshStandardMaterial({ color: 0xe9dfcd, roughness: 0.5, metalness: 0.03, emissive: 0x2a1d10, emissiveIntensity: 0.55 });
  const lugaresEstatua = [];
  function ponerEstatua(n, padre, alto, alListo) {
    cargador.load(`modelos/estatua-${n}.glb`, (g) => {
      const o = g.scene;
      o.traverse((m) => { if (m.isMesh) m.material = marmolEstatua; });
      const caja = new THREE.Box3().setFromObject(o);
      const esc = alto / (caja.max.y - caja.min.y);
      o.scale.setScalar(esc);
      o.position.y = -caja.min.y * esc;
      padre.add(o);
      alListo?.(o);
    });
  }
  [1, 3, 6].forEach((n, i) => {
    const lado = i % 2 ? 1 : -1;
    const z = 2 - (3 + i * 5 + 0.5) * PASO;
    lugaresEstatua.push({ x: lado * X_COL, z });
    const base = new THREE.Group();
    base.position.set(lado * X_COL, 0, z);
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.0, 1.15), piedra);
    pedestal.position.y = 0.5;
    const moldura = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 1.35), piedra);
    moldura.position.y = 1.06;
    const sobre = new THREE.Group();
    sobre.position.y = 1.12;
    sobre.rotation.y = lado < 0 ? 1.03 : -1.03;
    base.add(pedestal, moldura, sobre);
    stoa.add(base);
    ponerEstatua(n, sobre, 2.5);
  });

  // Polvo dorado de la stoa
  const nPolvo = movil ? 500 : 1100;
  const pPolvo = new Float32Array(nPolvo * 3), sPolvo = new Float32Array(nPolvo);
  for (let i = 0; i < nPolvo; i++) {
    pPolvo.set([(Math.random() - 0.5) * 9, 0.2 + Math.random() * 7.5, 10 - Math.random() * 125], i * 3);
    sPolvo[i] = Math.random();
  }
  const gPolvo = new THREE.BufferGeometry();
  gPolvo.setAttribute('position', new THREE.BufferAttribute(pPolvo, 3));
  gPolvo.setAttribute('aSemilla', new THREE.BufferAttribute(sPolvo, 1));
  const matPolvo = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTiempo: { value: 0 } },
    vertexShader: `uniform float uTiempo; attribute float aSemilla; varying float vBrillo;
      void main(){ vec3 p = position; float t = uTiempo * 0.18 + aSemilla * 40.0;
        p.x += sin(t) * 0.45; p.y += sin(t * 0.7 + 1.3) * 0.35; p.z += cos(t * 0.5) * 0.4;
        vBrillo = 0.45 + 0.55 * sin(uTiempo * 1.7 + aSemilla * 30.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min((1.5 + aSemilla * 2.5) * (26.0 / -mv.z), 5.0);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vBrillo; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
      gl_FragColor = vec4(vec3(1.0, 0.82, 0.48) * 1.4, smoothstep(0.5, 0.0, d) * 0.55 * vBrillo); }`,
  });
  const polvo = new THREE.Points(gPolvo, matPolvo);
  polvo.frustumCulled = false;
  stoa.add(polvo);

  // ==================== ACTO II · EL UMBRAL ====================
  const oro = new THREE.MeshStandardMaterial({ color: 0xd8a84a, roughness: 0.28, metalness: 1, emissive: 0x3a2405, emissiveIntensity: 0.5 });
  const portal = new THREE.Group();
  portal.position.set(0, 3.3, Z_PORTAL);
  scene.add(portal);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.13, 16, 96), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffb347, emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.3 }));
  const aro2 = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.04, 8, 96), oro);
  portal.add(aro, aro2);
  const velo = new THREE.Mesh(new THREE.CircleGeometry(3.05, 96), new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: false,
    uniforms: { uTiempo: { value: 0 }, uFuerza: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `${RUIDO_GLSL} uniform float uTiempo; uniform float uFuerza; varying vec2 vUv;
      void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
        float remolino = fbm(vec3(cos(a * 3.0 + r * 6.0 - uTiempo * 1.2), sin(a * 3.0 + r * 6.0 - uTiempo * 1.2), r * 2.0 - uTiempo * 0.3));
        float k = fract(remolino * 1.4 + r * 0.5 - uTiempo * 0.05);
        vec3 violeta = vec3(0.32, 0.08, 0.45), turquesa = vec3(0.05, 0.38, 0.42), dorado = vec3(1.0, 0.72, 0.3);
        vec3 c = k < 0.5 ? mix(violeta, turquesa, smoothstep(0.0, 0.5, k)) : mix(turquesa, violeta, smoothstep(0.5, 1.0, k));
        c = mix(c, dorado, smoothstep(0.55, 0.9, remolino) * 0.7);
        c *= 0.55 + remolino * 0.8;
        c += vec3(1.0, 0.85, 0.55) * pow(1.0 - r, 3.0) * 0.6; // luz al centro
        c = mix(c, vec3(1.0, 0.8, 0.45), smoothstep(0.82, 1.0, r) * 0.7); // borde dorado
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  portal.add(velo);
  // Dos columnas enormes enmarcan el umbral
  for (const lado of [-1, 1]) {
    const col = new THREE.Mesh(fuste, piedra);
    col.scale.set(1.5, 1.45, 1.5);
    col.position.set(lado * 4.6, 1.2, 0);
    portal.add(col);
  }
  const luzPortal = new THREE.PointLight(0xffc060, 40, 22, 2);
  luzPortal.position.set(0, 3.3, Z_PORTAL + 2.5);
  scene.add(luzPortal);

  // ==================== ACTO III · EL TÚNEL ====================
  const tunel = new THREE.Group();
  scene.add(tunel);
  const largoT = TUNEL.desde - TUNEL.hasta;
  const tunelMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: false,
    uniforms: { uTiempo: { value: 0 }, uFuerza: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `${RUIDO_GLSL} uniform float uTiempo; uniform float uFuerza; varying vec2 vUv;
      void main(){
        float ang = vUv.x * 6.28318; float largo = vUv.y * 40.0;
        vec3 q = vec3(cos(ang) * 1.6, sin(ang) * 1.6, largo - uTiempo * 0.9);
        float n = fbm(q + vec3(0.0, 0.0, fbm(q * 0.7 + uTiempo * 0.1) * 2.5));
        float vetas = pow(abs(sin((n * 9.0 + largo * 0.6 + vUv.x * 12.0) )), 18.0);
        float anillos = pow(abs(sin(largo * 3.14159 * 0.5 - uTiempo * 2.5)), 40.0);
        // paleta propia: violeta profundo, turquesa y oro
        float k = fract(n * 1.3 + largo * 0.02 + uTiempo * 0.03);
        vec3 violeta = vec3(0.22, 0.05, 0.32), turquesa = vec3(0.03, 0.28, 0.32), dorado = vec3(0.85, 0.55, 0.18);
        vec3 c = k < 0.5 ? mix(violeta, turquesa, smoothstep(0.0, 0.5, k)) : mix(turquesa, violeta, smoothstep(0.5, 1.0, k));
        c = mix(c, dorado, smoothstep(0.62, 0.95, n) * 0.8);
        c *= 0.35 + n * 0.75;
        c = mix(c, vec3(1.0, 0.78, 0.38), vetas * 0.55);
        c += vec3(1.0, 0.8, 0.45) * anillos * 0.35;
        // cerca de la salida se aclara hacia la nebulosa
        c = mix(c, vec3(0.12, 0.08, 0.2), smoothstep(0.08, 0.0, vUv.y) * 0.6);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(TUNEL.radio, TUNEL.radio, largoT, 72, 1, true), tunelMat);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.z = (TUNEL.desde + TUNEL.hasta) / 2;
  tunel.add(tubo);

  // Columnas y pedazos de mármol flotando en el túnel
  const nCol = movil ? 40 : 70;
  const piedraFlot = new THREE.MeshStandardMaterial({ map: texPiedra, color: 0xe8dcc6, roughness: 0.5, emissive: 0x9a8a74, emissiveIntensity: 0.55 });
  const colsFlot = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.36, 4.2, 16), piedraFlot, nCol);
  const nFrag = movil ? 70 : 140;
  const frags = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 0), piedraFlot, nFrag);
  const flotantes = [];
  for (let i = 0; i < nCol + nFrag; i++) {
    const a = Math.random() * Math.PI * 2, r = 3.2 + Math.random() * 3.0;
    flotantes.push({
      p: new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r + 2.6, TUNEL.desde - 8 - Math.random() * (largoT - 20)),
      e: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      v: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6),
      s: i < nCol ? 0.6 + Math.random() * 0.8 : 0.4 + Math.random() * 1.6,
    });
  }
  tunel.add(colsFlot, frags);
  const q4 = new THREE.Quaternion(), s3 = new THREE.Vector3();
  function moverFlotantes(t) {
    flotantes.forEach((f, i) => {
      const e = new THREE.Euler(f.e.x + t * f.v.x, f.e.y + t * f.v.y, f.e.z + t * f.v.z);
      q4.setFromEuler(e);
      s3.setScalar(f.s);
      m4.compose(f.p, q4, s3);
      if (i < nCol) colsFlot.setMatrixAt(i, m4); else frags.setMatrixAt(i - nCol, m4);
    });
    colsFlot.instanceMatrix.needsUpdate = true;
    frags.instanceMatrix.needsUpdate = true;
  }
  moverFlotantes(0);

  // Estelas de luz (velocidad)
  const nEstela = movil ? 500 : 1100;
  const pEst = new Float32Array(nEstela * 6), cEst = new Float32Array(nEstela * 6);
  for (let i = 0; i < nEstela; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.8 + Math.random() * 4.8;
    const x = Math.cos(a) * r, y = Math.sin(a) * r + 2.6, z = TUNEL.desde - Math.random() * largoT, l = 1.5 + Math.random() * 5;
    pEst.set([x, y, z, x, y, z - l], i * 6);
    const col = new THREE.Color().setHSL(Math.random() < 0.6 ? 0.11 : 0.5 + Math.random() * 0.35, 0.9, 0.6);
    cEst.set([col.r, col.g, col.b, 0, 0, 0], i * 6);
  }
  const gEstela = new THREE.BufferGeometry();
  gEstela.setAttribute('position', new THREE.BufferAttribute(pEst, 3));
  gEstela.setAttribute('color', new THREE.BufferAttribute(cEst, 3));
  const estelas = new THREE.LineSegments(gEstela, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  estelas.frustumCulled = false;
  tunel.add(estelas);

  // ==================== ACTO IV · EL COSMOS ====================
  const cosmos = new THREE.Group();
  cosmos.position.copy(COSMOS);
  scene.add(cosmos);
  const gigante = new THREE.Group();
  gigante.position.y = -9;
  cosmos.add(gigante);
  const marmolGigante = marmolEstatua.clone();
  marmolGigante.emissive.set(0x2a1e34);
  marmolGigante.emissiveIntensity = 0.35;
  marmolGigante.roughness = 0.42;
  cargador.load('modelos/estatua-6.glb', (g) => {
    const o = g.scene;
    o.traverse((m) => { if (m.isMesh) m.material = marmolGigante; });
    const caja = new THREE.Box3().setFromObject(o);
    const esc = 17 / (caja.max.y - caja.min.y);
    o.scale.setScalar(esc);
    o.position.y = -caja.min.y * esc;
    gigante.add(o);
  });
  // Corona de laurel dorada detrás de la cabeza
  const corona = new THREE.Group();
  corona.position.set(0, 6.6, -2.2);
  cosmos.add(corona);
  const hojaG = new THREE.SphereGeometry(1, 10, 6);
  hojaG.scale(0.32, 0.9, 0.08);
  const hojaMat = new THREE.MeshStandardMaterial({ color: 0xe0b050, emissive: 0xffb040, emissiveIntensity: 1.2, metalness: 0.7, roughness: 0.3 });
  const nHojas = 44;
  const hojas = new THREE.InstancedMesh(hojaG, hojaMat, nHojas);
  for (let i = 0; i < nHojas; i++) {
    const lado = i < nHojas / 2 ? -1 : 1;
    const k = (i % (nHojas / 2)) / (nHojas / 2 - 1);
    const a = -Math.PI / 2 + lado * (0.25 + k * 2.6);
    const r = 4.4;
    const pos = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
    const e = new THREE.Euler(0, 0, a + lado * 0.6);
    m4.compose(pos, q4.setFromEuler(e), s3.setScalar(1 - k * 0.35));
    hojas.setMatrixAt(i, m4);
  }
  corona.add(hojas);
  const ramas = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.06, 8, 96, Math.PI * 1.7), hojaMat);
  ramas.rotation.z = -Math.PI / 2 + Math.PI * 0.15;
  corona.add(ramas);
  // Anillo de polvo dorado alrededor de la estatua
  const nAnillo = movil ? 2500 : 6000;
  const pAn = new Float32Array(nAnillo * 3), sAn = new Float32Array(nAnillo);
  for (let i = 0; i < nAnillo; i++) {
    const a = Math.random() * Math.PI * 2, r = 9 + Math.pow(Math.random(), 0.6) * 9;
    pAn.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.8, Math.sin(a) * r], i * 3);
    sAn[i] = Math.random();
  }
  const gAn = new THREE.BufferGeometry();
  gAn.setAttribute('position', new THREE.BufferAttribute(pAn, 3));
  gAn.setAttribute('aSemilla', new THREE.BufferAttribute(sAn, 1));
  const anillo = new THREE.Points(gAn, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTiempo: { value: 0 } },
    vertexShader: `attribute float aSemilla; uniform float uTiempo; varying float vS;
      void main(){ vS = aSemilla; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min((1.0 + aSemilla * 2.2) * (60.0 / -mv.z), 6.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vS; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
      vec3 c = mix(vec3(1.0, 0.8, 0.45), vec3(0.75, 0.55, 1.0), step(0.75, vS));
      gl_FragColor = vec4(c * 1.3, smoothstep(0.5, 0.0, d) * 0.8); }`,
  }));
  anillo.rotation.set(0.42, 0, 0.18);
  anillo.position.y = 1;
  cosmos.add(anillo);
  const luzCosmos1 = new THREE.PointLight(0xb08cff, 0, 60, 1.5);
  luzCosmos1.position.set(-14, 6, 10);
  const luzCosmos2 = new THREE.PointLight(0xffc070, 0, 60, 1.5);
  luzCosmos2.position.set(12, 2, 12);
  cosmos.add(luzCosmos1, luzCosmos2);

  // ==================== ACTO V · LA ISLA ====================
  const isla = new THREE.Group();
  isla.position.copy(ISLA);
  scene.add(isla);
  const plataforma = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.2, 1.2, 64), piedra);
  plataforma.position.y = -0.6;
  const roca = new THREE.Mesh(new THREE.ConeGeometry(7.2, 11, 9, 4), new THREE.MeshStandardMaterial({ color: 0x2b241d, roughness: 0.95, flatShading: true }));
  const pRoca = roca.geometry.attributes.position;
  for (let i = 0; i < pRoca.count; i++) if (pRoca.getY(i) < 5) { pRoca.setX(i, pRoca.getX(i) * (0.85 + Math.random() * 0.3)); pRoca.setZ(i, pRoca.getZ(i) * (0.85 + Math.random() * 0.3)); }
  roca.geometry.computeVertexNormals();
  roca.rotation.x = Math.PI;
  roca.position.y = -6.7;
  isla.add(plataforma, roca);
  [[7, 0], [5.6, 0.26], [4.2, 0.52]].forEach(([ancho, y]) => {
    const esc = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.26, ancho * 0.7), piedra);
    esc.position.y = y + 0.13;
    isla.add(esc);
  });
  for (const lado of [-1, 1]) {
    const col = new THREE.Mesh(fuste, piedra);
    col.position.set(lado * 5.6, 3.1, -3.5);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.24, 1.5), piedra);
    cap.position.set(lado * 5.6, 6.3, -3.5);
    isla.add(col, cap);
  }
  brasero(isla, -2.9, 1.2, false);
  brasero(isla, 2.9, 1.2, false);
  // Nubes alrededor de la isla
  const texNube = halo('rgba(255,235,225,1)');
  const nubes = [];
  for (let i = 0; i < (movil ? 22 : 40); i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texNube, color: 0xc89a8a, transparent: true, opacity: 0.12 + Math.random() * 0.14, depthWrite: false, fog: false }));
    const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 40;
    sp.position.set(Math.cos(a) * r, -4 - Math.random() * 9, Math.sin(a) * r - 6);
    sp.scale.setScalar(14 + Math.random() * 22);
    sp.userData = { a, r, v: 0.01 + Math.random() * 0.02 };
    isla.add(sp);
    nubes.push(sp);
  }

  // Cofre
  const cofre = new THREE.Group();
  cofre.position.y = 0.78;
  isla.add(cofre);
  const maderaCofre = new THREE.MeshStandardMaterial({ color: 0x6b3f1d, roughness: 0.5, metalness: 0.15, side: THREE.DoubleSide, emissive: 0x1a0c04, emissiveIntensity: 0.4 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 1.05), maderaCofre);
  cuerpo.position.y = 0.425;
  cofre.add(cuerpo);
  for (const [w, h, d, x, y, z] of [[1.76, 0.08, 1.1, 0, 0.04, 0], [1.76, 0.08, 1.1, 0, 0.82, 0], [0.08, 0.86, 1.1, -0.82, 0.43, 0], [0.08, 0.86, 1.1, 0.82, 0.43, 0], [0.22, 0.26, 0.06, 0, 0.7, 0.54]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), oro);
    b.position.set(x, y, z);
    cofre.add(b);
  }
  const bisagra = new THREE.Group();
  bisagra.position.set(0, 0.85, -0.525);
  cofre.add(bisagra);
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.525, 0.525, 1.7, 32, 1, false, 0, Math.PI), maderaCofre);
  tapa.rotation.z = Math.PI / 2;
  tapa.rotation.y = Math.PI / 2;
  tapa.position.set(0, 0, 0.525);
  bisagra.add(tapa);
  const fondoTapa = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), maderaCofre);
  fondoTapa.rotation.x = Math.PI / 2;
  fondoTapa.position.set(0, 0, 0.525);
  bisagra.add(fondoTapa);
  for (const z of [0.02, 1.03]) {
    const fleje = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.06, 0.06), oro);
    fleje.position.set(0, 0, z);
    bisagra.add(fleje);
  }
  for (const x of [-0.82, 0, 0.82]) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 8, 32, Math.PI), oro);
    a.rotation.y = Math.PI / 2;
    a.position.set(x, 0, 0.525);
    bisagra.add(a);
  }
  const resplandor = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.98), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 }));
  resplandor.rotation.x = -Math.PI / 2;
  resplandor.position.y = 0.8;
  cofre.add(resplandor);
  const luzCofre = new THREE.PointLight(0xffc35a, 0, 14, 2);
  luzCofre.position.set(0, 1.6, 0.2);
  cofre.add(luzCofre);
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 0.75, 9, 48, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uFuerza: { value: 0 }, uTiempo: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uFuerza; uniform float uTiempo; varying vec2 vUv;
      void main(){ float rayas = 0.6 + 0.4 * sin(vUv.x * 60.0 + uTiempo * 0.8) * sin(vUv.x * 23.0 - uTiempo * 0.5);
        float a = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.08, 1.0 - vUv.y) * rayas * 0.22 * uFuerza;
        gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a, a); }`,
  }));
  haz.position.y = 0.85 + 4.5;
  cofre.add(haz);
  const luzIsla = new THREE.PointLight(0xffb070, 0, 22, 2);
  luzIsla.position.set(0, 5, 4);
  isla.add(luzIsla);

  const iconos = APPS.map((a) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconoTextura(a.id), transparent: true, depthWrite: false, fog: false }));
    sp.userData = { id: a.id, hover: 0 };
    sp.scale.setScalar(0.001);
    isla.add(sp);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,205,110,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.userData.halo = h;
    isla.add(h);
    return sp;
  });

  // ——— Fuego (todas las llamas en un solo dibujo) ———
  const porFuego = movil ? 70 : 120;
  const nFuego = fuegoBases.length * porFuego;
  const fBase = new Float32Array(nFuego * 3), fSem = new Float32Array(nFuego);
  fuegoBases.forEach((b, j) => {
    for (let i = 0; i < porFuego; i++) {
      const k = j * porFuego + i, a = Math.random() * Math.PI * 2, r = Math.random() * 0.24;
      fBase.set([b.x + Math.cos(a) * r, b.y, b.z + Math.sin(a) * r], k * 3);
      fSem[k] = Math.random();
    }
  });
  const gFuego = new THREE.BufferGeometry();
  gFuego.setAttribute('position', new THREE.BufferAttribute(fBase, 3));
  gFuego.setAttribute('aSemilla', new THREE.BufferAttribute(fSem, 1));
  const matFuego = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTiempo: { value: 0 }, uEscala: { value: 1 } },
    vertexShader: `uniform float uTiempo; uniform float uEscala; attribute float aSemilla; varying float vVida;
      void main(){ float vida = fract(uTiempo * (0.55 + aSemilla * 0.6) + aSemilla * 7.0);
        vec3 p = position; float giro = aSemilla * 6.2831 + uTiempo * 2.3;
        p.x += sin(giro) * 0.10 * (1.0 - vida); p.z += cos(giro * 1.3) * 0.10 * (1.0 - vida);
        p.y += vida * (0.9 + aSemilla * 0.6); vVida = vida;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(uEscala * (1.0 - vida * 0.75) * (120.0 / -mv.z), 26.0);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vVida; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.0, d) * (1.0 - vVida) * 0.9;
      vec3 c = mix(vec3(1.0, 0.86, 0.5), vec3(1.0, 0.28, 0.04), smoothstep(0.0, 0.7, vVida));
      gl_FragColor = vec4(c * 1.8, a); }`,
  });
  const fuego = new THREE.Points(gFuego, matFuego);
  fuego.frustumCulled = false;
  scene.add(fuego);
  const luces = Array.from({ length: movil ? 3 : 4 }, () => { const l = new THREE.PointLight(0xff9440, 0, 16, 2); scene.add(l); return l; });

  // ==================== Posprocesado ====================
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camara));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), movil ? 0.5 : 0.6, 0.5, 0.86);
  composer.addPass(bloom);
  // Viaje: aberración de color, viñeta y grano (más fuerte en el túnel)
  const viaje = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAberracion: { value: 0 }, uTiempo: { value: 0 }, uVineta: { value: 0.35 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAberracion; uniform float uTiempo; uniform float uVineta; varying vec2 vUv;
      float azar(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTiempo) * 43758.5453); }
      void main(){ vec2 c = vUv - 0.5; float r = length(c);
        vec2 o = c * uAberracion * r * 2.0;
        vec3 col = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
        col *= 1.0 - uVineta * smoothstep(0.35, 0.85, r);
        col += (azar(vUv * 600.0) - 0.5) * 0.025;
        gl_FragColor = vec4(col, 1.0); }`,
  });
  composer.addPass(viaje);
  composer.addPass(new OutputPass());

  let ultW = 0, ultH = 0, fovBase = 56;
  function medir() {
    const w = innerWidth, h = innerHeight;
    if (w === ultW && Math.abs(h - ultH) < 160) return; // la barra del navegador aparece y desaparece
    ultW = w; ultH = h;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camara.aspect = w / h;
    fovBase = w / h < 0.8 ? 70 : 56;
    camara.updateProjectionMatrix();
  }
  medir();
  addEventListener('resize', medir);

  // ==================== Recorrido de la cámara ====================
  // Puntos por los que pasa la cámara y hacia dónde mira; P = en qué parte del scroll llega a cada uno.
  const ruta = [
    // [p, posición, mira]
    [0.00, [0, 1.75, 9], [0, 2.0, 1]],
    [0.12, [0, 1.75, -38], [0, 2.0, -46]],
    [0.25, [0, 1.8, -90], [0, 2.4, -100]],
    [0.32, [0, 2.4, -106], [0, 3.2, -118]],
    [0.37, [0, 2.9, -124], [0, 2.8, -140]],
    [0.47, [0, 2.6, -240], [0, 2.6, -260]],
    [0.56, [0, 2.6, -392], [0, 2.5, -420]],
    [0.62, [7, 5, -446], [0, 4.5, -480]],
    [0.69, [19, 7, -476], [0, 6, -480]],
    [0.75, [9, 9, -506], [0, 5.5, -480]],
    [0.83, [0, 6.5, -546], [0, 1.5, -578]],
    [0.91, [0, 3.4, -569], [0, 2.4, -578]],
    [1.00, [0, 3.6, -569.6], [0, 3.1, -578]],
  ];
  const curvaPos = new THREE.CatmullRomCurve3(ruta.map((r) => new THREE.Vector3(...r[1])), false, 'centripetal');
  const curvaMira = new THREE.CatmullRomCurve3(ruta.map((r) => new THREE.Vector3(...r[2])), false, 'centripetal');
  const uDeP = monotona(ruta.map((r) => r[0]), ruta.map((_, i) => i / (ruta.length - 1)));

  let objetivo = 0, actual = 0, vel = 0, entrada = 0, dentro = false;
  let pr = renderer.getPixelRatio(), acum = 0, cuadros = 0;
  function calidad(dt) {
    acum += dt; cuadros++;
    if (acum < 1.5) return;
    const fps = cuadros / acum;
    acum = 0; cuadros = 0;
    const tope = Math.min(devicePixelRatio, movil ? 1.5 : 1.75);
    if (fps < 42 && pr > 0.75) pr = Math.max(0.75, pr - 0.25);
    else if (fps > 58 && pr < tope) pr = Math.min(tope, pr + 0.25);
    else return;
    renderer.setPixelRatio(pr);
    composer.setPixelRatio(pr);
  }

  const raton = new THREE.Vector2(), ratonSuave = new THREE.Vector2();
  addEventListener('pointermove', (e) => raton.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));

  const posCam = new THREE.Vector3(), mira = new THREE.Vector3(), objEstatua = new THREE.Vector3();
  function camino(p, t) {
    const u = uDeP(p);
    curvaPos.getPoint(u, posCam);
    curvaMira.getPoint(u, mira);
    // caminata: leve vaivén en la stoa
    const enStoa = 1 - suave(0.26, 0.32, p);
    posCam.x += Math.sin(posCam.z * 0.16) * 0.3 * enStoa;
    if (!quieto) posCam.y += Math.sin(posCam.z * 0.9) * 0.025 * enStoa;
    // al pasar junto a una estatua, la vista gira hacia ella
    for (const e of lugaresEstatua) {
      const dz = posCam.z - (e.z + 7.5);
      const peso = Math.exp(-(dz * dz) / 18) * enStoa * (camara.aspect < 0.8 ? 0.85 : 0.4);
      if (peso > 0.001) mira.lerp(objEstatua.set(e.x, 3.0, e.z), peso);
    }
    // en la puerta: respira y espera un poco más atrás
    posCam.y += Math.sin(t * 0.6) * 0.06 * (1 - entrada);
    posCam.z += (1 - suave(0, 1, entrada)) * 3;
  }

  // ——— Clic sobre los íconos ———
  const ray = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  let sobre = null;
  function iconoEn(e) {
    puntero.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(puntero, camara);
    return ray.intersectObjects(iconos.filter((s) => s.scale.x > 0.3), false)[0]?.object ?? null;
  }
  addEventListener('pointermove', (e) => {
    if (actual < 0.95) { sobre = null; return; }
    sobre = iconoEn(e);
    document.body.style.cursor = sobre ? 'pointer' : '';
  });
  addEventListener('click', (e) => {
    if (actual < 0.95 || e.target.closest('a, button, input')) return;
    const s = iconoEn(e);
    if (s) alAbrirApp(s.userData.id);
  });

  // ==================== Bucle ====================
  const reloj = new THREE.Clock();
  const colNiebla = new THREE.Color();
  const C_NOCHE = new THREE.Color(0x0a0806), C_COSMOS = new THREE.Color(0x0a0612), C_ALBA = new THREE.Color(0x1c1018);
  let pAnterior = 0;
  function cuadroEscena() {
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = reloj.elapsedTime;
    if (quieto) actual = objetivo;
    else {
      vel += (objetivo - actual) * 26 * dt;
      vel *= Math.exp(-10 * dt);
      actual += vel * dt;
      if (Math.abs(objetivo - actual) < 0.00005 && Math.abs(vel) < 0.0005) { actual = objetivo; vel = 0; }
    }
    if (dentro) entrada = Math.min(1, entrada + dt * 0.5);
    calidad(dt);
    ratonSuave.lerp(raton, 1 - Math.exp(-dt * 3));
    const p = actual;
    const rapidez = Math.min(1, Math.abs(p - pAnterior) / Math.max(dt, 0.001) * 3);
    pAnterior = p;

    // Fases
    const fTunel = tramo(0.33, 0.38, 0.55, 0.6, p);
    const fCosmos = tramo(0.55, 0.6, 0.8, 0.86, p);
    const fAlba = suave(0.78, 0.88, p);

    camino(p, t);
    camara.position.copy(posCam);
    mira.x += ratonSuave.x * 1.4;
    mira.y += ratonSuave.y * 0.8;
    camara.lookAt(mira);
    // en el túnel la vista gira sobre sí misma
    if (!quieto) camara.rotateZ(Math.sin(Math.PI * suave(0.35, 0.58, p)) * 1.1 + Math.sin(t * 0.5) * 0.04 * fTunel);
    const fov = fovBase + fTunel * 22 + rapidez * 6 * fTunel;
    if (Math.abs(camara.fov - fov) > 0.05) { camara.fov = fov; camara.updateProjectionMatrix(); }

    // Mostrar solo lo que está cerca (más liviano)
    const z = camara.position.z;
    const cruzado = z < Z_PORTAL - 0.3; // ya atravesó el portal
    stoa.visible = !cruzado;
    portal.visible = !cruzado;
    luzPortal.visible = !cruzado;
    tunel.visible = cruzado && z > -445;
    cosmos.visible = cruzado; // se ve a lo lejos por la salida del túnel y crece al acercarse
    isla.visible = z < -380;
    cielo.position.copy(camara.position);

    // Cielo, niebla y luces según la fase
    cieloMat.uniforms.uCosmos.value = suave(0.5, 0.6, p) * (1 - fAlba * 0.85);
    cieloMat.uniforms.uAlba.value = fAlba;
    cieloMat.uniforms.uTiempo.value = t;
    colNiebla.copy(C_NOCHE).lerp(C_COSMOS, suave(0.5, 0.6, p)).lerp(C_ALBA, fAlba);
    scene.fog.color.copy(colNiebla);
    scene.fog.density = 0.03 * (1 - suave(0.3, 0.37, p)) + 0.004 * suave(0.55, 0.62, p) * (1 - fAlba) + 0.0015 * fAlba;
    hemi.intensity = 0.55 + fCosmos * 0.1 + fAlba * 0.15;
    hemi.color.setHex(0x5a6a90).lerp(new THREE.Color(0xffc9a8), fAlba);
    luna.intensity = 0.7 * (1 - fCosmos);
    luzCosmos1.intensity = 260 * fCosmos;
    luzCosmos2.intensity = 200 * fCosmos;
    luzPortal.intensity = 40 * (1 - suave(0.37, 0.42, p));
    luzIsla.intensity = 35 * fAlba;

    // Animaciones
    matPolvo.uniforms.uTiempo.value = t;
    matFuego.uniforms.uTiempo.value = t;
    matFuego.uniforms.uEscala.value = renderer.getPixelRatio() * 2.4;
    velo.material.uniforms.uTiempo.value = t;
    aro.rotation.z = t * 0.2;
    aro2.rotation.z = -t * 0.12;
    tunelMat.uniforms.uTiempo.value = t;
    if (tunel.visible) moverFlotantes(t);
    gigante.rotation.y = t * 0.08 + p * 3;
    marmolGigante.emissiveIntensity = 0.35 + (1 - suave(0.56, 0.64, p)) * 1.2; // brilla al aparecer por la salida
    gigante.position.y = -9 + Math.sin(t * 0.5) * 0.4;
    corona.rotation.z = Math.sin(t * 0.3) * 0.05;
    anillo.rotation.y = t * 0.05;
    anillo.material.uniforms.uTiempo.value = t;
    nubes.forEach((n) => { n.userData.a += n.userData.v * dt; n.position.x = Math.cos(n.userData.a) * n.userData.r; n.position.z = Math.sin(n.userData.a) * n.userData.r - 6; });
    viaje.uniforms.uAberracion.value = 0.004 + fTunel * (0.012 + rapidez * 0.02) + fCosmos * 0.004;
    viaje.uniforms.uTiempo.value = t;
    bloom.threshold = 0.86 + fAlba * 0.06;

    // Luces reales en los braseros más cercanos
    const zc = z - 4;
    const cercanos = fuegoBases.filter((b) => b.real).sort((a, b) => Math.abs(a.z - zc) - Math.abs(b.z - zc));
    luces.forEach((l, i) => {
      const b = cercanos[i];
      if (!b) { l.intensity = 0; return; }
      l.position.set(b.x, 2.1, b.z);
      l.intensity = (30 + Math.sin(t * 9 + b.semilla) * 4 + Math.sin(t * 23 + b.semilla * 2) * 3) * suave(22, 7, Math.abs(b.z - zc));
    });

    // Cofre: se abre y salen las tres apps
    const abrir = suave(0.9, 0.95, p);
    const salir = suave(0.92, 0.99, p);
    bisagra.rotation.x = -abrir * 1.95;
    resplandor.material.opacity = abrir;
    luzCofre.intensity = abrir * 70 * (0.92 + Math.sin(t * 5) * 0.08);
    haz.material.uniforms.uFuerza.value = abrir;
    haz.material.uniforms.uTiempo.value = t;
    iconos.forEach((sp, i) => {
      const d = sp.userData;
      const s = suave(i * 0.08, 0.84 + i * 0.08, salir);
      const xF = (i - 1) * (camara.aspect < 0.8 ? 1.25 : 1.75);
      const yF = 3.6 + (i === 1 ? 0.25 : 0) + Math.sin(t * 1.4 + i * 2) * 0.06 * s;
      sp.position.set(mezcla(0, xF, s), mezcla(1.25, yF, s), mezcla(0, 0.6, s));
      d.hover += ((sobre === sp ? 1 : 0) - d.hover) * (1 - Math.exp(-dt * 10));
      const tam = (camara.aspect < 0.8 ? 0.95 : 1.15) * s * (1 + d.hover * 0.12);
      sp.scale.set(Math.max(tam, 0.001), Math.max(tam, 0.001), 1);
      sp.material.opacity = s;
      d.halo.position.copy(sp.position);
      d.halo.position.z -= 0.05;
      d.halo.scale.setScalar(Math.max(0.001, tam * (2.6 + d.hover * 0.6)));
      d.halo.material.opacity = s * (0.55 + d.hover * 0.35);
    });

    composer.render(dt);
    requestAnimationFrame(cuadroEscena);
  }
  requestAnimationFrame(cuadroEscena);

  return {
    irA(p) { objetivo = p; },
    avance() { return actual; },
    entrar() { dentro = true; },
  };
}
