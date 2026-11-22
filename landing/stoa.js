// Familia estoica · la stoa en 3D (Three.js). Todo se dibuja con código: sin modelos externos.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { APPS } from './config.js';

const PASO = 5.5; // distancia entre columnas
const N_COL = 21; // columnas por lado
const X_COL = 4.2;
const Z_FIN = 2 - (N_COL - 1) * PASO; // última columna (-108)
const Z_COFRE = -118;

const suave = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a + (b - a) * t;

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
  const NOCHE = 0x0a0806;
  scene.background = new THREE.Color(NOCHE);
  scene.fog = new THREE.FogExp2(NOCHE, 0.03);

  const camara = new THREE.PerspectiveCamera(movil ? 68 : 56, 1, 0.1, 400);

  // ——— Luz ———
  scene.add(new THREE.HemisphereLight(0x5a6a90, 0x1a1008, 0.55));
  const luna = new THREE.DirectionalLight(0xa9bcff, 0.7);
  luna.position.set(-30, 40, -20);
  scene.add(luna);

  // ——— Cielo con estrellas ———
  const cielo = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, fog: false, depthWrite: false,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; void main(){
        float h = clamp(vP.y, -0.2, 1.0);
        vec3 horizonte = vec3(0.16, 0.10, 0.05);
        vec3 alto = vec3(0.012, 0.016, 0.035);
        vec3 c = mix(horizonte, alto, smoothstep(0.0, 0.45, h));
        gl_FragColor = vec4(c, 1.0); }`,
    }),
  );
  scene.add(cielo);

  const nEst = movil ? 700 : 1600;
  const est = new Float32Array(nEst * 3);
  for (let i = 0; i < nEst; i++) {
    const a = Math.random() * Math.PI * 2, h = 0.08 + Math.random() * 0.9;
    const r = 260;
    est[i * 3] = Math.cos(a) * r * Math.sqrt(1 - h * h);
    est[i * 3 + 1] = h * r;
    est[i * 3 + 2] = Math.sin(a) * r * Math.sqrt(1 - h * h);
  }
  const gEst = new THREE.BufferGeometry();
  gEst.setAttribute('position', new THREE.BufferAttribute(est, 3));
  const estrellas = new THREE.Points(gEst, new THREE.PointsMaterial({ color: 0xfff3dc, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }));
  scene.add(estrellas);

  const lunaHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,236,200,1)'), fog: false, depthWrite: false, transparent: true }));
  lunaHalo.position.set(-70, 55, -180);
  lunaHalo.scale.set(26, 26, 1);
  lunaHalo.material.color.setScalar(0.75);
  scene.add(lunaHalo);

  // ——— Suelo ———
  const texSuelo = marmol(1024, '#3a3128', '#b9a47e', { baldosas: 4, junta: 'rgba(10,8,6,.85)' });
  texSuelo.repeat.set(2.4, 34);
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 150),
    new THREE.MeshStandardMaterial({ map: texSuelo, roughness: 0.28, metalness: 0.15 }),
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(0, 0, -62);
  scene.add(suelo);

  const tierra = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 1 }));
  tierra.rotation.x = -Math.PI / 2;
  tierra.position.y = -0.02;
  scene.add(tierra);

  // ——— Columnas (instanciadas) ———
  const texPiedra = marmol(512, '#cfc4b0', '#8a7b62');
  texPiedra.repeat.set(1, 2);
  const piedra = new THREE.MeshStandardMaterial({ map: texPiedra, color: 0xe8dcc6, roughness: 0.62, metalness: 0.02 });
  const partes = [
    { g: new THREE.CylinderGeometry(0.62, 0.68, 0.32, 40), y: 0.16 },
    { g: geometriaFuste(), y: 0.32 + 3.1 },
    { g: new THREE.CylinderGeometry(0.66, 0.42, 0.36, 40), y: 6.52 + 0.18 },
    { g: new THREE.BoxGeometry(1.5, 0.24, 1.5), y: 6.88 + 0.12 },
  ];
  const m = new THREE.Matrix4();
  for (const parte of partes) {
    const inst = new THREE.InstancedMesh(parte.g, piedra, N_COL * 2);
    let k = 0;
    for (let i = 0; i < N_COL; i++) {
      for (const lado of [-1, 1]) {
        m.makeTranslation(lado * X_COL, parte.y, 2 - i * PASO);
        inst.setMatrixAt(k++, m);
      }
    }
    scene.add(inst);
  }

  // ——— Entablamento, friso con inscripción y techo ———
  const largo = (N_COL - 1) * PASO + 3;
  const zMedio = (2 + Z_FIN) / 2;
  const texFriso = inscripcion();
  texFriso.repeat.set(largo / 16, 1);
  for (const lado of [-1, 1]) {
    const arq = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.72, largo), piedra);
    arq.position.set(lado * X_COL, 7.12 + 0.36, zMedio);
    scene.add(arq);
    const friso = new THREE.Mesh(new THREE.PlaneGeometry(largo, 0.6), new THREE.MeshStandardMaterial({ map: texFriso, roughness: 0.5, metalness: 0.3, emissive: 0x2a1a05, emissiveIntensity: 0.4 }));
    friso.position.set(lado * (X_COL - 0.71), 7.48, zMedio);
    friso.rotation.y = lado * -Math.PI / 2;
    scene.add(friso);
    const cornisa = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, largo + 0.6), piedra);
    cornisa.position.set(lado * X_COL, 7.98, zMedio);
    scene.add(cornisa);
  }
  const madera = new THREE.MeshStandardMaterial({ color: 0x1d140c, roughness: 0.9 });
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(10, largo), madera);
  techo.rotation.x = Math.PI / 2;
  techo.position.set(0, 8.12, zMedio);
  scene.add(techo);
  const vigas = new THREE.InstancedMesh(new THREE.BoxGeometry(9.4, 0.32, 0.36), madera, N_COL);
  for (let i = 0; i < N_COL; i++) { m.makeTranslation(0, 7.95, 2 - i * PASO); vigas.setMatrixAt(i, m); }
  scene.add(vigas);

  // ——— Cipreses afuera (siluetas) ———
  const nCip = movil ? 40 : 80;
  const cipreses = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 8), new THREE.MeshStandardMaterial({ color: 0x0b110b, roughness: 1 }), nCip);
  const q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3();
  for (let i = 0; i < nCip; i++) {
    const lado = i % 2 ? 1 : -1;
    const alto = 7 + Math.random() * 9;
    pos.set(lado * (11 + Math.random() * 30), alto / 2, 20 - Math.random() * 170);
    s.set(1.1 + Math.random() * 0.8, alto, 1.1 + Math.random() * 0.8);
    m.compose(pos, q, s);
    cipreses.setMatrixAt(i, m);
  }
  scene.add(cipreses);

  // ——— Braseros con fuego ———
  const bronce = new THREE.MeshStandardMaterial({ color: 0x8a6a35, roughness: 0.35, metalness: 0.9 });
  const zBraseros = [];
  for (let z = -3; z > Z_FIN; z -= movil ? 22 : 11) zBraseros.push(z);
  const fuegoBases = [];
  zBraseros.forEach((z, i) => {
    const lado = i % 2 ? 1 : -1;
    const x = lado * 3.05;
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.1, 12), bronce);
    pie.position.set(x, 0.55, z);
    const cuenco = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bronce);
    cuenco.position.set(x, 1.32, z);
    const brasa = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    brasa.rotation.x = -Math.PI / 2;
    brasa.position.set(x, 1.3, z);
    scene.add(pie, cuenco, brasa);
    const luz = new THREE.PointLight(0xff9440, 30, 16, 2);
    luz.position.set(x, 2.1, z);
    luz.userData.semilla = Math.random() * 100;
    scene.add(luz);
    fuegoBases.push({ x, y: 1.32, z, luz });
  });

  const porFuego = movil ? 70 : 120;
  const nFuego = fuegoBases.length * porFuego;
  const fBase = new Float32Array(nFuego * 3), fSem = new Float32Array(nFuego);
  fuegoBases.forEach((b, j) => {
    for (let i = 0; i < porFuego; i++) {
      const k = j * porFuego + i, a = Math.random() * Math.PI * 2, r = Math.random() * 0.24;
      fBase[k * 3] = b.x + Math.cos(a) * r; fBase[k * 3 + 1] = b.y; fBase[k * 3 + 2] = b.z + Math.sin(a) * r;
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
      void main(){
        float vida = fract(uTiempo * (0.55 + aSemilla * 0.6) + aSemilla * 7.0);
        vec3 p = position;
        float giro = aSemilla * 6.2831 + uTiempo * 2.3;
        p.x += sin(giro) * 0.10 * (1.0 - vida);
        p.z += cos(giro * 1.3) * 0.10 * (1.0 - vida);
        p.xz = mix(p.xz, p.xz + (vec2(0.0) - p.xz) * 0.0, vida);
        p.y += vida * (0.9 + aSemilla * 0.6);
        vVida = vida;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(uEscala * (1.0 - vida * 0.75) * (120.0 / -mv.z), 26.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `varying float vVida;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * (1.0 - vVida) * 0.9;
        vec3 c = mix(vec3(1.0, 0.86, 0.5), vec3(1.0, 0.28, 0.04), smoothstep(0.0, 0.7, vVida));
        gl_FragColor = vec4(c * 1.8, a);
      }`,
  });
  const fuego = new THREE.Points(gFuego, matFuego);
  fuego.frustumCulled = false;
  scene.add(fuego);

  // ——— Polvo dorado flotando ———
  const nPolvo = movil ? 500 : 1200;
  const pPolvo = new Float32Array(nPolvo * 3), sPolvo = new Float32Array(nPolvo);
  for (let i = 0; i < nPolvo; i++) {
    pPolvo[i * 3] = (Math.random() - 0.5) * 9;
    pPolvo[i * 3 + 1] = 0.2 + Math.random() * 7.5;
    pPolvo[i * 3 + 2] = 10 - Math.random() * 135;
    sPolvo[i] = Math.random();
  }
  const gPolvo = new THREE.BufferGeometry();
  gPolvo.setAttribute('position', new THREE.BufferAttribute(pPolvo, 3));
  gPolvo.setAttribute('aSemilla', new THREE.BufferAttribute(sPolvo, 1));
  const matPolvo = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTiempo: { value: 0 } },
    vertexShader: `uniform float uTiempo; attribute float aSemilla; varying float vBrillo;
      void main(){
        vec3 p = position;
        float t = uTiempo * 0.18 + aSemilla * 40.0;
        p.x += sin(t) * 0.45; p.y += sin(t * 0.7 + 1.3) * 0.35; p.z += cos(t * 0.5) * 0.4;
        vBrillo = 0.45 + 0.55 * sin(uTiempo * 1.7 + aSemilla * 30.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min((1.5 + aSemilla * 2.5) * (26.0 / -mv.z), 5.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `varying float vBrillo;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.48) * 1.4, smoothstep(0.5, 0.0, d) * 0.55 * vBrillo); }`,
  });
  const polvo = new THREE.Points(gPolvo, matPolvo);
  polvo.frustumCulled = false;
  scene.add(polvo);

  // ——— El altar, el cuadro del filósofo y el cofre ———
  const altar = new THREE.Group();
  altar.position.set(0, 0, Z_COFRE);
  scene.add(altar);
  [[7, 0], [5.6, 0.26], [4.2, 0.52]].forEach(([ancho, y]) => {
    const esc = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.26, ancho * 0.7), piedra);
    esc.position.y = y + 0.13;
    altar.add(esc);
  });

  const texCuadro = new THREE.TextureLoader().load('img/portada-filosofo.webp');
  texCuadro.colorSpace = THREE.SRGBColorSpace;
  const cuadro = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 7.2), new THREE.MeshStandardMaterial({ map: texCuadro, roughness: 0.9, color: 0x8d8270 }));
  cuadro.position.set(0, 4.6, -8.6);
  altar.add(cuadro);
  const oro = new THREE.MeshStandardMaterial({ color: 0xd8a84a, roughness: 0.28, metalness: 1, emissive: 0x3a2405, emissiveIntensity: 0.4 });
  for (const [w, h, x, y] of [[13.2, 0.2, 0, 8.3], [13.2, 0.2, 0, 0.9], [0.2, 7.6, -6.5, 4.6], [0.2, 7.6, 6.5, 4.6]]) {
    const marco = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), oro);
    marco.position.set(x, y, -8.5);
    altar.add(marco);
  }
  const muro = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshStandardMaterial({ color: 0x1b1611, roughness: 1 }));
  muro.position.set(0, 7, -8.75);
  altar.add(muro);

  const cofre = new THREE.Group();
  cofre.position.y = 0.78;
  altar.add(cofre);
  const maderaCofre = new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.55, metalness: 0.2 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.85, 1.05), maderaCofre);
  cuerpo.position.y = 0.425;
  cofre.add(cuerpo);
  for (const [w, h, d, x, y, z] of [
    [1.76, 0.08, 1.1, 0, 0.04, 0], [1.76, 0.08, 1.1, 0, 0.82, 0],
    [0.08, 0.86, 1.1, -0.82, 0.43, 0], [0.08, 0.86, 1.1, 0.82, 0.43, 0],
    [0.22, 0.26, 0.06, 0, 0.7, 0.54],
  ]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), oro);
    b.position.set(x, y, z);
    cofre.add(b);
  }
  // Tapa con bisagra atrás
  const bisagra = new THREE.Group();
  bisagra.position.set(0, 0.85, -0.525);
  cofre.add(bisagra);
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.525, 0.525, 1.7, 32, 1, false, 0, Math.PI), maderaCofre);
  tapa.rotation.z = Math.PI / 2;
  tapa.rotation.y = Math.PI / 2;
  tapa.position.set(0, 0, 0.525);
  bisagra.add(tapa);
  for (const x of [-0.82, 0, 0.82]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 8, 32, Math.PI), oro);
    aro.rotation.y = Math.PI / 2;
    aro.position.set(x, 0, 0.525);
    bisagra.add(aro);
  }
  // Brillo del tesoro
  const resplandor = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.98), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 }));
  resplandor.rotation.x = -Math.PI / 2;
  resplandor.position.y = 0.8;
  cofre.add(resplandor);
  const luzCofre = new THREE.PointLight(0xffc35a, 0, 14, 2);
  luzCofre.position.set(0, 1.6, 0.2);
  cofre.add(luzCofre);
  const haz = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 0.75, 9, 48, 1, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uFuerza: { value: 0 }, uTiempo: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uFuerza; uniform float uTiempo; varying vec2 vUv;
        void main(){ float rayas = 0.6 + 0.4 * sin(vUv.x * 60.0 + uTiempo * 0.8) * sin(vUv.x * 23.0 - uTiempo * 0.5);
          float a = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.08, 1.0 - vUv.y) * rayas * 0.22 * uFuerza;
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a, a); }`,
    }),
  );
  haz.position.y = 0.85 + 4.5;
  cofre.add(haz);

  // ——— Los íconos que salen del cofre ———
  const iconos = APPS.map((a, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconoTextura(a.id), transparent: true, depthWrite: false, fog: false }));
    sp.userData = { id: a.id, i, hover: 0 };
    sp.scale.setScalar(0.001);
    altar.add(sp);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo('rgba(255,205,110,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.userData.halo = h;
    altar.add(h);
    return sp;
  });

  // ——— Posprocesado: brillo (bloom) ———
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camara));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), movil ? 0.5 : 0.6, 0.5, 0.86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function medir() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camara.aspect = w / h;
    camara.fov = w / h < 0.8 ? 70 : 56;
    camara.updateProjectionMatrix();
  }
  medir();
  addEventListener('resize', medir);

  // ——— Recorrido de la cámara ———
  let objetivo = 0, actual = 0, entrada = 0, dentro = false;
  const raton = new THREE.Vector2(), ratonSuave = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    raton.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });

  const posCam = new THREE.Vector3(), mira = new THREE.Vector3();
  function camino(p, t) {
    const caminar = suave(0, 0.86, p);
    const llegar = suave(0.84, 0.94, p);
    const subir = suave(0.93, 1, p);
    const zCaminar = mezcla(9, Z_FIN + 3, caminar);
    let z = mezcla(zCaminar, Z_COFRE + 7.2, llegar);
    z = mezcla(z, Z_COFRE + 8, subir);
    const paso = caminar * (1 - llegar);
    const x = Math.sin(zCaminar * 0.22) * 0.35 * paso;
    let y = 1.72 + (quieto ? 0 : Math.sin(zCaminar * 1.15) * 0.035 * paso);
    y = mezcla(y, 2.05, llegar);
    y = mezcla(y, 2.25, subir);
    posCam.set(x, y, z);
    const mz = mezcla(z - 25, Z_COFRE, llegar);
    let my = mezcla(2.5, 1.55, llegar);
    my = mezcla(my, 2.55, subir);
    mira.set(x * 0.3, my, mz);
    // en la puerta: respira y espera un poco más atrás; al entrar avanza suave
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
    const hit = ray.intersectObjects(iconos.filter((s) => s.scale.x > 0.3), false)[0];
    return hit?.object ?? null;
  }
  canvas.style.pointerEvents = 'auto';
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

  // ——— Bucle ———
  const reloj = new THREE.Clock();
  function cuadroEscena() {
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = reloj.elapsedTime;
    actual += (objetivo - actual) * (1 - Math.exp(-dt * (quieto ? 12 : 4.2)));
    if (dentro) entrada = Math.min(1, entrada + dt * 0.5);
    ratonSuave.lerp(raton, 1 - Math.exp(-dt * 3));

    camino(actual, t);
    camara.position.copy(posCam);
    mira.x += ratonSuave.x * 1.6;
    mira.y += ratonSuave.y * 0.9;
    camara.lookAt(mira);

    matFuego.uniforms.uTiempo.value = t;
    matFuego.uniforms.uEscala.value = renderer.getPixelRatio() * 2.4;
    matPolvo.uniforms.uTiempo.value = t;
    for (const b of fuegoBases) {
      const sem = b.luz.userData.semilla;
      b.luz.intensity = 26 + Math.sin(t * 9 + sem) * 4 + Math.sin(t * 23 + sem * 2) * 3;
    }

    // Cofre: se abre y salen las tres apps
    const abrir = suave(0.86, 0.94, actual);
    const salir = suave(0.9, 0.985, actual);
    bisagra.rotation.x = -abrir * 1.95;
    resplandor.material.opacity = abrir;
    luzCofre.intensity = abrir * 70 * (0.92 + Math.sin(t * 5) * 0.08);
    haz.material.uniforms.uFuerza.value = abrir;
    haz.material.uniforms.uTiempo.value = t;
    iconos.forEach((sp, i) => {
      const d = sp.userData;
      const s = suave(i * 0.08, 0.84 + i * 0.08, salir);
      const xF = (i - 1) * (camara.aspect < 0.8 ? 1.25 : 1.75);
      const yF = 3.45 + (i === 1 ? 0.25 : 0) + Math.sin(t * 1.4 + i * 2) * 0.06 * s;
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
